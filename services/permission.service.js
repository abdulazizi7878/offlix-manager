import pool from "@/lib/database";
import AppError from "@/lib/errors/AppError";
import PermissionRepository from "@/repositories/permission.repository";
import AuthorizationService from "@/services/authorization.service";

const PermissionService = {
    async getPermissions(userId, accountId) {
        const client = await pool.connect();

        try {
            await AuthorizationService.assertAccountMember(
                client,
                userId,
                accountId
            );

            return await PermissionRepository.getAllPermissions(
                client
            );
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "PermissionService.getPermissions:",
                error
            );

            throw new AppError(
                "Failed to get permissions.",
                500,
                "PERMISSIONS_FETCH_FAILED"
            );
        } finally {
            client.release();
        }
    },
};

export default PermissionService;