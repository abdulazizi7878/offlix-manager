// file: repositories/overview.repository.js

const OverviewRepository = {
    /*
     * ============================================================
     * MONEY SUMMARY
     * ============================================================
     */

    async getMoneyAccountSummary(
        client,
        { accountId }
    ) {
        const result = await client.query(
            `
        WITH transaction_balances AS (
            SELECT
                money_account_id,
                COALESCE(
                    SUM(
                        CASE
                            WHEN direction = 'in'
                            THEN amount
                            ELSE -amount
                        END
                    ),
                    0
                ) AS balance
            FROM money_transactions
            WHERE account_id = $1
            GROUP BY money_account_id
        ),

        transfer_balances AS (
            SELECT
                money_account_id,
                COALESCE(
                    SUM(balance_change),
                    0
                ) AS balance
            FROM (
                SELECT
                    from_money_account_id AS money_account_id,
                    -amount AS balance_change
                FROM money_transfers
                WHERE account_id = $1

                UNION ALL

                SELECT
                    to_money_account_id AS money_account_id,
                    amount AS balance_change
                FROM money_transfers
                WHERE account_id = $1
            ) transfers
            GROUP BY money_account_id
        )

        SELECT
            COUNT(*)::INTEGER AS account_count,

            COALESCE(
                SUM(
                    COALESCE(tb.balance, 0)
                    +
                    COALESCE(trb.balance, 0)
                ),
                0
            ) AS total_balance,

            COALESCE(
                SUM(
                    CASE
                        WHEN ma.status = 'active'
                        THEN
                            COALESCE(tb.balance, 0)
                            +
                            COALESCE(trb.balance, 0)
                        ELSE 0
                    END
                ),
                0
            ) AS liquid_balance

        FROM money_accounts ma

        LEFT JOIN transaction_balances tb
            ON tb.money_account_id = ma.id

        LEFT JOIN transfer_balances trb
            ON trb.money_account_id = ma.id

        WHERE ma.account_id = $1
        `,
            [accountId]
        );

        const row = result.rows[0];

        return {
            accountCount: Number(
                row.account_count ?? 0
            ),
            totalBalance: Number(
                row.total_balance ?? 0
            ),
            liquidBalance: Number(
                row.liquid_balance ?? 0
            ),
        };
    },
    /*
     * ============================================================
     * SALES SUMMARY
     * ============================================================
     */

    async getSalesSummary(
        client,
        {
            accountId,
            branchId = null,
            from,
            to,
        }
    ) {
        const result = await client.query(
            `
            SELECT
                COUNT(*)::INTEGER AS sales_count,
                COALESCE(
                    SUM(total_amount),
                    0
                ) AS total_sales,
                COALESCE(
                    SUM(
                        CASE
                            WHEN payment_status IN (
                                'pending',
                                'partial',
                                'unpaid',
                                'credit'
                            )
                            THEN total_amount
                            ELSE 0
                        END
                    ),
                    0
                ) AS unpaid_sales
            FROM sales
            WHERE account_id = $1

              AND (
                    $2::uuid IS NULL
                    OR branch_id = $2
                  )

              AND (
                    $3::timestamptz IS NULL
                    OR created_at >= $3
                  )

              AND (
                    $4::timestamptz IS NULL
                    OR created_at < $4
                  )
            `,
            [
                accountId,
                branchId,
                from,
                to,
            ]
        );

        const row = result.rows[0];

        return {
            salesCount: Number(
                row.sales_count ?? 0
            ),
            totalSales: Number(
                row.total_sales ?? 0
            ),
            unpaidSales: Number(
                row.unpaid_sales ?? 0
            ),
        };
    },

    /*
     * ============================================================
     * RECEIVABLES
     * ============================================================
     */

    async getReceivablesSummary(
        client,
        { accountId }
    ) {
        const result = await client.query(
            `
            SELECT
                COUNT(*) FILTER (
                    WHERE c.status IN (
                        'pending',
                        'partial'
                    )
                )::INTEGER AS open_count,

                COALESCE(
                    SUM(
                        GREATEST(
                            c.amount -
                            COALESCE(
                                paid.paid_amount,
                                0
                            ),
                            0
                        )
                    ) FILTER (
                        WHERE c.status IN (
                            'pending',
                            'partial'
                        )
                    ),
                    0
                ) AS outstanding_amount,

                COUNT(*) FILTER (
                    WHERE c.status IN (
                        'pending',
                        'partial'
                    )
                    AND c.due_date IS NOT NULL
                    AND c.due_date < CURRENT_DATE
                )::INTEGER AS overdue_count

            FROM credits c

            LEFT JOIN (
                SELECT
                    credit_id,
                    COALESCE(
                        SUM(amount),
                        0
                    ) AS paid_amount
                FROM credit_payments
                GROUP BY credit_id
            ) paid
                ON paid.credit_id = c.id

            WHERE c.account_id = $1
            `,
            [accountId]
        );

        const row = result.rows[0];

        return {
            openCount: Number(
                row.open_count ?? 0
            ),
            outstandingAmount: Number(
                row.outstanding_amount ?? 0
            ),
            overdueCount: Number(
                row.overdue_count ?? 0
            ),
        };
    },

    /*
     * ============================================================
     * PAYABLES
     * ============================================================
     */

    async getPayablesSummary(
        client,
        { accountId }
    ) {
        const result = await client.query(
            `
            SELECT
                COUNT(*) FILTER (
                    WHERE p.status IN (
                        'pending',
                        'partial'
                    )
                )::INTEGER AS open_count,

                COALESCE(
                    SUM(
                        GREATEST(
                            p.amount -
                            COALESCE(
                                paid.paid_amount,
                                0
                            ),
                            0
                        )
                    ) FILTER (
                        WHERE p.status IN (
                            'pending',
                            'partial'
                        )
                    ),
                    0
                ) AS outstanding_amount,

                COUNT(*) FILTER (
                    WHERE p.status IN (
                        'pending',
                        'partial'
                    )
                    AND p.due_date IS NOT NULL
                    AND p.due_date < CURRENT_DATE
                )::INTEGER AS overdue_count

            FROM payables p

            LEFT JOIN (
                SELECT
                    payable_id,
                    COALESCE(
                        SUM(amount),
                        0
                    ) AS paid_amount
                FROM payable_payments
                GROUP BY payable_id
            ) paid
                ON paid.payable_id = p.id

            WHERE p.account_id = $1
            `,
            [accountId]
        );

        const row = result.rows[0];

        return {
            openCount: Number(
                row.open_count ?? 0
            ),
            outstandingAmount: Number(
                row.outstanding_amount ?? 0
            ),
            overdueCount: Number(
                row.overdue_count ?? 0
            ),
        };
    },

    /*
     * ============================================================
     * INVENTORY ALERTS
     * ============================================================
     */

    async getInventorySummary(
        client,
        {
            accountId,
            branchId = null,
        }
    ) {
        const result = await client.query(
            `
            SELECT
                COUNT(*) FILTER (
                    WHERE stock = 0
                )::INTEGER AS out_of_stock_count,

                COUNT(*) FILTER (
                    WHERE stock > 0
                      AND stock <= low_stock_threshold
                )::INTEGER AS low_stock_count

            FROM products

            WHERE account_id = $1
              AND status = 'active'

              AND (
                    $2::uuid IS NULL
                    OR branch_id = $2
                  )
            `,
            [
                accountId,
                branchId,
            ]
        );

        const row = result.rows[0];

        return {
            outOfStockCount: Number(
                row.out_of_stock_count ?? 0
            ),
            lowStockCount: Number(
                row.low_stock_count ?? 0
            ),
        };
    },

    /*
     * ============================================================
     * RECENT SALES
     * ============================================================
     */

    async getRecentSales(
        client,
        {
            accountId,
            branchId = null,
            limit = 5,
        }
    ) {
        const result = await client.query(
            `
            SELECT
                s.id,
                s.branch_id,
                b.name AS branch_name,
                s.customer_name,
                s.total_amount,
                s.payment_status,
                s.created_at

            FROM sales s

            INNER JOIN branches b
                ON b.id = s.branch_id
                AND b.account_id = s.account_id

            WHERE s.account_id = $1

              AND (
                    $2::uuid IS NULL
                    OR s.branch_id = $2
                  )

            ORDER BY
                s.created_at DESC,
                s.id DESC

            LIMIT $3
            `,
            [
                accountId,
                branchId,
                limit,
            ]
        );

        return result.rows.map((row) => ({
            id: row.id,
            branchId: row.branch_id,
            branchName: row.branch_name,
            customerName: row.customer_name,
            totalAmount: Number(
                row.total_amount ?? 0
            ),
            paymentStatus: row.payment_status,
            createdAt: row.created_at,
        }));
    },

    /*
     * ============================================================
     * BRANCH
     * ============================================================
     */

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
                status
            FROM branches
            WHERE id = $1
              AND account_id = $2
            LIMIT 1
            `,
            [
                branchId,
                accountId,
            ]
        );

        return result.rows[0] ?? null;
    },
};

export default OverviewRepository;