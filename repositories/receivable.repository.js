// file: repositories/receivable.repository.js

const ReceivableRepository = {

    /*
     * ============================================================
     * CREATE RECEIVABLE
     * ============================================================
     */

    async createReceivable(
        client,
        {
            accountId,
            name,
            description,
            amount,
            dueDate,
            createdByUserId,
        }
    ) {
        const result = await client.query(
            `
            INSERT INTO receivables (
                account_id,
                name,
                description,
                amount,
                due_date,
                status,
                created_by_user_id
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                'pending',
                $6
            )
            RETURNING
                id,
                account_id,
                name,
                description,
                amount,
                due_date,
                status,
                created_by_user_id,
                created_at,
                updated_at
            `,
            [
                accountId,
                name,
                description || null,
                amount,
                dueDate || null,
                createdByUserId,
            ]
        );

        return result.rows[0];
    },

    /*
     * ============================================================
     * GET RECEIVABLES
     * ============================================================
     */

    async getReceivables(
        client,
        {
            accountId,
            status = null,
            search = null,
            limit = 20,
            offset = 0,
        }
    ) {
        const result = await client.query(
            `
            SELECT
                r.id,
                r.account_id,
                r.name,
                r.description,
                r.amount,
                r.due_date,
                r.status,
                r.created_by_user_id,
                r.created_at,
                r.updated_at,

                COALESCE(
                    payments.paid_amount,
                    0
                ) AS paid_amount,

                GREATEST(
                    r.amount -
                    COALESCE(
                        payments.paid_amount,
                        0
                    ),
                    0
                ) AS outstanding_amount

            FROM receivables r

            LEFT JOIN (
                SELECT
                    receivable_id,
                    COALESCE(
                        SUM(amount),
                        0
                    ) AS paid_amount
                FROM receivable_payments
                WHERE account_id = $1
                GROUP BY receivable_id
            ) payments
                ON payments.receivable_id = r.id

            WHERE r.account_id = $1

              AND (
                    $2::varchar IS NULL
                    OR r.status = $2
                  )

              AND (
                    $3::varchar IS NULL
                    OR r.name ILIKE '%' || $3 || '%'
                    OR r.description ILIKE '%' || $3 || '%'
                  )

            ORDER BY
                r.created_at DESC,
                r.id DESC

            LIMIT $4
            OFFSET $5
            `,
            [
                accountId,
                status,
                search,
                limit,
                offset,
            ]
        );

        return result.rows.map((row) => ({
            id: row.id,
            accountId: row.account_id,
            name: row.name,
            description: row.description,
            amount: Number(row.amount ?? 0),
            paidAmount: Number(row.paid_amount ?? 0),
            outstandingAmount: Number(
                row.outstanding_amount ?? 0
            ),
            dueDate: row.due_date,
            status: row.status,
            createdByUserId: row.created_by_user_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
    },

    /*
     * ============================================================
     * COUNT RECEIVABLES
     * ============================================================
     */

    async countReceivables(
        client,
        {
            accountId,
            status = null,
            search = null,
        }
    ) {
        const result = await client.query(
            `
            SELECT COUNT(*)::INTEGER AS count

            FROM receivables

            WHERE account_id = $1

              AND (
                    $2::varchar IS NULL
                    OR status = $2
                  )

              AND (
                    $3::varchar IS NULL
                    OR name ILIKE '%' || $3 || '%'
                    OR description ILIKE '%' || $3 || '%'
                  )
            `,
            [
                accountId,
                status,
                search,
            ]
        );

        return Number(
            result.rows[0]?.count ?? 0
        );
    },

    /*
     * ============================================================
     * GET RECEIVABLE
     * ============================================================
     */

    async getReceivable(
        client,
        {
            accountId,
            receivableId,
        }
    ) {
        const result = await client.query(
            `
            SELECT
                r.id,
                r.account_id,
                r.name,
                r.description,
                r.amount,
                r.due_date,
                r.status,
                r.created_by_user_id,
                r.created_at,
                r.updated_at,

                COALESCE(
                    payments.paid_amount,
                    0
                ) AS paid_amount,

                GREATEST(
                    r.amount -
                    COALESCE(
                        payments.paid_amount,
                        0
                    ),
                    0
                ) AS outstanding_amount

            FROM receivables r

            LEFT JOIN (
                SELECT
                    receivable_id,
                    COALESCE(
                        SUM(amount),
                        0
                    ) AS paid_amount
                FROM receivable_payments
                WHERE account_id = $1
                GROUP BY receivable_id
            ) payments
                ON payments.receivable_id = r.id

            WHERE r.id = $2
              AND r.account_id = $1

            LIMIT 1
            `,
            [
                accountId,
                receivableId,
            ]
        );

        const row = result.rows[0];

        if (!row) {
            return null;
        }

        return {
            id: row.id,
            accountId: row.account_id,
            name: row.name,
            description: row.description,
            amount: Number(row.amount ?? 0),
            paidAmount: Number(row.paid_amount ?? 0),
            outstandingAmount: Number(
                row.outstanding_amount ?? 0
            ),
            dueDate: row.due_date,
            status: row.status,
            createdByUserId: row.created_by_user_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    },

    /*
     * ============================================================
     * GET PAID AMOUNT
     * ============================================================
     */

    async getPaidAmount(
        client,
        {
            accountId,
            receivableId,
        }
    ) {
        const result = await client.query(
            `
            SELECT
                COALESCE(
                    SUM(amount),
                    0
                ) AS paid_amount

            FROM receivable_payments

            WHERE account_id = $1
              AND receivable_id = $2
            `,
            [
                accountId,
                receivableId,
            ]
        );

        return Number(
            result.rows[0]?.paid_amount ?? 0
        );
    },

    /*
     * ============================================================
     * UPDATE RECEIVABLE
     * ============================================================
     */

    async updateReceivable(
        client,
        {
            accountId,
            receivableId,
            name,
            description,
            amount,
            dueDate,
        }
    ) {
        const result = await client.query(
            `
            UPDATE receivables

            SET
                name = $3,
                description = $4,
                amount = $5,
                due_date = $6,
                updated_at = NOW()

            WHERE id = $1
              AND account_id = $2

            RETURNING
                id,
                account_id,
                name,
                description,
                amount,
                due_date,
                status,
                created_by_user_id,
                created_at,
                updated_at
            `,
            [
                receivableId,
                accountId,
                name,
                description || null,
                amount,
                dueDate || null,
            ]
        );

        return result.rows[0] ?? null;
    },

    /*
     * ============================================================
     * DELETE RECEIVABLE
     * ============================================================
     */

    async deleteReceivable(
        client,
        {
            accountId,
            receivableId,
        }
    ) {
        const result = await client.query(
            `
            DELETE FROM receivables

            WHERE id = $1
              AND account_id = $2

            RETURNING id
            `,
            [
                receivableId,
                accountId,
            ]
        );

        return result.rows[0] ?? null;
    },

    /*
     * ============================================================
     * CREATE RECEIVABLE PAYMENT
     * ============================================================
     */

    async createReceivablePayment(
        client,
        {
            accountId,
            receivableId,
            moneyAccountId,
            amount,
            receivedByUserId,
            notes,
        }
    ) {
        const result = await client.query(
            `
            INSERT INTO receivable_payments (
                account_id,
                receivable_id,
                money_account_id,
                amount,
                received_by_user_id,
                notes
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6
            )
            RETURNING
                id,
                account_id,
                receivable_id,
                money_account_id,
                amount,
                received_by_user_id,
                received_at,
                notes,
                created_at
            `,
            [
                accountId,
                receivableId,
                moneyAccountId,
                amount,
                receivedByUserId,
                notes || null,
            ]
        );

        return result.rows[0];
    },

    /*
     * ============================================================
     * CREATE MONEY TRANSACTION
     * ============================================================
     */

    async createMoneyTransaction(
        client,
        {
            accountId,
            moneyAccountId,
            amount,
            description,
            createdByUserId,
        }
    ) {
        const result = await client.query(
            `
            INSERT INTO money_transactions (
                account_id,
                money_account_id,
                type,
                direction,
                amount,
                description,
                created_by_user_id
            )
            VALUES (
                $1,
                $2,
                'payment',
                'in',
                $3,
                $4,
                $5
            )
            RETURNING
                id,
                account_id,
                money_account_id,
                type,
                direction,
                amount,
                description,
                created_by_user_id,
                created_at
            `,
            [
                accountId,
                moneyAccountId,
                amount,
                description,
                createdByUserId,
            ]
        );

        return result.rows[0];
    },

    /*
     * ============================================================
     * GET MONEY ACCOUNT
     * ============================================================
     */

    async getMoneyAccount(
        client,
        {
            accountId,
            moneyAccountId,
        }
    ) {
        const result = await client.query(
            `
            SELECT
                id,
                account_id,
                name,
                type,
                status
            FROM money_accounts

            WHERE id = $1
              AND account_id = $2

            LIMIT 1
            `,
            [
                moneyAccountId,
                accountId,
            ]
        );

        return result.rows[0] ?? null;
    },

    /*
     * ============================================================
     * UPDATE STATUS
     * ============================================================
     */

    async updateStatus(
        client,
        {
            accountId,
            receivableId,
            status,
        }
    ) {
        const result = await client.query(
            `
            UPDATE receivables

            SET
                status = $3,
                updated_at = NOW()

            WHERE id = $1
              AND account_id = $2

            RETURNING
                id,
                status
            `,
            [
                receivableId,
                accountId,
                status,
            ]
        );

        return result.rows[0] ?? null;
    },

    /*
     * ============================================================
     * GET PAYMENTS
     * ============================================================
     */

    async getPayments(
        client,
        {
            accountId,
            receivableId,
        }
    ) {
        const result = await client.query(
            `
            SELECT
                rp.id,
                rp.receivable_id,
                rp.money_account_id,
                ma.name AS money_account_name,
                rp.amount,
                rp.received_by_user_id,
                rp.received_at,
                rp.notes,
                rp.created_at

            FROM receivable_payments rp

            INNER JOIN money_accounts ma
                ON ma.id = rp.money_account_id
                AND ma.account_id = rp.account_id

            WHERE rp.account_id = $1
              AND rp.receivable_id = $2

            ORDER BY
                rp.received_at DESC,
                rp.id DESC
            `,
            [
                accountId,
                receivableId,
            ]
        );

        return result.rows.map((row) => ({
            id: row.id,
            receivableId: row.receivable_id,
            moneyAccountId: row.money_account_id,
            moneyAccountName: row.money_account_name,
            amount: Number(row.amount ?? 0),
            receivedByUserId: row.received_by_user_id,
            receivedAt: row.received_at,
            notes: row.notes,
            createdAt: row.created_at,
        }));
    },
};

export default ReceivableRepository;