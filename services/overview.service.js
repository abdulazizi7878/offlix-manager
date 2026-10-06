// file: services/overview.service.js

import pool from "@/lib/database";

import AppError from "@/lib/errors/AppError";

import AuthorizationService from "@/services/authorization.service";

import OverviewRepository from "@/repositories/overview.repository";

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
             * Overview permission
             * --------------------------------------------------------
             */

            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "overview.view"
            );

            /*
             * --------------------------------------------------------
             * Branch
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
            }

            /*
             * --------------------------------------------------------
             * Overview data
             * --------------------------------------------------------
             */

            const [
                money,
                sales,
                receivables,
                payables,
                inventory,
                recentSales,
            ] = await Promise.all([
                OverviewRepository.getMoneyAccountSummary(
                    client,
                    {
                        accountId,
                    }
                ),

                OverviewRepository.getSalesSummary(
                    client,
                    {
                        accountId,
                        branchId,
                        from: options.from || null,
                        to: options.to || null,
                    }
                ),

                OverviewRepository.getReceivablesSummary(
                    client,
                    {
                        accountId,
                    }
                ),

                OverviewRepository.getPayablesSummary(
                    client,
                    {
                        accountId,
                    }
                ),

                OverviewRepository.getInventorySummary(
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
                        limit: options.limit || 5,
                    }
                ),
            ]);

            return {
                money,
                sales,
                receivables,
                payables,
                inventory,
                recentSales,
            };
        } catch (error) {
            console.error(
                "OverviewService.getOverview:",
                error
            );
            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "OverviewService.getOverview:",
                error
            );

            throw new AppError(
                "Failed to fetch overview.",
                500,
                "OVERVIEW_FETCH_FAILED"
            );
        } finally {
            client.release();
        }
    },
};

export default OverviewService;