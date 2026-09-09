// file: services/branch-access.service.js

import pool from "@/lib/database";

import AppError from "@/lib/errors/AppError";

import BranchAccessRepository from "@/repositories/branch-access.repository";

import AuthorizationService from "@/services/authorization.service";

const BranchAccessService = {
    async getAvailableBranches(
        userId,
        accountId,
        permissionKey
    ) {
        const client = await pool.connect();

        try {
            await AuthorizationService.assertAccountMember(
                client,
                userId,
                accountId
            );

            return await BranchAccessRepository.getAvailableBranches(
                client,
                userId,
                accountId,
                permissionKey
            );
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "BranchAccessService.getAvailableBranches:",
                error
            );

            throw new AppError(
                "Failed to get available branches.",
                500,
                "AVAILABLE_BRANCHES_FETCH_FAILED"
            );
        } finally {
            client.release();
        }
    },
};

export default BranchAccessService;