// file: repositories/purchase.repository.js

const PurchaseRepository = {
    async getPurchasesByAccountId(
        client,
        accountId,
        userId,
        isCreator,
        options = {}
    ) {
        const {
            page = 1,
            limit = 20,
            search = null,
            branchId = null,
            productId = null,
            paymentSource = null,
            from = null,
            to = null,
        } = options;

        const values = [accountId];

        const conditions = [
            "bp.account_id = $1",
        ];

        let parameterIndex = 2;

        /*
         * Non-creators can only see purchases belonging
         * to branches where they have products.view.
         */
        if (!isCreator) {
            conditions.push(
                `
                EXISTS (
                    SELECT 1
                    FROM branch_memberships bm
                    INNER JOIN branch_membership_permissions bmp
                        ON bmp.branch_membership_id = bm.id
                    INNER JOIN permissions permission
                        ON permission.id = bmp.permission_id
                    WHERE bm.user_id = $${parameterIndex}
                        AND bm.branch_id = bp.branch_id
                        AND bm.status = 'active'
                        AND permission.key = 'products.view'
                )
                `
            );

            values.push(userId);
            parameterIndex++;
        }

        if (branchId) {
            conditions.push(
                `bp.branch_id = $${parameterIndex}`
            );

            values.push(branchId);
            parameterIndex++;
        }

        if (productId) {
            conditions.push(
                `bp.product_id = $${parameterIndex}`
            );

            values.push(productId);
            parameterIndex++;
        }

        if (paymentSource) {
            conditions.push(
                `bp.payment_source = $${parameterIndex}`
            );

            values.push(paymentSource);
            parameterIndex++;
        }

        if (from) {
            conditions.push(
                `bp.created_at >= $${parameterIndex}`
            );

            values.push(from);
            parameterIndex++;
        }

        if (to) {
            conditions.push(
                `bp.created_at < $${parameterIndex}`
            );

            values.push(to);
            parameterIndex++;
        }

        if (search) {
            conditions.push(
                `
                (
                    bp.product_name ILIKE $${parameterIndex}
                    OR COALESCE(
                        bp.notes,
                        ''
                    ) ILIKE $${parameterIndex}
                    OR COALESCE(
                        b.name,
                        ''
                    ) ILIKE $${parameterIndex}
                )
                `
            );

            values.push(`%${search}%`);
            parameterIndex++;
        }

        const offset = (page - 1) * limit;

        const limitIndex = parameterIndex;

        values.push(limit);
        parameterIndex++;

        const offsetIndex = parameterIndex;

        values.push(offset);

        const result = await client.query(
            `
            SELECT
                bp.id,
                bp.account_id,
                bp.branch_id,
                bp.product_id,
                bp.product_name,
                bp.quantity,
                bp.cost_price,
                bp.payment_source,
                bp.notes,
                bp.created_by_user_id,
                bp.created_at,

                b.name AS branch_name,

                u.name AS created_by_name,
                u.email AS created_by_email

            FROM branch_purchases bp

            INNER JOIN branches b
                ON b.id = bp.branch_id
                AND b.account_id = bp.account_id

            INNER JOIN users u
                ON u.id = bp.created_by_user_id

            WHERE ${conditions.join(" AND ")}

            ORDER BY
                bp.created_at DESC,
                bp.id DESC

            LIMIT $${limitIndex}
            OFFSET $${offsetIndex}
            `,
            values
        );

        return result.rows;
    },

    async countPurchasesByAccountId(
        client,
        accountId,
        userId,
        isCreator,
        options = {}
    ) {
        const {
            search = null,
            branchId = null,
            productId = null,
            paymentSource = null,
            from = null,
            to = null,
        } = options;

        const values = [accountId];

        const conditions = [
            "bp.account_id = $1",
        ];

        let parameterIndex = 2;

        /*
         * Non-creators can only count purchases from
         * branches where they have products.view.
         */
        if (!isCreator) {
            conditions.push(
                `
                EXISTS (
                    SELECT 1
                    FROM branch_memberships bm
                    INNER JOIN branch_membership_permissions bmp
                        ON bmp.branch_membership_id = bm.id
                    INNER JOIN permissions permission
                        ON permission.id = bmp.permission_id
                    WHERE bm.user_id = $${parameterIndex}
                        AND bm.branch_id = bp.branch_id
                        AND bm.status = 'active'
                        AND permission.key = 'products.view'
                )
                `
            );

            values.push(userId);
            parameterIndex++;
        }

        if (branchId) {
            conditions.push(
                `bp.branch_id = $${parameterIndex}`
            );

            values.push(branchId);
            parameterIndex++;
        }

        if (productId) {
            conditions.push(
                `bp.product_id = $${parameterIndex}`
            );

            values.push(productId);
            parameterIndex++;
        }

        if (paymentSource) {
            conditions.push(
                `bp.payment_source = $${parameterIndex}`
            );

            values.push(paymentSource);
            parameterIndex++;
        }

        if (from) {
            conditions.push(
                `bp.created_at >= $${parameterIndex}`
            );

            values.push(from);
            parameterIndex++;
        }

        if (to) {
            conditions.push(
                `bp.created_at < $${parameterIndex}`
            );

            values.push(to);
            parameterIndex++;
        }

        if (search) {
            conditions.push(
                `
                (
                    bp.product_name ILIKE $${parameterIndex}
                    OR COALESCE(
                        bp.notes,
                        ''
                    ) ILIKE $${parameterIndex}
                    OR COALESCE(
                        b.name,
                        ''
                    ) ILIKE $${parameterIndex}
                )
                `
            );

            values.push(`%${search}%`);
            parameterIndex++;
        }

        const result = await client.query(
            `
            SELECT COUNT(*)::integer AS count
            FROM branch_purchases bp

            INNER JOIN branches b
                ON b.id = bp.branch_id
                AND b.account_id = bp.account_id

            WHERE ${conditions.join(" AND ")}
            `,
            values
        );

        return result.rows[0].count;
    },
    async getPurchaseById(
        client,
        accountId,
        purchaseId
    ) {
        const result = await client.query(
            `
        SELECT
            bp.id,
            bp.account_id,
            bp.branch_id,
            bp.product_id,
            bp.product_name,
            bp.quantity,
            bp.cost_price,
            bp.payment_source,
            bp.notes,
            bp.created_by_user_id,
            bp.created_at,

            (
                bp.quantity * bp.cost_price
            ) AS total_cost,

            b.name AS branch_name,

            u.name AS created_by_name,
            u.email AS created_by_email

        FROM branch_purchases bp

        INNER JOIN branches b
            ON b.id = bp.branch_id
            AND b.account_id = bp.account_id

        INNER JOIN users u
            ON u.id = bp.created_by_user_id

        WHERE bp.id = $1
            AND bp.account_id = $2

        LIMIT 1
        `,
            [
                purchaseId,
                accountId,
            ]
        );

        return result.rows[0] ?? null;
    },
};

export default PurchaseRepository;