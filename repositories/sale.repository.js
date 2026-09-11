
// file: repositories/sale.repository.js

import pool from "@/lib/database";

const SaleRepository = {
    // =========================================================
    // PRODUCTS
    // =========================================================

    async getProductForSale(
        client,
        productId,
        accountId,
        branchId
    ) {
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
            [
                productId,
                accountId,
                branchId,
            ]
        );

        return result.rows[0] ?? null;
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
            [
                productId,
                quantity,
            ]
        );

        return result.rows[0] ?? null;
    },

    // =========================================================
    // BRANCH
    // =========================================================

    async getBranchForAccount(
        client,
        branchId,
        accountId
    ) {
        const result = await client.query(
            `
            SELECT
                id,
                account_id,
                name,
                description,
                status,
                created_at,
                updated_at
            FROM branches
            WHERE id = $1
              AND account_id = $2
              AND status = 'active'
            `,
            [
                branchId,
                accountId,
            ]
        );

        return result.rows[0] ?? null;
    },

    // =========================================================
    // SALES
    // =========================================================

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
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8
            )
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

    async getSaleById(
        client,
        saleId,
        accountId
    ) {
        const result = await client.query(
            `
            SELECT
                s.id,
                s.account_id,
                s.branch_id,

                s.customer_name,
                s.notes,

                s.subtotal,
                s.total_amount,
                s.payment_status,

                s.created_by_user_id,
                s.created_at,
                s.updated_at,

                b.name AS branch_name,

                u.name AS employee_name,

                COALESCE(
                    (
                        SELECT SUM(sp.amount)
                        FROM sale_payments sp
                        WHERE sp.sale_id = s.id
                    ),
                    0
                ) AS paid_amount,

                GREATEST(
                    s.total_amount -
                    COALESCE(
                        (
                            SELECT SUM(sp.amount)
                            FROM sale_payments sp
                            WHERE sp.sale_id = s.id
                        ),
                        0
                    ),
                    0
                ) AS remaining_amount,

                COALESCE(
                    (
                        SELECT json_agg(
                            json_build_object(
                                'id', si.id,
                                'productId', si.product_id,
                                'productName', si.product_name,
                                'quantity', si.quantity,
                                'pricePerItem', si.price_per_item,
                                'totalAmount', si.total_amount,
                                'createdAt', si.created_at
                            )
                            ORDER BY si.created_at
                        )
                        FROM sale_items si
                        WHERE si.sale_id = s.id
                    ),
                    '[]'::json
                ) AS items,

                COALESCE(
                    (
                        SELECT json_agg(
                            json_build_object(
                                'id', sp.id,
                                'amount', sp.amount,
                                'paymentMethod', sp.payment_method,
                                'createdByUserId',
                                    sp.created_by_user_id,
                                'createdAt', sp.created_at
                            )
                            ORDER BY sp.created_at
                        )
                        FROM sale_payments sp
                        WHERE sp.sale_id = s.id
                    ),
                    '[]'::json
                ) AS payments

            FROM sales s

            INNER JOIN branches b
                ON b.id = s.branch_id
               AND b.account_id = s.account_id

            INNER JOIN users u
                ON u.id = s.created_by_user_id

            WHERE s.id = $1
              AND s.account_id = $2
            `,
            [
                saleId,
                accountId,
            ]
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

        const result = await client.query(
            `
            SELECT
                s.id,
                s.account_id,
                s.branch_id,

                s.customer_name,
                s.notes,

                s.subtotal,
                s.total_amount,
                s.payment_status,

                s.created_by_user_id,
                s.created_at,
                s.updated_at,

                b.name AS branch_name,

                u.name AS employee_name,

                COALESCE(
                    payment_summary.paid_amount,
                    0
                ) AS paid_amount,

                GREATEST(
                    s.total_amount -
                    COALESCE(
                        payment_summary.paid_amount,
                        0
                    ),
                    0
                ) AS remaining_amount,

                COALESCE(
                    item_summary.item_count,
                    0
                ) AS item_count

            FROM sales s

            INNER JOIN branches b
                ON b.id = s.branch_id
               AND b.account_id = s.account_id

            INNER JOIN users u
                ON u.id = s.created_by_user_id

            LEFT JOIN LATERAL (
                SELECT
                    SUM(sp.amount) AS paid_amount
                FROM sale_payments sp
                WHERE sp.sale_id = s.id
            ) payment_summary
                ON TRUE

            LEFT JOIN LATERAL (
                SELECT
                    SUM(si.quantity) AS item_count
                FROM sale_items si
                WHERE si.sale_id = s.id
            ) item_summary
                ON TRUE

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

              AND (
                    $4::uuid IS NULL
                    OR s.branch_id = $4
              )

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
                    OR u.name ILIKE $7
                    OR b.name ILIKE $7
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
                    OR s.created_at < $9
              )

            ORDER BY s.created_at DESC

            LIMIT $10
            OFFSET $11
            `,
            [
                accountId,
                isCreator,
                userId,
                branchId ?? null,
                employeeId ?? null,
                paymentStatus ?? null,
                search
                    ? `%${search}%`
                    : null,
                dateFrom ?? null,
                dateTo ?? null,
                limit,
                offset,
            ]
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
            SELECT
                COUNT(*)::integer AS count

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

              AND (
                    $4::uuid IS NULL
                    OR s.branch_id = $4
              )

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
                    OR u.name ILIKE $7
                    OR b.name ILIKE $7
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
                    OR s.created_at < $9
              )
            `,
            [
                accountId,
                isCreator,
                userId,
                branchId ?? null,
                employeeId ?? null,
                paymentStatus ?? null,
                search
                    ? `%${search}%`
                    : null,
                dateFrom ?? null,
                dateTo ?? null,
            ]
        );

        return result.rows[0]?.count ?? 0;
    },

    // =========================================================
    // SALE ITEMS
    // =========================================================

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
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6
            )
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

    // =========================================================
    // SALE PAYMENTS
    // =========================================================

    async createSalePayment(
        client,
        {
            saleId,
            amount,
            paymentMethod,
            createdByUserId,
        }
    ) {
        const result = await client.query(
            `
            INSERT INTO sale_payments (
                sale_id,
                amount,
                payment_method,
                created_by_user_id
            )
            VALUES (
                $1,
                $2,
                $3,
                $4
            )
            RETURNING *
            `,
            [
                saleId,
                amount,
                paymentMethod,
                createdByUserId,
            ]
        );

        return result.rows[0];
    },

    async getSalePayments(
        client,
        saleId
    ) {
        const result = await client.query(
            `
            SELECT
                sp.*,
                u.name AS employee_name
            FROM sale_payments sp

            INNER JOIN users u
                ON u.id = sp.created_by_user_id

            INNER JOIN sales s
                ON s.id = sp.sale_id

            WHERE sp.sale_id = $1

            ORDER BY sp.created_at ASC
            `,
            [saleId]
        );

        return result.rows;
    },

    async getSalePaidAmount(
        client,
        saleId
    ) {
        const result = await client.query(
            `
            SELECT
                COALESCE(
                    SUM(amount),
                    0
                ) AS paid_amount
            FROM sale_payments
            WHERE sale_id = $1
            `,
            [saleId]
        );

        return result.rows[0]?.paid_amount ?? 0;
    },

    // =========================================================
    // SETTLEMENTS
    // =========================================================

    async createSettlement(
        client,
        {
            accountId,
            branchId,
            amount,
            notes,
            requestedByUserId,
        }
    ) {
        const result = await client.query(
            `
            INSERT INTO sale_settlements (
                account_id,
                branch_id,
                amount,
                status,
                requested_by_user_id,
                requested_at,
                notes
            )
            VALUES (
                $1,
                $2,
                $3,
                'requested',
                $4,
                NOW(),
                $5
            )
            RETURNING *
            `,
            [
                accountId,
                branchId,
                amount,
                requestedByUserId,
                notes ?? null,
            ]
        );

        return result.rows[0];
    },

    async getSettlementById(
        client,
        settlementId,
        accountId
    ) {
        const result = await client.query(
            `
            SELECT
                ss.*,

                b.name AS branch_name,

                requester.name AS requested_by_name,

                receiver.name AS received_by_name

            FROM sale_settlements ss

            INNER JOIN branches b
                ON b.id = ss.branch_id
               AND b.account_id = ss.account_id

            LEFT JOIN users requester
                ON requester.id = ss.requested_by_user_id

            LEFT JOIN users receiver
                ON receiver.id = ss.received_by_user_id

            WHERE ss.id = $1
              AND ss.account_id = $2
            `,
            [
                settlementId,
                accountId,
            ]
        );

        return result.rows[0] ?? null;
    },

    async getSettlements(
        client,
        {
            accountId,
            branchId,
            status,
            page,
            limit,
        }
    ) {
        const offset = (page - 1) * limit;

        const result = await client.query(
            `
            SELECT
                ss.id,
                ss.account_id,
                ss.branch_id,

                ss.amount,
                ss.status,

                ss.requested_by_user_id,
                ss.requested_at,

                ss.received_by_user_id,
                ss.received_at,

                ss.notes,

                ss.created_at,
                ss.updated_at,

                b.name AS branch_name,

                requester.name AS requested_by_name,

                receiver.name AS received_by_name

            FROM sale_settlements ss

            INNER JOIN branches b
                ON b.id = ss.branch_id
               AND b.account_id = ss.account_id

            LEFT JOIN users requester
                ON requester.id = ss.requested_by_user_id

            LEFT JOIN users receiver
                ON receiver.id = ss.received_by_user_id

            WHERE ss.account_id = $1

              AND (
                    $2::uuid IS NULL
                    OR ss.branch_id = $2
              )

              AND (
                    $3::varchar IS NULL
                    OR ss.status = $3
              )

            ORDER BY ss.created_at DESC

            LIMIT $4
            OFFSET $5
            `,
            [
                accountId,
                branchId ?? null,
                status ?? null,
                limit,
                offset,
            ]
        );

        return result.rows;
    },

    async countSettlements(
        client,
        {
            accountId,
            branchId,
            status,
        }
    ) {
        const result = await client.query(
            `
            SELECT
                COUNT(*)::integer AS count
            FROM sale_settlements
            WHERE account_id = $1

              AND (
                    $2::uuid IS NULL
                    OR branch_id = $2
              )

              AND (
                    $3::varchar IS NULL
                    OR status = $3
              )
            `,
            [
                accountId,
                branchId ?? null,
                status ?? null,
            ]
        );

        return result.rows[0]?.count ?? 0;
    },

    async updateSettlementStatus(
        client,
        {
            settlementId,
            accountId,
            status,
            receivedByUserId,
        }
    ) {
        const result = await client.query(
            `
            UPDATE sale_settlements
            SET
                status = $3,
                received_by_user_id =
                    CASE
                        WHEN $3 = 'received'
                        THEN $4
                        ELSE received_by_user_id
                    END,
                received_at =
                    CASE
                        WHEN $3 = 'received'
                        THEN NOW()
                        ELSE received_at
                    END,
                updated_at = NOW()
            WHERE id = $1
              AND account_id = $2
            RETURNING *
            `,
            [
                settlementId,
                accountId,
                status,
                receivedByUserId ?? null,
            ]
        );

        return result.rows[0] ?? null;
    },

    // =========================================================
    // BRANCH SETTLEMENT TOTALS
    // =========================================================

    async getBranchSettlementTotals(
        client,
        accountId,
        branchId
    ) {
        const result = await client.query(
            `
            SELECT
                COALESCE(
                    SUM(
                        CASE
                            WHEN status = 'requested'
                            THEN amount
                            ELSE 0
                        END
                    ),
                    0
                ) AS requested_amount,

                COALESCE(
                    SUM(
                        CASE
                            WHEN status = 'received'
                            THEN amount
                            ELSE 0
                        END
                    ),
                    0
                ) AS received_amount

            FROM sale_settlements

            WHERE account_id = $1
              AND branch_id = $2
              AND status IN (
                  'requested',
                  'received'
              )
            `,
            [
                accountId,
                branchId,
            ]
        );

        return result.rows[0];
    },
};

export default SaleRepository;