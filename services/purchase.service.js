import pool from "@/lib/database";

import PurchaseRepository from "@/repositories/purchase.repository";
import ProductRepository from "@/repositories/product.repository";

import AuthorizationService from "@/services/authorization.service";

import AppError from "@/lib/errors/AppError";

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

const PurchaseService = {
    async getPurchases(
        userId,
        accountId,
        options = {}
    ) {
        const client = await pool.connect();

        try {
            await AuthorizationService.assertAccountMember(
                client,
                userId,
                accountId
            );

            const page = Math.max(
                Number(options.page) || 1,
                1
            );

            const limit = Math.min(
                Math.max(
                    Number(options.limit) ||
                    DEFAULT_PAGE_SIZE,
                    1
                ),
                MAX_PAGE_SIZE
            );

            const branchId =
                options.branchId ?? null;

            if (branchId) {
                const branch =
                    await ProductRepository.getBranchForAccount(
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

                await AuthorizationService.assertBranchPermission(
                    client,
                    userId,
                    accountId,
                    branchId,
                    "products.view"
                );
            }

            const isCreator =
                await AuthorizationService.isAccountCreator(
                    client,
                    userId,
                    accountId
                );

            const repositoryOptions = {
                ...options,
                page,
                limit,
            };

            const [
                purchases,
                total,
            ] = await Promise.all([
                PurchaseRepository.getPurchasesByAccountId(
                    client,
                    accountId,
                    userId,
                    isCreator,
                    repositoryOptions
                ),

                PurchaseRepository.countPurchasesByAccountId(
                    client,
                    accountId,
                    userId,
                    isCreator,
                    repositoryOptions
                ),
            ]);

            const totalPages = Math.ceil(
                total / limit
            );

            return {
                data: purchases,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNextPage:
                        page < totalPages,
                    hasPreviousPage:
                        page > 1,
                },
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "PurchaseService.getPurchases:",
                error
            );

            throw new AppError(
                "Failed to retrieve purchases.",
                500,
                "PURCHASES_FETCH_FAILED"
            );
        } finally {
            client.release();
        }
    },

    async getPurchase(
        userId,
        accountId,
        purchaseId
    ) {
        const client = await pool.connect();

        try {
            await AuthorizationService.assertAccountMember(
                client,
                userId,
                accountId
            );

            const purchase =
                await PurchaseRepository.getPurchaseById(
                    client,
                    accountId,
                    purchaseId
                );

            if (!purchase) {
                throw new AppError(
                    "Purchase not found.",
                    404,
                    "PURCHASE_NOT_FOUND"
                );
            }

            const isCreator =
                await AuthorizationService.isAccountCreator(
                    client,
                    userId,
                    accountId
                );

            if (!isCreator) {
                await AuthorizationService.assertBranchPermission(
                    client,
                    userId,
                    accountId,
                    purchase.branch_id,
                    "products.view"
                );
            }

            return purchase;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "PurchaseService.getPurchase:",
                error
            );

            throw new AppError(
                "Failed to retrieve purchase.",
                500,
                "PURCHASE_FETCH_FAILED"
            );
        } finally {
            client.release();
        }
    },
};

export default PurchaseService;