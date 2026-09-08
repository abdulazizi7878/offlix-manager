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

    async getSaleById(
        client,
        saleId,
        accountId
    ) {
        const result = await client.query(
            `
            SELECT
                s.*,
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
            LEFT JOIN sale_items si
                ON si.sale_id = s.id
            WHERE s.id = $1
              AND s.account_id = $2
            GROUP BY s.id
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
            paymentStatus,
            search,
            page,
            limit,
        }
    ) {
        const offset = (page - 1) * limit;

        const params = [
            accountId,
            isCreator,
            userId,
            branchId ?? null,
            paymentStatus ?? null,
            search ? `%${search}%` : null,
            limit,
            offset,
        ];

        const result = await client.query(
            `
        SELECT
            s.*,
            COALESCE(
                (
                    SELECT SUM(si.quantity)
                    FROM sale_items si
                    WHERE si.sale_id = s.id
                ),
                0
            ) AS item_count
        FROM sales s
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
                $5::varchar IS NULL
                OR s.payment_status = $5
          )
          AND (
                $6::varchar IS NULL
                OR s.customer_name ILIKE $6
                OR s.notes ILIKE $6
                OR EXISTS (
                    SELECT 1
                    FROM sale_items si
                    WHERE si.sale_id = s.id
                      AND si.product_name ILIKE $6
                )
          )
        ORDER BY s.created_at DESC
        LIMIT $7
        OFFSET $8
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
            paymentStatus,
            search,
        }
    ) {
        const result = await client.query(
            `
        SELECT COUNT(*)::integer AS count
        FROM sales s
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
                $5::varchar IS NULL
                OR s.payment_status = $5
          )
          AND (
                $6::varchar IS NULL
                OR s.customer_name ILIKE $6
                OR s.notes ILIKE $6
                OR EXISTS (
                    SELECT 1
                    FROM sale_items si
                    WHERE si.sale_id = s.id
                      AND si.product_name ILIKE $6
                )
          )
        `,
            [
                accountId,
                isCreator,
                userId,
                branchId ?? null,
                paymentStatus ?? null,
                search ? `%${search}%` : null,
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