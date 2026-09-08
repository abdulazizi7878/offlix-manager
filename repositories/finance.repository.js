const FinanceRepository = {
    async createFinancialAccount(
        client,
        {
            accountId,
            branchId,
            type,
            name,
            bankName,
            accountIdentifier,
        }
    ) {
        const result = await client.query(
            `
            INSERT INTO financial_accounts (
                account_id,
                branch_id,
                type,
                name,
                bank_name,
                account_identifier
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            `,
            [
                accountId,
                branchId ?? null,
                type,
                name,
                bankName ?? null,
                accountIdentifier ?? null,
            ]
        );

        return result.rows[0];
    },

    async getFinancialAccountById(
        client,
        financialAccountId,
        accountId
    ) {
        const result = await client.query(
            `
            SELECT *
            FROM financial_accounts
            WHERE id = $1
              AND account_id = $2
            `,
            [financialAccountId, accountId]
        );

        return result.rows[0] ?? null;
    },

    async getFinancialAccounts(
        client,
        accountId,
        branchId = null
    ) {
        const result = await client.query(
            `
            SELECT
                fa.*,
                COALESCE(
                    SUM(
                        CASE
                            WHEN mt.to_financial_account_id = fa.id
                                THEN mt.amount
                            WHEN mt.from_financial_account_id = fa.id
                                THEN -mt.amount
                            ELSE 0
                        END
                    ),
                    0
                ) AS balance
            FROM financial_accounts fa
            LEFT JOIN money_transactions mt
                ON mt.to_financial_account_id = fa.id
                OR mt.from_financial_account_id = fa.id
            WHERE fa.account_id = $1
              AND (
                    $2::uuid IS NULL
                    OR fa.branch_id = $2
              )
              AND fa.status = 'active'
            GROUP BY fa.id
            ORDER BY fa.created_at ASC
            `,
            [accountId, branchId]
        );

        return result.rows;
    },

    async createMoneyTransaction(
        client,
        {
            accountId,
            branchId,
            type,
            amount,
            fromFinancialAccountId,
            toFinancialAccountId,
            description,
            referenceType,
            referenceId,
            createdByUserId,
        }
    ) {
        const result = await client.query(
            `
            INSERT INTO money_transactions (
                account_id,
                branch_id,
                type,
                amount,
                from_financial_account_id,
                to_financial_account_id,
                description,
                reference_type,
                reference_id,
                created_by_user_id
            )
            VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9, $10
            )
            RETURNING *
            `,
            [
                accountId,
                branchId ?? null,
                type,
                amount,
                fromFinancialAccountId ?? null,
                toFinancialAccountId ?? null,
                description ?? null,
                referenceType ?? null,
                referenceId ?? null,
                createdByUserId,
            ]
        );

        return result.rows[0];
    },

    async createReceivable(
        client,
        {
            accountId,
            branchId,
            saleId,
            customerName,
            originalAmount,
            dueAt,
            notes,
            createdByUserId,
        }
    ) {
        const result = await client.query(
            `
            INSERT INTO receivables (
                account_id,
                branch_id,
                sale_id,
                customer_name,
                original_amount,
                status,
                due_at,
                notes,
                created_by_user_id
            )
            VALUES (
                $1, $2, $3, $4, $5,
                'open', $6, $7, $8
            )
            RETURNING *
            `,
            [
                accountId,
                branchId,
                saleId ?? null,
                customerName ?? null,
                originalAmount,
                dueAt ?? null,
                notes ?? null,
                createdByUserId,
            ]
        );

        return result.rows[0];
    },

    async getReceivableById(
        client,
        receivableId,
        accountId
    ) {
        const result = await client.query(
            `
            SELECT
                r.*,
                COALESCE(
                    SUM(pp.amount),
                    0
                ) AS paid_amount,
                r.original_amount -
                COALESCE(SUM(pp.amount), 0) AS remaining_amount
            FROM receivables r
            LEFT JOIN payments pp
                ON pp.receivable_id = r.id
            WHERE r.id = $1
              AND r.account_id = $2
            GROUP BY r.id
            `,
            [receivableId, accountId]
        );

        return result.rows[0] ?? null;
    },

    async getReceivables(
        client,
        {
            accountId,
            branchId,
            search,
            page,
            limit,
            status,
        }
    ) {
        const offset = (page - 1) * limit;

        const result = await client.query(
            `
            SELECT
                r.*,
                COALESCE(SUM(p.amount), 0) AS paid_amount,
                r.original_amount -
                COALESCE(SUM(p.amount), 0) AS remaining_amount
            FROM receivables r
            LEFT JOIN payments p
                ON p.receivable_id = r.id
            WHERE r.account_id = $1
              AND ($2::uuid IS NULL OR r.branch_id = $2)
              AND (
                    $3::varchar IS NULL
                    OR r.customer_name ILIKE $3
              )
              AND (
                    $4::varchar IS NULL
                    OR r.status = $4
              )
            GROUP BY r.id
            HAVING
                r.original_amount -
                COALESCE(SUM(p.amount), 0) > 0
            ORDER BY r.created_at DESC
            LIMIT $5
            OFFSET $6
            `,
            [
                accountId,
                branchId ?? null,
                search ? `%${search}%` : null,
                status ?? null,
                limit,
                offset,
            ]
        );

        return result.rows;
    },

    async countReceivables(
        client,
        {
            accountId,
            branchId,
            search,
            status,
        }
    ) {
        const result = await client.query(
            `
            SELECT COUNT(*)::integer AS count
            FROM (
                SELECT r.id
                FROM receivables r
                LEFT JOIN payments p
                    ON p.receivable_id = r.id
                WHERE r.account_id = $1
                  AND ($2::uuid IS NULL OR r.branch_id = $2)
                  AND (
                        $3::varchar IS NULL
                        OR r.customer_name ILIKE $3
                  )
                  AND (
                        $4::varchar IS NULL
                        OR r.status = $4
                  )
                GROUP BY r.id
                HAVING
                    r.original_amount -
                    COALESCE(SUM(p.amount), 0) > 0
            ) x
            `,
            [
                accountId,
                branchId ?? null,
                search ? `%${search}%` : null,
                status ?? null,
            ]
        );

        return result.rows[0]?.count ?? 0;
    },

    async createPayment(
        client,
        {
            accountId,
            branchId,
            paymentType,
            saleId,
            receivableId,
            amount,
            paymentMethod,
            financialAccountId,
            moneyTransactionId,
            createdByUserId,
        }
    ) {
        const result = await client.query(
            `
            INSERT INTO payments (
                account_id,
                branch_id,
                payment_type,
                sale_id,
                receivable_id,
                amount,
                payment_method,
                financial_account_id,
                money_transaction_id,
                created_by_user_id
            )
            VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9, $10
            )
            RETURNING *
            `,
            [
                accountId,
                branchId,
                paymentType,
                saleId ?? null,
                receivableId ?? null,
                amount,
                paymentMethod,
                financialAccountId,
                moneyTransactionId,
                createdByUserId,
            ]
        );

        return result.rows[0];
    },

    async getReceivablePaidAmount(
        client,
        receivableId
    ) {
        const result = await client.query(
            `
            SELECT COALESCE(SUM(amount), 0) AS paid_amount
            FROM payments
            WHERE receivable_id = $1
            `,
            [receivableId]
        );

        return Number(result.rows[0]?.paid_amount ?? 0);
    },

    async updateReceivableStatus(
        client,
        receivableId,
        status
    ) {
        const result = await client.query(
            `
            UPDATE receivables
            SET
                status = $2,
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
            `,
            [receivableId, status]
        );

        return result.rows[0] ?? null;
    },

    async createPayable(
        client,
        {
            accountId,
            branchId,
            partyName,
            originalAmount,
            description,
            dueAt,
            createdByUserId,
        }
    ) {
        const result = await client.query(
            `
            INSERT INTO payables (
                account_id,
                branch_id,
                party_name,
                original_amount,
                status,
                description,
                due_at,
                created_by_user_id
            )
            VALUES (
                $1, $2, $3, $4,
                'open', $5, $6, $7
            )
            RETURNING *
            `,
            [
                accountId,
                branchId ?? null,
                partyName,
                originalAmount,
                description ?? null,
                dueAt ?? null,
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
                p.*,
                COALESCE(SUM(pp.amount), 0) AS paid_amount,
                p.original_amount -
                COALESCE(SUM(pp.amount), 0) AS remaining_amount
            FROM payables p
            LEFT JOIN payable_payments pp
                ON pp.payable_id = p.id
            WHERE p.id = $1
              AND p.account_id = $2
            GROUP BY p.id
            `,
            [payableId, accountId]
        );

        return result.rows[0] ?? null;
    },

    async createPayablePayment(
        client,
        {
            payableId,
            amount,
            moneyTransactionId,
            createdByUserId,
        }
    ) {
        const result = await client.query(
            `
            INSERT INTO payable_payments (
                payable_id,
                amount,
                money_transaction_id,
                created_by_user_id
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *
            `,
            [
                payableId,
                amount,
                moneyTransactionId,
                createdByUserId,
            ]
        );

        return result.rows[0];
    },

    async updatePayableStatus(
        client,
        payableId,
        status
    ) {
        const result = await client.query(
            `
            UPDATE payables
            SET
                status = $2,
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
            `,
            [payableId, status]
        );

        return result.rows[0] ?? null;
    },

    async createSettlement(
        client,
        {
            accountId,
            branchId,
            amount,
            requestedByUserId,
            notes,
        }
    ) {
        const result = await client.query(
            `
            INSERT INTO branch_settlements (
                account_id,
                branch_id,
                amount,
                status,
                requested_by_user_id,
                requested_at,
                notes
            )
            VALUES (
                $1, $2, $3,
                'pending', $4, NOW(), $5
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
            SELECT *
            FROM branch_settlements
            WHERE id = $1
              AND account_id = $2
            `,
            [settlementId, accountId]
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
            SELECT *
            FROM branch_settlements
            WHERE account_id = $1
              AND ($2::uuid IS NULL OR branch_id = $2)
              AND ($3::varchar IS NULL OR status = $3)
            ORDER BY created_at DESC
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

export default FinanceRepository;