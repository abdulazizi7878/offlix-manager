// file: repositories/overview.repository.js

const OverviewRepository = {
    /*
     * ============================================================
     * SUMMARY
     * ============================================================
     */

    async getSummary(
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
            WITH sales_totals AS (
                SELECT
                    s.id,
                    s.total_amount
                FROM sales s
                WHERE s.account_id = $1
                  AND (
                        $2::uuid IS NULL
                        OR s.branch_id = $2
                  )
                  AND (
                        $3::timestamptz IS NULL
                        OR s.created_at >= $3
                  )
                  AND (
                        $4::timestamptz IS NULL
                        OR s.created_at < $4
                  )
            ),
            item_totals AS (
                SELECT
                    si.sale_id,
                    COALESCE(
                        SUM(si.quantity),
                        0
                    ) AS units_sold,
                    COALESCE(
                        SUM(
                            si.quantity *
                            COALESCE(p.cost_price, 0)
                        ),
                        0
                    ) AS estimated_cogs
                FROM sale_items si
                INNER JOIN sales_totals st
                    ON st.id = si.sale_id
                LEFT JOIN products p
                    ON p.id = si.product_id
                GROUP BY si.sale_id
            )
            SELECT
                COUNT(*)::INTEGER AS sales_count,

                COALESCE(
                    SUM(st.total_amount),
                    0
                ) AS revenue,

                COALESCE(
                    SUM(it.estimated_cogs),
                    0
                ) AS estimated_cogs,

                COALESCE(
                    SUM(st.total_amount),
                    0
                )
                -
                COALESCE(
                    SUM(it.estimated_cogs),
                    0
                ) AS estimated_profit,

                COALESCE(
                    SUM(it.units_sold),
                    0
                )::INTEGER AS units_sold

            FROM sales_totals st
            LEFT JOIN item_totals it
                ON it.sale_id = st.id
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

            revenue: Number(
                row.revenue ?? 0
            ),

            estimatedCogs: Number(
                row.estimated_cogs ?? 0
            ),

            estimatedProfit: Number(
                row.estimated_profit ?? 0
            ),

            unitsSold: Number(
                row.units_sold ?? 0
            ),
        };
    },

    /*
     * ============================================================
     * SALES TREND
     * ============================================================
     */

    async getSalesTrend(
        client,
        {
            accountId,
            branchId = null,
            from,
            to,
            interval = "day",
        }
    ) {
        const allowedIntervals = new Set([
            "hour",
            "day",
            "week",
            "month",
        ]);

        if (!allowedIntervals.has(interval)) {
            throw new Error(
                "Invalid sales trend interval."
            );
        }

        const result = await client.query(
            `
            WITH sales_totals AS (
                SELECT
                    s.id,
                    s.created_at,
                    s.total_amount
                FROM sales s
                WHERE s.account_id = $1
                  AND (
                        $2::uuid IS NULL
                        OR s.branch_id = $2
                  )
                  AND (
                        $3::timestamptz IS NULL
                        OR s.created_at >= $3
                  )
                  AND (
                        $4::timestamptz IS NULL
                        OR s.created_at < $4
                  )
            ),
            item_totals AS (
                SELECT
                    si.sale_id,
                    COALESCE(
                        SUM(si.quantity),
                        0
                    ) AS units_sold,
                    COALESCE(
                        SUM(
                            si.quantity *
                            COALESCE(p.cost_price, 0)
                        ),
                        0
                    ) AS estimated_cogs
                FROM sale_items si
                INNER JOIN sales_totals st
                    ON st.id = si.sale_id
                LEFT JOIN products p
                    ON p.id = si.product_id
                GROUP BY si.sale_id
            )
            SELECT
                DATE_TRUNC(
                    '${interval}',
                    st.created_at
                ) AS period,

                COUNT(*)::INTEGER AS sales_count,

                COALESCE(
                    SUM(st.total_amount),
                    0
                ) AS revenue,

                COALESCE(
                    SUM(it.units_sold),
                    0
                )::INTEGER AS units_sold,

                COALESCE(
                    SUM(it.estimated_cogs),
                    0
                ) AS estimated_cogs,

                COALESCE(
                    SUM(st.total_amount),
                    0
                )
                -
                COALESCE(
                    SUM(it.estimated_cogs),
                    0
                ) AS estimated_profit

            FROM sales_totals st

            LEFT JOIN item_totals it
                ON it.sale_id = st.id

            GROUP BY
                DATE_TRUNC(
                    '${interval}',
                    st.created_at
                )

            ORDER BY period ASC
            `,
            [
                accountId,
                branchId,
                from,
                to,
            ]
        );

        return result.rows.map((row) => ({
            period: row.period,

            salesCount: Number(
                row.sales_count ?? 0
            ),

            revenue: Number(
                row.revenue ?? 0
            ),

            unitsSold: Number(
                row.units_sold ?? 0
            ),

            estimatedCogs: Number(
                row.estimated_cogs ?? 0
            ),

            estimatedProfit: Number(
                row.estimated_profit ?? 0
            ),
        }));
    },

    /*
     * ============================================================
     * SALES BY PAYMENT STATUS
     * ============================================================
     */

    async getSalesByPaymentStatus(
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
                s.payment_status,

                COUNT(*)::INTEGER
                    AS sales_count,

                COALESCE(
                    SUM(s.total_amount),
                    0
                ) AS total_amount

            FROM sales s

            WHERE s.account_id = $1

              AND (
                    $2::uuid IS NULL
                    OR s.branch_id = $2
              )

              AND (
                    $3::timestamptz IS NULL
                    OR s.created_at >= $3
              )

              AND (
                    $4::timestamptz IS NULL
                    OR s.created_at < $4
              )

            GROUP BY s.payment_status

            ORDER BY total_amount DESC
            `,
            [
                accountId,
                branchId,
                from,
                to,
            ]
        );

        return result.rows.map((row) => ({
            paymentStatus: row.payment_status,

            salesCount: Number(
                row.sales_count ?? 0
            ),

            totalAmount: Number(
                row.total_amount ?? 0
            ),
        }));
    },

    /*
     * ============================================================
     * TOP PRODUCTS
     * ============================================================
     */

    async getTopProducts(
        client,
        {
            accountId,
            branchId = null,
            from,
            to,
            page = 1,
            limit = 10,
        }
    ) {
        const offset = (page - 1) * limit;

        const result = await client.query(
            `
            SELECT
                si.product_id,

                si.product_name,

                SUM(si.quantity)::INTEGER
                    AS units_sold,

                COALESCE(
                    SUM(si.total_amount),
                    0
                ) AS revenue,

                COALESCE(
                    SUM(
                        si.quantity *
                        COALESCE(p.cost_price, 0)
                    ),
                    0
                ) AS estimated_cogs,

                COALESCE(
                    SUM(si.total_amount),
                    0
                )
                -
                COALESCE(
                    SUM(
                        si.quantity *
                        COALESCE(p.cost_price, 0)
                    ),
                    0
                ) AS estimated_profit

            FROM sale_items si

            INNER JOIN sales s
                ON s.id = si.sale_id

            LEFT JOIN products p
                ON p.id = si.product_id

            WHERE s.account_id = $1

              AND (
                    $2::uuid IS NULL
                    OR s.branch_id = $2
              )

              AND (
                    $3::timestamptz IS NULL
                    OR s.created_at >= $3
              )

              AND (
                    $4::timestamptz IS NULL
                    OR s.created_at < $4
              )

            GROUP BY
                si.product_id,
                si.product_name

            ORDER BY
                revenue DESC,
                si.product_id ASC

            LIMIT $5
            OFFSET $6
            `,
            [
                accountId,
                branchId,
                from,
                to,
                limit,
                offset,
            ]
        );

        return result.rows.map((row) => ({
            productId: row.product_id,

            productName: row.product_name,

            unitsSold: Number(
                row.units_sold ?? 0
            ),

            revenue: Number(
                row.revenue ?? 0
            ),

            estimatedCogs: Number(
                row.estimated_cogs ?? 0
            ),

            estimatedProfit: Number(
                row.estimated_profit ?? 0
            ),
        }));
    },

    async countTopProducts(
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
            SELECT COUNT(*)::INTEGER AS count

            FROM (
                SELECT
                    si.product_id

                FROM sale_items si

                INNER JOIN sales s
                    ON s.id = si.sale_id

                WHERE s.account_id = $1

                  AND (
                        $2::uuid IS NULL
                        OR s.branch_id = $2
                  )

                  AND (
                        $3::timestamptz IS NULL
                        OR s.created_at >= $3
                  )

                  AND (
                        $4::timestamptz IS NULL
                        OR s.created_at < $4
                  )

                GROUP BY si.product_id
            ) products
            `,
            [
                accountId,
                branchId,
                from,
                to,
            ]
        );

        return Number(
            result.rows[0]?.count ?? 0
        );
    },

    /*
     * ============================================================
     * PURCHASE SUMMARY
     * ============================================================
     */

    async getPurchaseSummary(
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
                COUNT(*)::INTEGER
                    AS purchase_count,

                COALESCE(
                    SUM(quantity),
                    0
                )::INTEGER AS units_purchased,

                COALESCE(
                    SUM(
                        quantity * cost_price
                    ),
                    0
                ) AS purchase_cost

            FROM branch_purchases

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
            purchaseCount: Number(
                row.purchase_count ?? 0
            ),

            unitsPurchased: Number(
                row.units_purchased ?? 0
            ),

            purchaseCost: Number(
                row.purchase_cost ?? 0
            ),
        };
    },

    /*
     * ============================================================
     * PURCHASE TREND
     * ============================================================
     */

    async getPurchaseTrend(
        client,
        {
            accountId,
            branchId = null,
            from,
            to,
            interval = "day",
        }
    ) {
        const allowedIntervals = new Set([
            "hour",
            "day",
            "week",
            "month",
        ]);

        if (!allowedIntervals.has(interval)) {
            throw new Error(
                "Invalid purchase trend interval."
            );
        }

        const result = await client.query(
            `
            SELECT
                DATE_TRUNC(
                    '${interval}',
                    created_at
                ) AS period,

                COUNT(*)::INTEGER
                    AS purchase_count,

                COALESCE(
                    SUM(quantity),
                    0
                )::INTEGER AS units_purchased,

                COALESCE(
                    SUM(
                        quantity * cost_price
                    ),
                    0
                ) AS purchase_cost

            FROM branch_purchases

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

            GROUP BY
                DATE_TRUNC(
                    '${interval}',
                    created_at
                )

            ORDER BY period ASC
            `,
            [
                accountId,
                branchId,
                from,
                to,
            ]
        );

        return result.rows.map((row) => ({
            period: row.period,

            purchaseCount: Number(
                row.purchase_count ?? 0
            ),

            unitsPurchased: Number(
                row.units_purchased ?? 0
            ),

            purchaseCost: Number(
                row.purchase_cost ?? 0
            ),
        }));
    },

    /*
     * ============================================================
     * INVENTORY SNAPSHOT
     * ============================================================
     *
     * Current state, not historical period state.
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
                COUNT(*)::INTEGER
                    AS product_count,

                COALESCE(
                    SUM(stock),
                    0
                )::INTEGER AS total_units,

                COALESCE(
                    SUM(
                        stock * cost_price
                    ),
                    0
                ) AS inventory_cost_value,

                COALESCE(
                    SUM(
                        stock * selling_price
                    ),
                    0
                ) AS inventory_retail_value,

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
            productCount: Number(
                row.product_count ?? 0
            ),

            totalUnits: Number(
                row.total_units ?? 0
            ),

            inventoryCostValue: Number(
                row.inventory_cost_value ?? 0
            ),

            inventoryRetailValue: Number(
                row.inventory_retail_value ?? 0
            ),

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
     * LOW STOCK / OUT OF STOCK
     * ============================================================
     */

    async getInventoryAlerts(
        client,
        {
            accountId,
            branchId = null,
            page = 1,
            limit = 10,
        }
    ) {
        const offset = (page - 1) * limit;

        const result = await client.query(
            `
            SELECT
                p.id,

                p.branch_id,

                p.name,

                p.stock,

                p.low_stock_threshold,

                p.cost_price,

                p.selling_price,

                CASE
                    WHEN p.stock = 0
                        THEN 'out_of_stock'

                    ELSE 'low_stock'
                END AS alert_type

            FROM products p

            WHERE p.account_id = $1

              AND p.status = 'active'

              AND (
                    $2::uuid IS NULL
                    OR p.branch_id = $2
              )

              AND (
                    p.stock = 0
                    OR p.stock <= p.low_stock_threshold
              )

            ORDER BY
                CASE
                    WHEN p.stock = 0 THEN 0
                    ELSE 1
                END,

                p.stock ASC,

                p.name ASC,

                p.id ASC

            LIMIT $3
            OFFSET $4
            `,
            [
                accountId,
                branchId,
                limit,
                offset,
            ]
        );

        return result.rows.map((row) => ({
            id: row.id,

            branchId: row.branch_id,

            name: row.name,

            stock: Number(
                row.stock ?? 0
            ),

            lowStockThreshold: Number(
                row.low_stock_threshold ?? 0
            ),

            costPrice: Number(
                row.cost_price ?? 0
            ),

            sellingPrice: Number(
                row.selling_price ?? 0
            ),

            alertType: row.alert_type,
        }));
    },

    async countInventoryAlerts(
        client,
        {
            accountId,
            branchId = null,
        }
    ) {
        const result = await client.query(
            `
            SELECT COUNT(*)::INTEGER AS count

            FROM products

            WHERE account_id = $1

              AND status = 'active'

              AND (
                    $2::uuid IS NULL
                    OR branch_id = $2
              )

              AND (
                    stock = 0
                    OR stock <= low_stock_threshold
              )
            `,
            [
                accountId,
                branchId,
            ]
        );

        return Number(
            result.rows[0]?.count ?? 0
        );
    },

    /*
     * ============================================================
     * BRANCH PERFORMANCE
     * ============================================================
     */

    async getBranchPerformance(
        client,
        {
            accountId,
            from,
            to,
        }
    ) {
        const result = await client.query(
            `
            WITH branch_sales AS (
                SELECT
                    s.branch_id,

                    COUNT(*)::INTEGER
                        AS sales_count,

                    COALESCE(
                        SUM(s.total_amount),
                        0
                    ) AS revenue

                FROM sales s

                WHERE s.account_id = $1

                  AND (
                        $2::timestamptz IS NULL
                        OR s.created_at >= $2
                  )

                  AND (
                        $3::timestamptz IS NULL
                        OR s.created_at < $3
                  )

                GROUP BY s.branch_id
            ),

            branch_items AS (
                SELECT
                    s.branch_id,

                    COALESCE(
                        SUM(si.quantity),
                        0
                    )::INTEGER AS units_sold,

                    COALESCE(
                        SUM(
                            si.quantity *
                            COALESCE(
                                p.cost_price,
                                0
                            )
                        ),
                        0
                    ) AS estimated_cogs

                FROM sales s

                INNER JOIN sale_items si
                    ON si.sale_id = s.id

                LEFT JOIN products p
                    ON p.id = si.product_id

                WHERE s.account_id = $1

                  AND (
                        $2::timestamptz IS NULL
                        OR s.created_at >= $2
                  )

                  AND (
                        $3::timestamptz IS NULL
                        OR s.created_at < $3
                  )

                GROUP BY s.branch_id
            )

            SELECT
                b.id AS branch_id,

                b.name AS branch_name,

                COALESCE(
                    bs.sales_count,
                    0
                )::INTEGER AS sales_count,

                COALESCE(
                    bs.revenue,
                    0
                ) AS revenue,

                COALESCE(
                    bi.units_sold,
                    0
                )::INTEGER AS units_sold,

                COALESCE(
                    bi.estimated_cogs,
                    0
                ) AS estimated_cogs

            FROM branches b

            LEFT JOIN branch_sales bs
                ON bs.branch_id = b.id

            LEFT JOIN branch_items bi
                ON bi.branch_id = b.id

            WHERE b.account_id = $1

            ORDER BY
                revenue DESC,

                b.name ASC
            `,
            [
                accountId,
                from,
                to,
            ]
        );

        return result.rows.map((row) => {
            const revenue = Number(
                row.revenue ?? 0
            );

            const estimatedCogs = Number(
                row.estimated_cogs ?? 0
            );

            return {
                branchId: row.branch_id,

                branchName: row.branch_name,

                salesCount: Number(
                    row.sales_count ?? 0
                ),

                revenue,

                unitsSold: Number(
                    row.units_sold ?? 0
                ),

                estimatedCogs,

                estimatedProfit:
                    revenue -
                    estimatedCogs,
            };
        });
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
            page = 1,
            limit = 10,
        }
    ) {
        const offset = (page - 1) * limit;

        const result = await client.query(
            `
            SELECT
                s.id,

                s.branch_id,

                b.name AS branch_name,

                s.customer_name,

                s.total_amount,

                s.payment_status,

                s.created_by_user_id,

                u.name AS created_by_name,

                s.created_at

            FROM sales s

            INNER JOIN branches b
                ON b.id = s.branch_id
                AND b.account_id = s.account_id

            LEFT JOIN users u
                ON u.id = s.created_by_user_id

            WHERE s.account_id = $1

              AND (
                    $2::uuid IS NULL
                    OR s.branch_id = $2
              )

            ORDER BY
                s.created_at DESC,

                s.id DESC

            LIMIT $3
            OFFSET $4
            `,
            [
                accountId,
                branchId,
                limit,
                offset,
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

            createdByUserId:
                row.created_by_user_id,

            createdByName:
                row.created_by_name,

            createdAt: row.created_at,
        }));
    },

    async countRecentSales(
        client,
        {
            accountId,
            branchId = null,
        }
    ) {
        const result = await client.query(
            `
            SELECT COUNT(*)::INTEGER AS count

            FROM sales

            WHERE account_id = $1

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

        return Number(
            result.rows[0]?.count ?? 0
        );
    },

    /*
     * ============================================================
     * MONEY FLOW
     * ============================================================
     *
     * money_transactions has NO branch_id.
     *
     * Therefore this metric is account-level.
     *
     * Internal money transfers are stored separately in
     * money_transfers and are not included here.
     */

    async getMoneySummary(
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
                COALESCE(
                    SUM(
                        CASE
                            WHEN direction = 'in'
                                THEN amount

                            ELSE 0
                        END
                    ),
                    0
                ) AS money_in,

                COALESCE(
                    SUM(
                        CASE
                            WHEN direction = 'out'
                                THEN amount

                            ELSE 0
                        END
                    ),
                    0
                ) AS money_out

            FROM money_transactions

            WHERE account_id = $1

              AND (
                    $2::timestamptz IS NULL
                    OR created_at >= $2
              )

              AND (
                    $3::timestamptz IS NULL
                    OR created_at < $3
              )
            `,
            [
                accountId,
                from,
                to,
            ]
        );

        const row = result.rows[0];

        const moneyIn = Number(
            row.money_in ?? 0
        );

        const moneyOut = Number(
            row.money_out ?? 0
        );

        return {
            scope: "account",

            moneyIn,

            moneyOut,

            netMoneyFlow:
                moneyIn - moneyOut,
        };
    },

    /*
     * ============================================================
     * RECEIVABLES / CREDITS
     * ============================================================
     *
     * credits has NO branch_id.
     *
     * Therefore this metric is account-level.
     */

    async getReceivablesSummary(
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
            [
                accountId,
            ]
        );

        const row = result.rows[0];

        return {
            scope: "account",

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
     *
     * payables has NO branch_id.
     *
     * Therefore this metric is account-level.
     */

    async getPayablesSummary(
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
            [
                accountId,
            ]
        );

        const row = result.rows[0];

        return {
            scope: "account",

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
     * SETTLEMENTS
     * ============================================================
     */

    async getSettlementSummary(
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
                    WHERE ss.status = 'pending'
                )::INTEGER AS pending_count,

                COUNT(*) FILTER (
                    WHERE ss.status = 'requested'
                )::INTEGER AS requested_count,

                COUNT(*) FILTER (
                    WHERE ss.status = 'received'
                )::INTEGER AS received_count,

                COALESCE(
                    SUM(ss.amount) FILTER (
                        WHERE ss.status IN (
                            'pending',
                            'requested'
                        )
                    ),
                    0
                ) AS pending_amount

            FROM sale_settlements ss

            WHERE ss.account_id = $1

              AND (
                    $2::uuid IS NULL
                    OR ss.branch_id = $2
              )
            `,
            [
                accountId,
                branchId,
            ]
        );

        const row = result.rows[0];

        return {
            pendingCount: Number(
                row.pending_count ?? 0
            ),

            requestedCount: Number(
                row.requested_count ?? 0
            ),

            receivedCount: Number(
                row.received_count ?? 0
            ),

            pendingAmount: Number(
                row.pending_amount ?? 0
            ),
        };
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