// file: services/overview.service.js

import pool from "@/lib/database";

import AppError from "@/lib/errors/AppError";

import AuthorizationService from "@/services/authorization.service";

import OverviewRepository from "@/repositories/overview.repository";

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 10;

const PERIODS = new Set([
    "today",
    "week",
    "month",
    "three_months",
    "year",
    "all_time",
    "custom",
]);

const TREND_INTERVALS = {
    today: "hour",
    week: "day",
    month: "day",
    three_months: "week",
    year: "month",
    all_time: "month",
    custom: "day",
};

function parseDate(value, fallback = new Date()) {
    if (!value) {
        return new Date(fallback);
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        throw new AppError(
            "Invalid date.",
            400,
            "INVALID_DATE"
        );
    }

    return date;
}

function startOfDay(date) {
    const result = new Date(date);

    result.setHours(0, 0, 0, 0);

    return result;
}

function endExclusiveOfDay(date) {
    const result = startOfDay(date);

    result.setDate(result.getDate() + 1);

    return result;
}

function startOfWeek(date) {
    const result = startOfDay(date);

    const day = result.getDay();

    const diff = day === 0
        ? -6
        : 1 - day;

    result.setDate(result.getDate() + diff);

    return result;
}

function startOfMonth(date) {
    return new Date(
        date.getFullYear(),
        date.getMonth(),
        1
    );
}

function startOfYear(date) {
    return new Date(
        date.getFullYear(),
        0,
        1
    );
}

function addDays(date, amount) {
    const result = new Date(date);

    result.setDate(result.getDate() + amount);

    return result;
}

function addMonths(date, amount) {
    const result = new Date(date);

    result.setMonth(result.getMonth() + amount);

    return result;
}

function getPeriodRange({
    period,
    date,
    customFrom,
    customTo,
}) {
    const selectedDate = parseDate(date);

    if (period === "today") {
        const from = startOfDay(selectedDate);
        const to = endExclusiveOfDay(selectedDate);

        return {
            from,
            to,

            previous: {
                from: addDays(from, -1),
                to: from,
            },

            next: {
                from: to,
                to: addDays(to, 1),
            },
        };
    }

    if (period === "week") {
        const from = startOfWeek(selectedDate);
        const to = addDays(from, 7);

        return {
            from,
            to,

            previous: {
                from: addDays(from, -7),
                to: from,
            },

            next: {
                from: to,
                to: addDays(to, 7),
            },
        };
    }

    if (period === "month") {
        const from = startOfMonth(selectedDate);
        const to = addMonths(from, 1);

        return {
            from,
            to,

            previous: {
                from: addMonths(from, -1),
                to: from,
            },

            next: {
                from: to,
                to: addMonths(to, 1),
            },
        };
    }

    if (period === "three_months") {
        const currentMonth = startOfMonth(
            selectedDate
        );

        const from = addMonths(
            currentMonth,
            -2
        );

        const to = addMonths(
            currentMonth,
            1
        );

        return {
            from,
            to,

            previous: {
                from: addMonths(from, -3),
                to: from,
            },

            next: {
                from: to,
                to: addMonths(to, 3),
            },
        };
    }

    if (period === "year") {
        const from = startOfYear(selectedDate);

        const to = new Date(
            from.getFullYear() + 1,
            0,
            1
        );

        return {
            from,
            to,

            previous: {
                from: new Date(
                    from.getFullYear() - 1,
                    0,
                    1
                ),
                to: from,
            },

            next: {
                from: to,
                to: new Date(
                    to.getFullYear() + 1,
                    0,
                    1
                ),
            },
        };
    }

    if (period === "all_time") {
        return {
            from: null,
            to: null,
            previous: null,
            next: null,
        };
    }

    if (period === "custom") {
        if (!customFrom || !customTo) {
            throw new AppError(
                "Custom period requires both from and to dates.",
                400,
                "CUSTOM_PERIOD_DATES_REQUIRED"
            );
        }

        const from = parseDate(customFrom);
        const to = parseDate(customTo);

        if (from >= to) {
            throw new AppError(
                "The custom start date must be before the end date.",
                400,
                "INVALID_CUSTOM_PERIOD"
            );
        }

        return {
            from,
            to,
            previous: null,
            next: null,
        };
    }

    throw new AppError(
        "Invalid overview period.",
        400,
        "INVALID_PERIOD"
    );
}

function normalizePagination(options = {}) {
    const page = Math.max(
        1,
        Number(options.page) || 1
    );

    const limit = Math.min(
        MAX_PAGE_SIZE,
        Math.max(
            1,
            Number(options.limit) ||
            DEFAULT_PAGE_SIZE
        )
    );

    return {
        page,
        limit,
    };
}

function buildPagination({
    page,
    limit,
    total,
}) {
    return {
        page,
        limit,
        total: Number(total ?? 0),
        totalPages: Math.ceil(
            Number(total ?? 0) / limit
        ),
    };
}

function serializeDate(date) {
    return date
        ? date.toISOString()
        : null;
}

const OverviewService = {
    async getOverview(
        userId,
        accountId,
        options = {}
    ) {
        const client = await pool.connect();

        try {
            /*
             * --------------------------------------------------------
             * Account authorization
             * --------------------------------------------------------
             */
            await AuthorizationService.assertAccountMember(
                client,
                userId,
                accountId
            );

            const period =
                options.period || "today";

            if (!PERIODS.has(period)) {
                throw new AppError(
                    "Invalid overview period.",
                    400,
                    "INVALID_PERIOD"
                );
            }

            /*
             * --------------------------------------------------------
             * Branch authorization
             * --------------------------------------------------------
             */
            const branchId =
                options.branchId || null;

            if (branchId) {
                const branch =
                    await OverviewRepository.getBranchForAccount(
                        client,
                        branchId,
                        accountId
                    );

                if (!branch) {
                    throw new AppError(
                        "Branch not found.",
                        404,
                        "BRANCH_NOT_FOUND"
                    );
                }

                /*
                 * IMPORTANT:
                 * Do not assume reports.view exists.
                 *
                 * The repository/service should use the actual
                 * permission configured in the authorization system.
                 */
                await AuthorizationService.assertBranchPermission(
                    client,
                    userId,
                    accountId,
                    branchId,
                    "reports.view"
                );
            }

            /*
             * --------------------------------------------------------
             * Period
             * --------------------------------------------------------
             */
            const range =
                getPeriodRange({
                    period,
                    date: options.date,
                    customFrom: options.from,
                    customTo: options.to,
                });

            const interval =
                TREND_INTERVALS[period];

            /*
             * --------------------------------------------------------
             * Pagination
             * --------------------------------------------------------
             *
             * Aggregated KPIs and charts are NOT paginated.
             *
             * Potentially large lists are paginated.
             */
            const pagination =
                normalizePagination(options);

            /*
             * --------------------------------------------------------
             * Dashboard queries
             * --------------------------------------------------------
             */
            const [
                summary,
                salesTrend,
                salesByPaymentStatus,
                topProducts,
                topProductsTotal,
                purchaseSummary,
                purchaseTrend,
                inventorySummary,
                inventoryAlerts,
                inventoryAlertsTotal,
                recentSales,
                recentSalesTotal,
                moneySummary,
                receivablesSummary,
                payablesSummary,
                settlementSummary,
                branchPerformance,
            ] = await Promise.all([
                OverviewRepository.getSummary(
                    client,
                    {
                        accountId,
                        branchId,
                        from: range.from,
                        to: range.to,
                    }
                ),

                OverviewRepository.getSalesTrend(
                    client,
                    {
                        accountId,
                        branchId,
                        from: range.from,
                        to: range.to,
                        interval,
                    }
                ),

                OverviewRepository.getSalesByPaymentStatus(
                    client,
                    {
                        accountId,
                        branchId,
                        from: range.from,
                        to: range.to,
                    }
                ),

                OverviewRepository.getTopProducts(
                    client,
                    {
                        accountId,
                        branchId,
                        from: range.from,
                        to: range.to,
                        page: pagination.page,
                        limit: pagination.limit,
                    }
                ),

                OverviewRepository.countTopProducts(
                    client,
                    {
                        accountId,
                        branchId,
                        from: range.from,
                        to: range.to,
                    }
                ),

                OverviewRepository.getPurchaseSummary(
                    client,
                    {
                        accountId,
                        branchId,
                        from: range.from,
                        to: range.to,
                    }
                ),

                OverviewRepository.getPurchaseTrend(
                    client,
                    {
                        accountId,
                        branchId,
                        from: range.from,
                        to: range.to,
                        interval,
                    }
                ),

                OverviewRepository.getInventorySummary(
                    client,
                    {
                        accountId,
                        branchId,
                    }
                ),

                OverviewRepository.getInventoryAlerts(
                    client,
                    {
                        accountId,
                        branchId,
                        page: pagination.page,
                        limit: pagination.limit,
                    }
                ),

                OverviewRepository.countInventoryAlerts(
                    client,
                    {
                        accountId,
                        branchId,
                    }
                ),

                OverviewRepository.getRecentSales(
                    client,
                    {
                        accountId,
                        branchId,
                        page: pagination.page,
                        limit: pagination.limit,
                    }
                ),

                OverviewRepository.countRecentSales(
                    client,
                    {
                        accountId,
                        branchId,
                    }
                ),

                /*
                 * Money is account-level because the current
                 * money_transactions schema has no branch_id.
                 *
                 * The repository must NOT filter money_transactions
                 * directly by branchId.
                 */
                OverviewRepository.getMoneySummary(
                    client,
                    {
                        accountId,
                        branchId,
                        from: range.from,
                        to: range.to,
                    }
                ),

                /*
                 * Credits are account-level because credits do not
                 * currently contain branch_id.
                 */
                OverviewRepository.getReceivablesSummary(
                    client,
                    {
                        accountId,
                        branchId,
                    }
                ),

                /*
                 * Payables are account-level because payables do not
                 * currently contain branch_id.
                 */
                OverviewRepository.getPayablesSummary(
                    client,
                    {
                        accountId,
                        branchId,
                    }
                ),

                OverviewRepository.getSettlementSummary(
                    client,
                    {
                        accountId,
                        branchId,
                    }
                ),

                /*
                 * Branch performance only makes sense when viewing
                 * the whole account.
                 */
                branchId
                    ? null
                    : OverviewRepository.getBranchPerformance(
                        client,
                        {
                            accountId,
                            from: range.from,
                            to: range.to,
                        }
                    ),
            ]);

            /*
             * --------------------------------------------------------
             * Alerts
             * --------------------------------------------------------
             */
            const alerts = {
                lowStock:
                    inventorySummary.lowStockCount,

                outOfStock:
                    inventorySummary.outOfStockCount,

                overdueReceivables:
                    receivablesSummary.overdueCount,

                overduePayables:
                    payablesSummary.overdueCount,

                pendingSettlements:
                    settlementSummary.pendingCount +
                    settlementSummary.requestedCount,
            };

            /*
             * --------------------------------------------------------
             * Final response
             * --------------------------------------------------------
             */
            return {
                period: {
                    type: period,

                    from: serializeDate(
                        range.from
                    ),

                    to: serializeDate(
                        range.to
                    ),

                    interval,

                    navigation: {
                        previous: range.previous
                            ? {
                                from: serializeDate(
                                    range.previous.from
                                ),

                                to: serializeDate(
                                    range.previous.to
                                ),
                            }
                            : null,

                        next: range.next
                            ? {
                                from: serializeDate(
                                    range.next.from
                                ),

                                to: serializeDate(
                                    range.next.to
                                ),
                            }
                            : null,
                    },
                },

                filters: {
                    branchId,
                },

                summary,

                sales: {
                    trend: salesTrend,

                    byPaymentStatus:
                        salesByPaymentStatus,

                    topProducts: {
                        items: topProducts,

                        pagination:
                            buildPagination({
                                page:
                                    pagination.page,

                                limit:
                                    pagination.limit,

                                total:
                                    topProductsTotal,
                            }),
                    },

                    recent: {
                        items: recentSales,

                        pagination:
                            buildPagination({
                                page:
                                    pagination.page,

                                limit:
                                    pagination.limit,

                                total:
                                    recentSalesTotal,
                            }),
                    },
                },

                purchases: {
                    summary: purchaseSummary,
                    trend: purchaseTrend,
                },

                inventory: {
                    summary:
                        inventorySummary,

                    alerts: {
                        items: inventoryAlerts,

                        pagination:
                            buildPagination({
                                page:
                                    pagination.page,

                                limit:
                                    pagination.limit,

                                total:
                                    inventoryAlertsTotal,
                            }),
                    },
                },

                money: moneySummary,

                receivables:
                    receivablesSummary,

                payables:
                    payablesSummary,

                settlements:
                    settlementSummary,

                branches:
                    branchPerformance,

                alerts,
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "OverviewService.getOverview:",
                error
            );

            throw new AppError(
                "Failed to fetch dashboard overview.",
                500,
                "OVERVIEW_FETCH_FAILED"
            );
        } finally {
            client.release();
        }
    },
};

export default OverviewService;