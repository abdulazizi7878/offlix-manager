import pool from "@/lib/database";
import AppError from "@/lib/errors/AppError";
import OrganizationSettingsRepository from "@/repositories/organization-settings.repository";
import BranchService from "@/services/branch.service";
import AuthorizationService from "@/services/authorization.service";

const OrganizationSettingsService = {
    async getOrganizationSettings(userId, accountId) {
        const client = await pool.connect();

        try {
            await AuthorizationService.assertAccountMember(
                client,
                userId,
                accountId
            );

            const settings =
                await OrganizationSettingsRepository.getOrganizationSettings(
                    client,
                    accountId
                );

            return {
                branches: settings.branches.map((branch) => ({
                    id: branch.id,
                    name: branch.name,
                    description: branch.description,
                    status: branch.status,
                    createdAt: branch.created_at,
                    updatedAt: branch.updated_at,
                })),

                employees: settings.employees.map((employee) => ({
                    id: employee.id,
                    name: employee.name,
                    email: employee.email,
                    phone: employee.phone,
                    username: employee.username,
                    emailVerifiedAt: employee.email_verified_at,
                    createdAt: employee.created_at,
                    updatedAt: employee.updated_at,
                })),

                memberships: settings.memberships.map((membership) => ({
                    id: membership.id,
                    userId: membership.user_id,
                    branchId: membership.branch_id,
                    status: membership.status,
                    userName: membership.user_name,
                    userEmail: membership.user_email,
                    userPhone: membership.user_phone,
                    userUsername: membership.user_username,
                    branchName: membership.branch_name,
                    createdAt: membership.created_at,
                    updatedAt: membership.updated_at,
                })),

                permissions: settings.permissions.map((permission) => ({
                    id: permission.id,
                    key: permission.key,
                    name: permission.name,
                    description: permission.description,
                })),

                membershipPermissions:
                    settings.membershipPermissions.map((permission) => ({
                        branchMembershipId:
                            permission.branch_membership_id,
                        id: permission.id,
                        key: permission.key,
                        name: permission.name,
                        description: permission.description,
                    })),
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "OrganizationSettingsService.getOrganizationSettings:",
                error
            );

            throw new AppError(
                "Failed to get organization settings.",
                500,
                "ORGANIZATION_SETTINGS_FETCH_FAILED"
            );
        } finally {
            client.release();
        }
    },

    async createBranch(userId, accountId, data) {
        try {
            return await BranchService.createBranch(
                userId,
                accountId,
                data
            );
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "OrganizationSettingsService.createBranch:",
                error
            );

            throw new AppError(
                "Failed to create branch.",
                500,
                "ORGANIZATION_BRANCH_CREATE_FAILED"
            );
        }
    },

    async updateBranch(userId, accountId, branchId, data) {
        try {
            return await BranchService.updateBranch(
                userId,
                accountId,
                branchId,
                data
            );
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "OrganizationSettingsService.updateBranch:",
                error
            );

            throw new AppError(
                "Failed to update branch.",
                500,
                "ORGANIZATION_BRANCH_UPDATE_FAILED"
            );
        }
    },

    async updateBranchStatus(
        userId,
        accountId,
        branchId,
        status
    ) {
        try {
            return await BranchService.updateBranchStatus(
                userId,
                accountId,
                branchId,
                status
            );
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "OrganizationSettingsService.updateBranchStatus:",
                error
            );

            throw new AppError(
                "Failed to update branch status.",
                500,
                "ORGANIZATION_BRANCH_STATUS_UPDATE_FAILED"
            );
        }
    },

    async addEmployeeToBranch(
        userId,
        accountId,
        branchId,
        employeeId,
        permissions
    ) {
        try {
            return await BranchService.addEmployeeToBranch(
                userId,
                accountId,
                branchId,
                employeeId,
                permissions
            );
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "OrganizationSettingsService.addEmployeeToBranch:",
                error
            );

            throw new AppError(
                "Failed to add employee to branch.",
                500,
                "ORGANIZATION_EMPLOYEE_ADD_FAILED"
            );
        }
    },

    async updateEmployeePermissions(
        userId,
        accountId,
        branchId,
        employeeId,
        permissions
    ) {
        try {
            return await BranchService.updateBranchEmployeePermissions(
                userId,
                accountId,
                branchId,
                employeeId,
                permissions
            );
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "OrganizationSettingsService.updateEmployeePermissions:",
                error
            );

            throw new AppError(
                "Failed to update employee permissions.",
                500,
                "ORGANIZATION_EMPLOYEE_PERMISSIONS_UPDATE_FAILED"
            );
        }
    },

    async removeEmployeeFromBranch(
        userId,
        accountId,
        branchId,
        employeeId
    ) {
        try {
            return await BranchService.removeEmployeeFromBranch(
                userId,
                accountId,
                branchId,
                employeeId
            );
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "OrganizationSettingsService.removeEmployeeFromBranch:",
                error
            );

            throw new AppError(
                "Failed to remove employee from branch.",
                500,
                "ORGANIZATION_EMPLOYEE_REMOVE_FAILED"
            );
        }
    },
};

export default OrganizationSettingsService;