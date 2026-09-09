
// file: repositories/sale.repository.js

import pool from "@/lib/database";

const SaleRepository = {
    async getProductForSale(client, productId, accountId, branchId) {
        const result = await client.query(
            `
            SELECT
                p.id,
                p.account_id,
                p.branch_id,
                p.name,
                p.selling_price,
                p.stock,
                p.status
            FROM products p
            WHERE p.id = $1
              AND p.account_id = $2
              AND p.branch_id = $3
            FOR UPDATE
            `,
            [productId, accountId, branchId]
        );

        return result.rows[0] ?? null;
    },

    async createSale(
        client,
        {
            accountId,
            branchId,
            customerName,
            notes,
            subtotal,
            totalAmount,
            paymentStatus,
            createdByUserId,
        }
    ) {
        const result = await client.query(
            `
            INSERT INTO sales (
                account_id,
                branch_id,
                customer_name,
                notes,
                subtotal,
                total_amount,
                payment_status,
                created_by_user_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
            `,
            [
                accountId,
                branchId,
                customerName ?? null,
                notes ?? null,
                subtotal,
                totalAmount,
                paymentStatus,
                createdByUserId,
            ]
        );

        return result.rows[0];
    },

    async createSaleItem(
        client,
        {
            saleId,
            productId,
            productName,
            quantity,
            pricePerItem,
            totalAmount,
        }
    ) {
        const result = await client.query(
            `
            INSERT INTO sale_items (
                sale_id,
                product_id,
                product_name,
                quantity,
                price_per_item,
                total_amount
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            `,
            [
                saleId,
                productId,
                productName,
                quantity,
                pricePerItem,
                totalAmount,
            ]
        );

        return result.rows[0];
    },

    async decreaseProductStock(
        client,
        productId,
        quantity
    ) {
        const result = await client.query(
            `
            UPDATE products
            SET
                stock = stock - $2,
                updated_at = NOW()
            WHERE id = $1
              AND stock >= $2
            RETURNING *
            `,
            [productId, quantity]
        );

        return result.rows[0] ?? null;
    },

    async getSaleById(client, saleId, accountId) {
        const result = await client.query(
            `
        SELECT
            s.*,
            b.name AS branch_name,
            u.name AS employee_name,

            COALESCE(
                (
                    SELECT SUM(p.amount)
                    FROM payments p
                    WHERE p.sale_id = s.id
                      AND p.payment_type = 'sale_payment'
                ),
                0
            ) AS paid_amount,

            COALESCE(
                json_agg(
                    json_build_object(
                        'id', si.id,
                        'productId', si.product_id,
                        'productName', si.product_name,
                        'quantity', si.quantity,
                        'pricePerItem', si.price_per_item,
                        'totalAmount', si.total_amount
                    )
                    ORDER BY si.created_at
                ) FILTER (WHERE si.id IS NOT NULL),
                '[]'
            ) AS items

        FROM sales s

        INNER JOIN branches b
            ON b.id = s.branch_id
           AND b.account_id = s.account_id

        INNER JOIN users u
            ON u.id = s.created_by_user_id

        LEFT JOIN sale_items si
            ON si.sale_id = s.id

        WHERE s.id = $1
          AND s.account_id = $2

        GROUP BY s.id, b.name, u.name
        `,
            [saleId, accountId]
        );

        return result.rows[0] ?? null;
    },
    async getSales(
        client,
        {
            accountId,
            userId,
            isCreator,
            branchId,
            employeeId,
            paymentStatus,
            search,
            dateFrom,
            dateTo,
            page,
            limit,
        }
    ) {
        const offset = (page - 1) * limit;

        const params = [
            accountId,                    // $1
            isCreator,                    // $2
            userId,                       // $3
            branchId ?? null,             // $4
            employeeId ?? null,           // $5
            paymentStatus ?? null,        // $6
            search ? `%${search}%` : null, // $7
            dateFrom ?? null,             // $8
            dateTo ?? null,               // $9
            limit,                        // $10
            offset,                       // $11
        ];

        const result = await client.query(
            `
        SELECT
            s.*,

            b.name AS branch_name,

            u.name AS employee_name,

            COALESCE(
                (
                    SELECT SUM(p.amount)
                    FROM payments p
                    WHERE p.sale_id = s.id
                      AND p.payment_type = 'sale_payment'
                ),
                0
            ) AS paid_amount,

            GREATEST(
                s.total_amount -
                COALESCE(
                    (
                        SELECT SUM(p.amount)
                        FROM payments p
                        WHERE p.sale_id = s.id
                          AND p.payment_type = 'sale_payment'
                    ),
                    0
                ),
                0
            ) AS remaining_amount,

            COALESCE(
                (
                    SELECT SUM(si.quantity)
                    FROM sale_items si
                    WHERE si.sale_id = s.id
                ),
                0
            ) AS item_count

        FROM sales s

        INNER JOIN branches b
            ON b.id = s.branch_id
           AND b.account_id = s.account_id

        INNER JOIN users u
            ON u.id = s.created_by_user_id

        WHERE s.account_id = $1

          AND (
                $2::boolean = TRUE
                OR EXISTS (
                    SELECT 1
                    FROM branch_memberships bm
                    JOIN branch_membership_permissions bmp
                        ON bmp.branch_membership_id = bm.id
                    JOIN permissions p
                        ON p.id = bmp.permission_id
                    WHERE bm.user_id = $3
                      AND bm.branch_id = s.branch_id
                      AND bm.status = 'active'
                      AND p.key = 'sales.view'
                )
          )

          AND ($4::uuid IS NULL OR s.branch_id = $4)

          AND (
                $5::uuid IS NULL
                OR s.created_by_user_id = $5
          )

          AND (
                $6::varchar IS NULL
                OR s.payment_status = $6
          )

          AND (
                $7::varchar IS NULL
                OR s.customer_name ILIKE $7
                OR s.notes ILIKE $7
                OR b.name ILIKE $7
                OR u.name ILIKE $7
                OR EXISTS (
                    SELECT 1
                    FROM sale_items si
                    WHERE si.sale_id = s.id
                      AND si.product_name ILIKE $7
                )
          )

          AND (
                $8::timestamptz IS NULL
                OR s.created_at >= $8
          )

          AND (
                $9::timestamptz IS NULL
                OR s.created_at < ($9::timestamptz + INTERVAL '1 day')
          )

        ORDER BY s.created_at DESC

        LIMIT $10
        OFFSET $11
        `,
            params
        );

        return result.rows;
    },

    async countSales(
        client,
        {
            accountId,
            userId,
            isCreator,
            branchId,
            employeeId,
            paymentStatus,
            search,
            dateFrom,
            dateTo,
        }
    ) {
        const result = await client.query(
            `
        SELECT COUNT(*)::integer AS count

        FROM sales s

        INNER JOIN branches b
            ON b.id = s.branch_id
           AND b.account_id = s.account_id

        INNER JOIN users u
            ON u.id = s.created_by_user_id

        WHERE s.account_id = $1

          AND (
                $2::boolean = TRUE
                OR EXISTS (
                    SELECT 1
                    FROM branch_memberships bm
                    JOIN branch_membership_permissions bmp
                        ON bmp.branch_membership_id = bm.id
                    JOIN permissions p
                        ON p.id = bmp.permission_id
                    WHERE bm.user_id = $3
                      AND bm.branch_id = s.branch_id
                      AND bm.status = 'active'
                      AND p.key = 'sales.view'
                )
          )

          AND ($4::uuid IS NULL OR s.branch_id = $4)

          AND (
                $5::uuid IS NULL
                OR s.created_by_user_id = $5
          )

          AND (
                $6::varchar IS NULL
                OR s.payment_status = $6
          )

          AND (
                $7::varchar IS NULL
                OR s.customer_name ILIKE $7
                OR s.notes ILIKE $7
                OR b.name ILIKE $7
                OR u.name ILIKE $7
                OR EXISTS (
                    SELECT 1
                    FROM sale_items si
                    WHERE si.sale_id = s.id
                      AND si.product_name ILIKE $7
                )
          )

          AND (
                $8::timestamptz IS NULL
                OR s.created_at >= $8
          )

          AND (
                $9::timestamptz IS NULL
                OR s.created_at < ($9::timestamptz + INTERVAL '1 day')
          )
        `,
            [
                accountId,
                isCreator,
                userId,
                branchId ?? null,
                employeeId ?? null,
                paymentStatus ?? null,
                search ? `%${search}%` : null,
                dateFrom ?? null,
                dateTo ?? null,
            ]
        );

        return result.rows[0]?.count ?? 0;
    },

    async getBranchForAccount(
        client,
        branchId,
        accountId
    ) {
        const result = await client.query(
            `
            SELECT *
            FROM branches
            WHERE id = $1
              AND account_id = $2
              AND status = 'active'
            `,
            [branchId, accountId]
        );

        return result.rows[0] ?? null;
    },
};

export default SaleRepository;