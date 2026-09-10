import pool from "@/lib/database";

const MoneyRepository = {

    // =========================================================
    // MONEY ACCOUNTS
    // =========================================================

    async createMoneyAccount(
        client,
        {
            accountId,
            name,
            type,
        }
    ) {
        const result = await client.query(
            `
            INSERT INTO money_accounts (
                account_id,
                name,
                type
            )
            VALUES (
                $1,
                $2,
                $3
            )
            RETURNING *
            `,
            [
                accountId,
                name,
                type,
            ]
        );

        return result.rows[0];
    },

    async getMoneyAccountById(
        client,
        moneyAccountId,
        accountId
    ) {
        const result = await client.query(
            `
            SELECT
                ma.id,
                ma.account_id,
                ma.name,
                ma.type,
                ma.status,
                ma.created_at,
                ma.updated_at,

                COALESCE(
                    SUM(
                        CASE
                            WHEN mt.direction = 'in'
                            THEN mt.amount
                            WHEN mt.direction = 'out'
                            THEN -mt.amount
                            ELSE 0
                        END
                    ),
                    0
                ) AS balance

            FROM money_accounts ma

            LEFT JOIN money_transactions mt
                ON mt.money_account_id = ma.id
               AND mt.account_id = ma.account_id

            WHERE ma.id = $1
              AND ma.account_id = $2

            GROUP BY
                ma.id,
                ma.account_id,
                ma.name,
                ma.type,
                ma.status,
                ma.created_at,
                ma.updated_at
            `,
            [
                moneyAccountId,
                accountId,
            ]
        );

        return result.rows[0] ?? null;
    },

    async getMoneyAccounts(
        client,
        {
            accountId,
            type,
            status,
            search,
            page,
            limit,
        }
    ) {
        const offset = (page - 1) * limit;

        const result = await client.query(
            `
            SELECT
                ma.id,
                ma.account_id,
                ma.name,
                ma.type,
                ma.status,
                ma.created_at,
                ma.updated_at,

                COALESCE(
                    SUM(
                        CASE
                            WHEN mt.direction = 'in'
                            THEN mt.amount
                            WHEN mt.direction = 'out'
                            THEN -mt.amount
                            ELSE 0
                        END
                    ),
                    0
                ) AS balance

            FROM money_accounts ma

            LEFT JOIN money_transactions mt
                ON mt.money_account_id = ma.id
               AND mt.account_id = ma.account_id

            WHERE ma.account_id = $1

              AND (
                    $2::varchar IS NULL
                    OR ma.type = $2
              )

              AND (
                    $3::varchar IS NULL
                    OR ma.status = $3
              )

              AND (
                    $4::varchar IS NULL
                    OR ma.name ILIKE $4
              )

            GROUP BY
                ma.id,
                ma.account_id,
                ma.name,
                ma.type,
                ma.status,
                ma.created_at,
                ma.updated_at

            ORDER BY ma.created_at DESC

            LIMIT $5
            OFFSET $6
            `,
            [
                accountId,
                type ?? null,
                status ?? null,
                search
                    ? `%${search}%`
                    : null,
                limit,
                offset,
            ]
        );

        return result.rows;
    },

    async countMoneyAccounts(
        client,
        {
            accountId,
            type,
            status,
            search,
        }
    ) {
        const result = await client.query(
            `
            SELECT
                COUNT(*)::integer AS count

            FROM money_accounts ma

            WHERE ma.account_id = $1

              AND (
                    $2::varchar IS NULL
                    OR ma.type = $2
              )

              AND (
                    $3::varchar IS NULL
                    OR ma.status = $3
              )

              AND (
                    $4::varchar IS NULL
                    OR ma.name ILIKE $4
              )
            `,
            [
                accountId,
                type ?? null,
                status ?? null,
                search
                    ? `%${search}%`
                    : null,
            ]
        );

        return result.rows[0]?.count ?? 0;
    },

    async getMoneyAccountForUpdate(
        client,
        moneyAccountId,
        accountId
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
              AND status = 'active'
            FOR UPDATE
            `,
            [
                moneyAccountId,
                accountId,
            ]
        );

        return result.rows[0] ?? null;
    },

    async updateMoneyAccount(
        client,
        {
            moneyAccountId,
            accountId,
            name,
            type,
            status,
        }
    ) {
        const result = await client.query(
            `
            UPDATE money_accounts
            SET
                name = COALESCE($3, name),
                type = COALESCE($4, type),
                status = COALESCE($5, status),
                updated_at = NOW()
            WHERE id = $1
              AND account_id = $2
            RETURNING *
            `,
            [
                moneyAccountId,
                accountId,
                name ?? null,
                type ?? null,
                status ?? null,
            ]
        );

        return result.rows[0] ?? null;
    },


    // =========================================================
    // TRANSACTIONS
    // =========================================================

    async createTransaction(
        client,
        {
            accountId,
            moneyAccountId,
            type,
            direction,
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
                $3,
                $4,
                $5,
                $6,
                $7
            )
            RETURNING *
            `,
            [
                accountId,
                moneyAccountId,
                type,
                direction,
                amount,
                description ?? null,
                createdByUserId,
            ]
        );

        return result.rows[0];
    },

    async getTransactionById(
        client,
        transactionId,
        accountId
    ) {
        const result = await client.query(
            `
            SELECT
                mt.id,
                mt.account_id,
                mt.money_account_id,
                mt.type,
                mt.direction,
                mt.amount,
                mt.description,
                mt.created_by_user_id,
                mt.created_at,

                ma.name AS money_account_name,
                ma.type AS money_account_type,

                u.name AS employee_name

            FROM money_transactions mt

            INNER JOIN money_accounts ma
                ON ma.id = mt.money_account_id
               AND ma.account_id = mt.account_id

            INNER JOIN users u
                ON u.id = mt.created_by_user_id

            WHERE mt.id = $1
              AND mt.account_id = $2
            `,
            [
                transactionId,
                accountId,
            ]
        );

        return result.rows[0] ?? null;
    },

    async getTransactions(
        client,
        {
            accountId,
            moneyAccountId,
            type,
            direction,
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
                mt.id,
                mt.account_id,
                mt.money_account_id,
                mt.type,
                mt.direction,
                mt.amount,
                mt.description,
                mt.created_by_user_id,
                mt.created_at,

                ma.name AS money_account_name,
                ma.type AS money_account_type,

                u.name AS employee_name

            FROM money_transactions mt

            INNER JOIN money_accounts ma
                ON ma.id = mt.money_account_id
               AND ma.account_id = mt.account_id

            INNER JOIN users u
                ON u.id = mt.created_by_user_id

            WHERE mt.account_id = $1

              AND (
                    $2::uuid IS NULL
                    OR mt.money_account_id = $2
              )

              AND (
                    $3::varchar IS NULL
                    OR mt.type = $3
              )

              AND (
                    $4::varchar IS NULL
                    OR mt.direction = $4
              )

              AND (
                    $5::varchar IS NULL
                    OR mt.description ILIKE $5
                    OR ma.name ILIKE $5
                    OR u.name ILIKE $5
              )

              AND (
                    $6::timestamptz IS NULL
                    OR mt.created_at >= $6
              )

              AND (
                    $7::timestamptz IS NULL
                    OR mt.created_at < $7
              )

            ORDER BY mt.created_at DESC

            LIMIT $8
            OFFSET $9
            `,
            [
                accountId,
                moneyAccountId ?? null,
                type ?? null,
                direction ?? null,
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

    async countTransactions(
        client,
        {
            accountId,
            moneyAccountId,
            type,
            direction,
            search,
            dateFrom,
            dateTo,
        }
    ) {
        const result = await client.query(
            `
            SELECT
                COUNT(*)::integer AS count

            FROM money_transactions mt

            INNER JOIN money_accounts ma
                ON ma.id = mt.money_account_id
               AND ma.account_id = mt.account_id

            INNER JOIN users u
                ON u.id = mt.created_by_user_id

            WHERE mt.account_id = $1

              AND (
                    $2::uuid IS NULL
                    OR mt.money_account_id = $2
              )

              AND (
                    $3::varchar IS NULL
                    OR mt.type = $3
              )

              AND (
                    $4::varchar IS NULL
                    OR mt.direction = $4
              )

              AND (
                    $5::varchar IS NULL
                    OR mt.description ILIKE $5
                    OR ma.name ILIKE $5
                    OR u.name ILIKE $5
              )

              AND (
                    $6::timestamptz IS NULL
                    OR mt.created_at >= $6
              )

              AND (
                    $7::timestamptz IS NULL
                    OR mt.created_at < $7
              )
            `,
            [
                accountId,
                moneyAccountId ?? null,
                type ?? null,
                direction ?? null,
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
    // TRANSFERS
    // =========================================================

    async createTransfer(
        client,
        {
            accountId,
            fromMoneyAccountId,
            toMoneyAccountId,
            amount,
            notes,
            createdByUserId,
        }
    ) {
        const result = await client.query(
            `
            INSERT INTO money_transfers (
                account_id,
                from_money_account_id,
                to_money_account_id,
                amount,
                notes,
                created_by_user_id
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
                accountId,
                fromMoneyAccountId,
                toMoneyAccountId,
                amount,
                notes ?? null,
                createdByUserId,
            ]
        );

        return result.rows[0];
    },

    async getTransferById(
        client,
        transferId,
        accountId
    ) {
        const result = await client.query(
            `
            SELECT
                mt.id,
                mt.account_id,
                mt.from_money_account_id,
                mt.to_money_account_id,
                mt.amount,
                mt.notes,
                mt.created_by_user_id,
                mt.created_at,

                from_account.name AS from_money_account_name,
                from_account.type AS from_money_account_type,

                to_account.name AS to_money_account_name,
                to_account.type AS to_money_account_type,

                u.name AS employee_name

            FROM money_transfers mt

            INNER JOIN money_accounts from_account
                ON from_account.id = mt.from_money_account_id
               AND from_account.account_id = mt.account_id

            INNER JOIN money_accounts to_account
                ON to_account.id = mt.to_money_account_id
               AND to_account.account_id = mt.account_id

            INNER JOIN users u
                ON u.id = mt.created_by_user_id

            WHERE mt.id = $1
              AND mt.account_id = $2
            `,
            [
                transferId,
                accountId,
            ]
        );

        return result.rows[0] ?? null;
    },

    async getTransfers(
        client,
        {
            accountId,
            moneyAccountId,
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
                mt.id,
                mt.account_id,
                mt.from_money_account_id,
                mt.to_money_account_id,
                mt.amount,
                mt.notes,
                mt.created_by_user_id,
                mt.created_at,

                from_account.name AS from_money_account_name,
                from_account.type AS from_money_account_type,

                to_account.name AS to_money_account_name,
                to_account.type AS to_money_account_type,

                u.name AS employee_name

            FROM money_transfers mt

            INNER JOIN money_accounts from_account
                ON from_account.id = mt.from_money_account_id
               AND from_account.account_id = mt.account_id

            INNER JOIN money_accounts to_account
                ON to_account.id = mt.to_money_account_id
               AND to_account.account_id = mt.account_id

            INNER JOIN users u
                ON u.id = mt.created_by_user_id

            WHERE mt.account_id = $1

              AND (
                    $2::uuid IS NULL
                    OR mt.from_money_account_id = $2
                    OR mt.to_money_account_id = $2
              )

              AND (
                    $3::varchar IS NULL
                    OR mt.notes ILIKE $3
                    OR from_account.name ILIKE $3
                    OR to_account.name ILIKE $3
                    OR u.name ILIKE $3
              )

              AND (
                    $4::timestamptz IS NULL
                    OR mt.created_at >= $4
              )

              AND (
                    $5::timestamptz IS NULL
                    OR mt.created_at < $5
              )

            ORDER BY mt.created_at DESC

            LIMIT $6
            OFFSET $7
            `,
            [
                accountId,
                moneyAccountId ?? null,
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

    async countTransfers(
        client,
        {
            accountId,
            moneyAccountId,
            search,
            dateFrom,
            dateTo,
        }
    ) {
        const result = await client.query(
            `
            SELECT
                COUNT(*)::integer AS count

            FROM money_transfers mt

            INNER JOIN money_accounts from_account
                ON from_account.id = mt.from_money_account_id
               AND from_account.account_id = mt.account_id

            INNER JOIN money_accounts to_account
                ON to_account.id = mt.to_money_account_id
               AND to_account.account_id = mt.account_id

            INNER JOIN users u
                ON u.id = mt.created_by_user_id

            WHERE mt.account_id = $1

              AND (
                    $2::uuid IS NULL
                    OR mt.from_money_account_id = $2
                    OR mt.to_money_account_id = $2
              )

              AND (
                    $3::varchar IS NULL
                    OR mt.notes ILIKE $3
                    OR from_account.name ILIKE $3
                    OR to_account.name ILIKE $3
                    OR u.name ILIKE $3
              )

              AND (
                    $4::timestamptz IS NULL
                    OR mt.created_at >= $4
              )

              AND (
                    $5::timestamptz IS NULL
                    OR mt.created_at < $5
              )
            `,
            [
                accountId,
                moneyAccountId ?? null,
                search
                    ? `%${search}%`
                    : null,
                dateFrom ?? null,
                dateTo ?? null,
            ]
        );

        return result.rows[0]?.count ?? 0;
    },

    async getMoneyAccountBalance(
        client,
        moneyAccountId,
        accountId
    ) {
        const result = await client.query(
            `
            SELECT
                COALESCE(
                    SUM(
                        CASE
                            WHEN direction = 'in'
                            THEN amount
                            WHEN direction = 'out'
                            THEN -amount
                            ELSE 0
                        END
                    ),
                    0
                ) AS balance
            FROM money_transactions
            WHERE money_account_id = $1
              AND account_id = $2
            `,
            [
                moneyAccountId,
                accountId,
            ]
        );

        return result.rows[0]?.balance ?? 0;
    },


    // =========================================================
    // SETTLEMENTS
    // =========================================================

    async getSettlementById(
        client,
        settlementId,
        accountId
    ) {
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

                receiver.name AS received_by_name,

                COALESCE(
                    acceptance_summary.accepted_amount,
                    0
                ) AS accepted_amount,

                GREATEST(
                    ss.amount -
                    COALESCE(
                        acceptance_summary.accepted_amount,
                        0
                    ),
                    0
                ) AS remaining_amount

            FROM sale_settlements ss

            INNER JOIN branches b
                ON b.id = ss.branch_id
               AND b.account_id = ss.account_id

            LEFT JOIN users requester
                ON requester.id = ss.requested_by_user_id

            LEFT JOIN users receiver
                ON receiver.id = ss.received_by_user_id

            LEFT JOIN LATERAL (
                SELECT
                    SUM(ssa.amount) AS accepted_amount
                FROM sale_settlement_acceptances ssa
                WHERE ssa.sale_settlement_id = ss.id
                  AND ssa.account_id = ss.account_id
            ) acceptance_summary
                ON TRUE

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

                receiver.name AS received_by_name,

                COALESCE(
                    acceptance_summary.accepted_amount,
                    0
                ) AS accepted_amount,

                GREATEST(
                    ss.amount -
                    COALESCE(
                        acceptance_summary.accepted_amount,
                        0
                    ),
                    0
                ) AS remaining_amount

            FROM sale_settlements ss

            INNER JOIN branches b
                ON b.id = ss.branch_id
               AND b.account_id = ss.account_id

            LEFT JOIN users requester
                ON requester.id = ss.requested_by_user_id

            LEFT JOIN users receiver
                ON receiver.id = ss.received_by_user_id

            LEFT JOIN LATERAL (
                SELECT
                    SUM(ssa.amount) AS accepted_amount
                FROM sale_settlement_acceptances ssa
                WHERE ssa.sale_settlement_id = ss.id
                  AND ssa.account_id = ss.account_id
            ) acceptance_summary
                ON TRUE

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

            FROM sale_settlements ss

            WHERE ss.account_id = $1

              AND (
                    $2::uuid IS NULL
                    OR ss.branch_id = $2
              )

              AND (
                    $3::varchar IS NULL
                    OR ss.status = $3
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

    async getSettlementForUpdate(
        client,
        settlementId,
        accountId
    ) {
        const result = await client.query(
            `
            SELECT
                ss.id,
                ss.account_id,
                ss.branch_id,
                ss.amount,
                ss.status
            FROM sale_settlements ss
            WHERE ss.id = $1
              AND ss.account_id = $2
              AND ss.status IN (
                  'pending',
                  'requested'
              )
            FOR UPDATE
            `,
            [
                settlementId,
                accountId,
            ]
        );

        return result.rows[0] ?? null;
    },

    async getSettlementAcceptedAmount(
        client,
        settlementId,
        accountId
    ) {
        const result = await client.query(
            `
            SELECT
                COALESCE(
                    SUM(amount),
                    0
                ) AS accepted_amount

            FROM sale_settlement_acceptances

            WHERE sale_settlement_id = $1
              AND account_id = $2
            `,
            [
                settlementId,
                accountId,
            ]
        );

        return result.rows[0]?.accepted_amount ?? 0;
    },

    async createSettlementAcceptance(
        client,
        {
            accountId,
            saleSettlementId,
            moneyAccountId,
            amount,
            acceptedByUserId,
            notes,
        }
    ) {
        const result = await client.query(
            `
            INSERT INTO sale_settlement_acceptances (
                account_id,
                sale_settlement_id,
                money_account_id,
                amount,
                accepted_by_user_id,
                accepted_at,
                notes
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                NOW(),
                $6
            )
            RETURNING *
            `,
            [
                accountId,
                saleSettlementId,
                moneyAccountId,
                amount,
                acceptedByUserId,
                notes ?? null,
            ]
        );

        return result.rows[0];
    },

    async getSettlementAcceptances(
        client,
        settlementId,
        accountId
    ) {
        const result = await client.query(
            `
            SELECT
                ssa.id,
                ssa.account_id,
                ssa.sale_settlement_id,
                ssa.money_account_id,
                ssa.amount,
                ssa.accepted_by_user_id,
                ssa.accepted_at,
                ssa.notes,
                ssa.created_at,

                ma.name AS money_account_name,
                ma.type AS money_account_type,

                u.name AS accepted_by_name

            FROM sale_settlement_acceptances ssa

            INNER JOIN money_accounts ma
                ON ma.id = ssa.money_account_id
               AND ma.account_id = ssa.account_id

            INNER JOIN users u
                ON u.id = ssa.accepted_by_user_id

            WHERE ssa.sale_settlement_id = $1
              AND ssa.account_id = $2

            ORDER BY ssa.accepted_at ASC
            `,
            [
                settlementId,
                accountId,
            ]
        );

        return result.rows;
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
    // PAYABLES
    // =========================================================

    async createPayable(
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
            INSERT INTO payables (
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
            RETURNING *
            `,
            [
                accountId,
                name,
                description ?? null,
                amount,
                dueDate ?? null,
                createdByUserId,
            ]
        );

        return result.rows[0];
    },

    async getPayableById(
        client,
        payableId,
        accountId
    ) {
        const result = await client.query(
            `
            SELECT
                p.id,
                p.account_id,
                p.name,
                p.description,
                p.amount,
                p.due_date,
                p.status,
                p.created_by_user_id,
                p.created_at,
                p.updated_at,

                u.name AS created_by_name,

                COALESCE(
                    payment_summary.paid_amount,
                    0
                ) AS paid_amount,

                GREATEST(
                    p.amount -
                    COALESCE(
                        payment_summary.paid_amount,
                        0
                    ),
                    0
                ) AS remaining_amount

            FROM payables p

            INNER JOIN users u
                ON u.id = p.created_by_user_id

            LEFT JOIN LATERAL (
                SELECT
                    SUM(pp.amount) AS paid_amount
                FROM payable_payments pp
                WHERE pp.payable_id = p.id
                  AND pp.account_id = p.account_id
            ) payment_summary
                ON TRUE

            WHERE p.id = $1
              AND p.account_id = $2
            `,
            [
                payableId,
                accountId,
            ]
        );

        return result.rows[0] ?? null;
    },

    async getPayables(
        client,
        {
            accountId,
            status,
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
                p.id,
                p.account_id,
                p.name,
                p.description,
                p.amount,
                p.due_date,
                p.status,
                p.created_by_user_id,
                p.created_at,
                p.updated_at,

                u.name AS created_by_name,

                COALESCE(
                    payment_summary.paid_amount,
                    0
                ) AS paid_amount,

                GREATEST(
                    p.amount -
                    COALESCE(
                        payment_summary.paid_amount,
                        0
                    ),
                    0
                ) AS remaining_amount

            FROM payables p

            INNER JOIN users u
                ON u.id = p.created_by_user_id

            LEFT JOIN LATERAL (
                SELECT
                    SUM(pp.amount) AS paid_amount
                FROM payable_payments pp
                WHERE pp.payable_id = p.id
                  AND pp.account_id = p.account_id
            ) payment_summary
                ON TRUE

            WHERE p.account_id = $1

              AND (
                    $2::varchar IS NULL
                    OR p.status = $2
              )

              AND (
                    $3::varchar IS NULL
                    OR p.name ILIKE $3
                    OR p.description ILIKE $3
                    OR u.name ILIKE $3
              )

              AND (
                    $4::timestamptz IS NULL
                    OR p.created_at >= $4
              )

              AND (
                    $5::timestamptz IS NULL
                    OR p.created_at < $5
              )

            ORDER BY p.created_at DESC

            LIMIT $6
            OFFSET $7
            `,
            [
                accountId,
                status ?? null,
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

    async countPayables(
        client,
        {
            accountId,
            status,
            search,
            dateFrom,
            dateTo,
        }
    ) {
        const result = await client.query(
            `
            SELECT
                COUNT(*)::integer AS count

            FROM payables p

            INNER JOIN users u
                ON u.id = p.created_by_user_id

            WHERE p.account_id = $1

              AND (
                    $2::varchar IS NULL
                    OR p.status = $2
              )

              AND (
                    $3::varchar IS NULL
                    OR p.name ILIKE $3
                    OR p.description ILIKE $3
                    OR u.name ILIKE $3
              )

              AND (
                    $4::timestamptz IS NULL
                    OR p.created_at >= $4
              )

              AND (
                    $5::timestamptz IS NULL
                    OR p.created_at < $5
              )
            `,
            [
                accountId,
                status ?? null,
                search
                    ? `%${search}%`
                    : null,
                dateFrom ?? null,
                dateTo ?? null,
            ]
        );

        return result.rows[0]?.count ?? 0;
    },

    async getPayableForUpdate(
        client,
        payableId,
        accountId
    ) {
        const result = await client.query(
            `
            SELECT
                id,
                account_id,
                amount,
                status
            FROM payables
            WHERE id = $1
              AND account_id = $2
              AND status IN (
                  'pending',
                  'partial'
              )
            FOR UPDATE
            `,
            [
                payableId,
                accountId,
            ]
        );

        return result.rows[0] ?? null;
    },

    async getPayablePaidAmount(
        client,
        payableId,
        accountId
    ) {
        const result = await client.query(
            `
            SELECT
                COALESCE(
                    SUM(amount),
                    0
                ) AS paid_amount
            FROM payable_payments
            WHERE payable_id = $1
              AND account_id = $2
            `,
            [
                payableId,
                accountId,
            ]
        );

        return result.rows[0]?.paid_amount ?? 0;
    },

    async createPayablePayment(
        client,
        {
            accountId,
            payableId,
            moneyAccountId,
            amount,
            paidByUserId,
            notes,
        }
    ) {
        const result = await client.query(
            `
            INSERT INTO payable_payments (
                account_id,
                payable_id,
                money_account_id,
                amount,
                paid_by_user_id,
                paid_at,
                notes
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                NOW(),
                $6
            )
            RETURNING *
            `,
            [
                accountId,
                payableId,
                moneyAccountId,
                amount,
                paidByUserId,
                notes ?? null,
            ]
        );

        return result.rows[0];
    },

    async getPayablePayments(
        client,
        payableId,
        accountId
    ) {
        const result = await client.query(
            `
            SELECT
                pp.id,
                pp.account_id,
                pp.payable_id,
                pp.money_account_id,
                pp.amount,
                pp.paid_by_user_id,
                pp.paid_at,
                pp.notes,
                pp.created_at,

                ma.name AS money_account_name,
                ma.type AS money_account_type,

                u.name AS paid_by_name

            FROM payable_payments pp

            INNER JOIN money_accounts ma
                ON ma.id = pp.money_account_id
               AND ma.account_id = pp.account_id

            INNER JOIN users u
                ON u.id = pp.paid_by_user_id

            WHERE pp.payable_id = $1
              AND pp.account_id = $2

            ORDER BY pp.paid_at ASC
            `,
            [
                payableId,
                accountId,
            ]
        );

        return result.rows;
    },

    async updatePayableStatus(
        client,
        {
            payableId,
            accountId,
            status,
        }
    ) {
        const result = await client.query(
            `
            UPDATE payables
            SET
                status = $3,
                updated_at = NOW()
            WHERE id = $1
              AND account_id = $2
            RETURNING *
            `,
            [
                payableId,
                accountId,
                status,
            ]
        );

        return result.rows[0] ?? null;
    },


    // =========================================================
    // CREDITS
    // =========================================================

    async createCredit(
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
            INSERT INTO credits (
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
            RETURNING *
            `,
            [
                accountId,
                name,
                description ?? null,
                amount,
                dueDate ?? null,
                createdByUserId,
            ]
        );

        return result.rows[0];
    },

    async getCreditById(
        client,
        creditId,
        accountId
    ) {
        const result = await client.query(
            `
            SELECT
                c.id,
                c.account_id,
                c.name,
                c.description,
                c.amount,
                c.due_date,
                c.status,
                c.created_by_user_id,
                c.created_at,
                c.updated_at,

                u.name AS created_by_name,

                COALESCE(
                    payment_summary.received_amount,
                    0
                ) AS received_amount,

                GREATEST(
                    c.amount -
                    COALESCE(
                        payment_summary.received_amount,
                        0
                    ),
                    0
                ) AS remaining_amount

            FROM credits c

            INNER JOIN users u
                ON u.id = c.created_by_user_id

            LEFT JOIN LATERAL (
                SELECT
                    SUM(cp.amount) AS received_amount
                FROM credit_payments cp
                WHERE cp.credit_id = c.id
                  AND cp.account_id = c.account_id
            ) payment_summary
                ON TRUE

            WHERE c.id = $1
              AND c.account_id = $2
            `,
            [
                creditId,
                accountId,
            ]
        );

        return result.rows[0] ?? null;
    },

    async getCredits(
        client,
        {
            accountId,
            status,
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
                c.id,
                c.account_id,
                c.name,
                c.description,
                c.amount,
                c.due_date,
                c.status,
                c.created_by_user_id,
                c.created_at,
                c.updated_at,

                u.name AS created_by_name,

                COALESCE(
                    payment_summary.received_amount,
                    0
                ) AS received_amount,

                GREATEST(
                    c.amount -
                    COALESCE(
                        payment_summary.received_amount,
                        0
                    ),
                    0
                ) AS remaining_amount

            FROM credits c

            INNER JOIN users u
                ON u.id = c.created_by_user_id

            LEFT JOIN LATERAL (
                SELECT
                    SUM(cp.amount) AS received_amount
                FROM credit_payments cp
                WHERE cp.credit_id = c.id
                  AND cp.account_id = c.account_id
            ) payment_summary
                ON TRUE

            WHERE c.account_id = $1

              AND (
                    $2::varchar IS NULL
                    OR c.status = $2
              )

              AND (
                    $3::varchar IS NULL
                    OR c.name ILIKE $3
                    OR c.description ILIKE $3
                    OR u.name ILIKE $3
              )

              AND (
                    $4::timestamptz IS NULL
                    OR c.created_at >= $4
              )

              AND (
                    $5::timestamptz IS NULL
                    OR c.created_at < $5
              )

            ORDER BY c.created_at DESC

            LIMIT $6
            OFFSET $7
            `,
            [
                accountId,
                status ?? null,
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

    async countCredits(
        client,
        {
            accountId,
            status,
            search,
            dateFrom,
            dateTo,
        }
    ) {
        const result = await client.query(
            `
            SELECT
                COUNT(*)::integer AS count

            FROM credits c

            INNER JOIN users u
                ON u.id = c.created_by_user_id

            WHERE c.account_id = $1

              AND (
                    $2::varchar IS NULL
                    OR c.status = $2
              )

              AND (
                    $3::varchar IS NULL
                    OR c.name ILIKE $3
                    OR c.description ILIKE $3
                    OR u.name ILIKE $3
              )

              AND (
                    $4::timestamptz IS NULL
                    OR c.created_at >= $4
              )

              AND (
                    $5::timestamptz IS NULL
                    OR c.created_at < $5
              )
            `,
            [
                accountId,
                status ?? null,
                search
                    ? `%${search}%`
                    : null,
                dateFrom ?? null,
                dateTo ?? null,
            ]
        );

        return result.rows[0]?.count ?? 0;
    },

    async getCreditForUpdate(
        client,
        creditId,
        accountId
    ) {
        const result = await client.query(
            `
            SELECT
                id,
                account_id,
                amount,
                status
            FROM credits
            WHERE id = $1
              AND account_id = $2
              AND status IN (
                  'pending',
                  'partial'
              )
            FOR UPDATE
            `,
            [
                creditId,
                accountId,
            ]
        );

        return result.rows[0] ?? null;
    },

    async getCreditReceivedAmount(
        client,
        creditId,
        accountId
    ) {
        const result = await client.query(
            `
            SELECT
                COALESCE(
                    SUM(amount),
                    0
                ) AS received_amount
            FROM credit_payments
            WHERE credit_id = $1
              AND account_id = $2
            `,
            [
                creditId,
                accountId,
            ]
        );

        return result.rows[0]?.received_amount ?? 0;
    },

    async createCreditPayment(
        client,
        {
            accountId,
            creditId,
            moneyAccountId,
            amount,
            receivedByUserId,
            notes,
        }
    ) {
        const result = await client.query(
            `
            INSERT INTO credit_payments (
                account_id,
                credit_id,
                money_account_id,
                amount,
                received_by_user_id,
                received_at,
                notes
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                NOW(),
                $6
            )
            RETURNING *
            `,
            [
                accountId,
                creditId,
                moneyAccountId,
                amount,
                receivedByUserId,
                notes ?? null,
            ]
        );

        return result.rows[0];
    },

    async getCreditPayments(
        client,
        creditId,
        accountId
    ) {
        const result = await client.query(
            `
            SELECT
                cp.id,
                cp.account_id,
                cp.credit_id,
                cp.money_account_id,
                cp.amount,
                cp.received_by_user_id,
                cp.received_at,
                cp.notes,
                cp.created_at,

                ma.name AS money_account_name,
                ma.type AS money_account_type,

                u.name AS received_by_name

            FROM credit_payments cp

            INNER JOIN money_accounts ma
                ON ma.id = cp.money_account_id
               AND ma.account_id = cp.account_id

            INNER JOIN users u
                ON u.id = cp.received_by_user_id

            WHERE cp.credit_id = $1
              AND cp.account_id = $2

            ORDER BY cp.received_at ASC
            `,
            [
                creditId,
                accountId,
            ]
        );

        return result.rows;
    },

    async updateCreditStatus(
        client,
        {
            creditId,
            accountId,
            status,
        }
    ) {
        const result = await client.query(
            `
            UPDATE credits
            SET
                status = $3,
                updated_at = NOW()
            WHERE id = $1
              AND account_id = $2
            RETURNING *
            `,
            [
                creditId,
                accountId,
                status,
            ]
        );

        return result.rows[0] ?? null;
    },


    // =========================================================
    // TOTAL MONEY
    // =========================================================

    async getTotalMoney(
        client,
        accountId
    ) {
        const result = await client.query(
            `
            SELECT
                COALESCE(
                    SUM(
                        CASE
                            WHEN mt.direction = 'in'
                            THEN mt.amount
                            WHEN mt.direction = 'out'
                            THEN -mt.amount
                            ELSE 0
                        END
                    ),
                    0
                ) AS total_money

            FROM money_accounts ma

            LEFT JOIN money_transactions mt
                ON mt.money_account_id = ma.id
               AND mt.account_id = ma.account_id

            WHERE ma.account_id = $1
              AND ma.status = 'active'
            `,
            [
                accountId,
            ]
        );

        return result.rows[0]?.total_money ?? 0;
    },

    async getMoneyTotalsByType(
        client,
        accountId
    ) {
        const result = await client.query(
            `
            SELECT
                ma.type,

                COALESCE(
                    SUM(
                        CASE
                            WHEN mt.direction = 'in'
                            THEN mt.amount
                            WHEN mt.direction = 'out'
                            THEN -mt.amount
                            ELSE 0
                        END
                    ),
                    0
                ) AS total_amount

            FROM money_accounts ma

            LEFT JOIN money_transactions mt
                ON mt.money_account_id = ma.id
               AND mt.account_id = ma.account_id

            WHERE ma.account_id = $1
              AND ma.status = 'active'

            GROUP BY ma.type

            ORDER BY ma.type ASC
            `,
            [
                accountId,
            ]
        );

        return result.rows;
    },

    async getMoneyAccountTotals(
        client,
        accountId
    ) {
        const result = await client.query(
            `
            SELECT
                ma.id,
                ma.name,
                ma.type,
                ma.status,

                COALESCE(
                    SUM(
                        CASE
                            WHEN mt.direction = 'in'
                            THEN mt.amount
                            WHEN mt.direction = 'out'
                            THEN -mt.amount
                            ELSE 0
                        END
                    ),
                    0
                ) AS balance

            FROM money_accounts ma

            LEFT JOIN money_transactions mt
                ON mt.money_account_id = ma.id
               AND mt.account_id = ma.account_id

            WHERE ma.account_id = $1
              AND ma.status = 'active'

            GROUP BY
                ma.id,
                ma.name,
                ma.type,
                ma.status

            ORDER BY ma.type ASC, ma.name ASC
            `,
            [
                accountId,
            ]
        );

        return result.rows;
    },

};

export default MoneyRepository;