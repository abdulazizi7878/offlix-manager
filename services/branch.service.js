// file: services/branch.service.js

import pool from "@/lib/database";
import AppError from "@/lib/errors/AppError";
import BranchRepository from "@/repositories/branch.repository";
import AuthorizationService from "@/services/authorization.service";

const BranchService = {
  async createBranch(userId, accountId, data) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await AuthorizationService.assertAccountMember(
        client,
        userId,
        accountId
      );

      const canCreateFirstBranch =
        await AuthorizationService.canCreateFirstBranch(
          client,
          userId,
          accountId
        );

      if (!canCreateFirstBranch) {
        await AuthorizationService.assertPermission(
          client,
          userId,
          accountId,
          "branches.create"
        );
      }

      const branch = await BranchRepository.createBranch(
        client,
        {
          accountId,
          name: data.name,
          description: data.description,
        }
      );

      /*
       * First branch:
       * The account creator automatically receives
       * all permissions for the branch.
       */

      if (canCreateFirstBranch) {
        const membership =
          await BranchRepository.createMembership(
            client,
            userId,
            branch.id
          );

        await BranchRepository.grantAllPermissions(
          client,
          membership.id
        );
      }

      /*
       * Add selected employees to the new branch.
       */
      
      for (const employee of data.employees ?? []) {
        const existingEmployee =
          await BranchRepository.getEmployeeForAccount(
            client,
            accountId,
            employee.userId
          );

        if (!existingEmployee) {
          throw new AppError(
            "One or more selected employees could not be found.",
            404,
            "EMPLOYEE_NOT_FOUND"
          );
        }

        const permissionKeys = [
          ...new Set(employee.permissions ?? []),
        ];

        const permissions =
          await BranchRepository.getPermissionsByKeys(
            client,
            permissionKeys
          );

        if (permissions.length !== permissionKeys.length) {
          throw new AppError(
            "One or more selected permissions are invalid.",
            400,
            "INVALID_PERMISSIONS"
          );
        }

        const membership =
          await BranchRepository.createMembership(
            client,
            employee.userId,
            branch.id
          );

        await BranchRepository.grantPermissions(
          client,
          membership.id,
          permissionKeys
        );
      }

      await client.query("COMMIT");

      return branch;
    } catch (error) {
      await client.query("ROLLBACK");

      if (error instanceof AppError) {
        throw error;
      }

      if (error.code === "23505") {
        throw new AppError(
          "A branch with this information already exists.",
          409,
          "BRANCH_ALREADY_EXISTS"
        );
      }

      console.error(
        "BranchService.createBranch:",
        error
      );

      throw new AppError(
        "Failed to create branch.",
        500,
        "BRANCH_CREATE_FAILED"
      );
    } finally {
      client.release();
    }
  },

    async getBranches(userId, accountId) {
     const client = await pool.connect();

    try {
        await AuthorizationService.assertAccountMember(
        client,
        userId,
        accountId
        );

        const canCreateFirstBranch =
        await AuthorizationService.canCreateFirstBranch(
            client,
            userId,
            accountId
        );

        if (!canCreateFirstBranch) {
        await AuthorizationService.assertPermission(
            client,
            userId,
            accountId,
            "branches.view"
        );
        }

        return await BranchRepository.getBranchesByAccountId(
        client,
        accountId
        );
    } catch (error) {
        if (error instanceof AppError) {
        throw error;
        }

        console.error("BranchService.getBranches:", error);

        throw new AppError(
        "Failed to get branches.",
        500,
        "BRANCHES_FETCH_FAILED"
        );
    } finally {
        client.release();
    }
    },

  async getBranch(userId, accountId, branchId) {
    const client = await pool.connect();

    try {
      const branch = await BranchRepository.getBranchById(
        client,
        branchId
      );

      if (!branch || branch.account_id !== accountId) {
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
        "branches.view"
      );

      return branch;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      console.error("BranchService.getBranch:", error);

      throw new AppError(
        "Failed to get branch.",
        500,
        "BRANCH_FETCH_FAILED"
      );
    } finally {
      client.release();
    }
  },

  async updateBranch(userId, accountId, branchId, data) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const branch = await BranchRepository.getBranchById(
        client,
        branchId
      );

      if (!branch || branch.account_id !== accountId) {
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
        "branches.update"
      );

      const updatedBranch =
        await BranchRepository.updateBranch(
          client,
          branchId,
          data
        );

      await client.query("COMMIT");

      return updatedBranch;
    } catch (error) {
      await client.query("ROLLBACK");

      if (error instanceof AppError) {
        throw error;
      }

      if (error.code === "23505") {
        throw new AppError(
          "A branch with this information already exists.",
          409,
          "BRANCH_ALREADY_EXISTS"
        );
      }

      console.error("BranchService.updateBranch:", error);

      throw new AppError(
        "Failed to update branch.",
        500,
        "BRANCH_UPDATE_FAILED"
      );
    } finally {
      client.release();
    }
  },

  async updateBranchStatus(
    userId,
    accountId,
    branchId,
    status
  ) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const branch = await BranchRepository.getBranchById(
        client,
        branchId
      );

      if (!branch || branch.account_id !== accountId) {
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
        "branches.update"
      );

      const updatedBranch =
        await BranchRepository.updateBranchStatus(
          client,
          branchId,
          status
        );

      await client.query("COMMIT");

      return updatedBranch;
    } catch (error) {
      await client.query("ROLLBACK");

      if (error instanceof AppError) {
        throw error;
      }

      console.error(
        "BranchService.updateBranchStatus:",
        error
      );

      throw new AppError(
        "Failed to update branch status.",
        500,
        "BRANCH_STATUS_UPDATE_FAILED"
      );
    } finally {
      client.release();
    }
  },
  async getBranchEmployees(
    userId,
    accountId,
    branchId
  ) {
    const client = await pool.connect();

    try {
      const branch =
        await BranchRepository.getBranchById(
          client,
          branchId
        );

      if (
        !branch ||
        branch.account_id !== accountId
      ) {
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
        "users.view"
      );

      return await BranchRepository.getBranchEmployees(
        client,
        accountId,
        branchId
      );
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      console.error(
        "BranchService.getBranchEmployees:",
        error
      );

      throw new AppError(
        "Failed to get branch employees.",
        500,
        "BRANCH_EMPLOYEES_FETCH_FAILED"
      );
    } finally {
      client.release();
    }
  },

  async addEmployeeToBranch(
    userId,
    accountId,
    branchId,
    employeeId,
    permissions
  ) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const branch =
        await BranchRepository.getBranchById(
          client,
          branchId
        );

      if (
        !branch ||
        branch.account_id !== accountId
      ) {
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
        "users.add"
      );

      const employee =
        await BranchRepository.getEmployeeForAccount(
          client,
          accountId,
          employeeId
        );

      if (!employee) {
        throw new AppError(
          "Employee not found.",
          404,
          "EMPLOYEE_NOT_FOUND"
        );
      }

      const existingMembership =
        await BranchRepository.getMembership(
          client,
          employeeId,
          branchId
        );

      if (
        existingMembership &&
        existingMembership.status === "active"
      ) {
        throw new AppError(
          "Employee is already assigned to this branch.",
          409,
          "BRANCH_EMPLOYEE_ALREADY_EXISTS"
        );
      }

      const permissionKeys = [
        ...new Set(permissions ?? []),
      ];

      const permissionRows =
        await BranchRepository.getPermissionsByKeys(
          client,
          permissionKeys
        );

      if (
        permissionRows.length !==
        permissionKeys.length
      ) {
        throw new AppError(
          "One or more selected permissions are invalid.",
          400,
          "INVALID_PERMISSIONS"
        );
      }

      let membership;

      if (
        existingMembership &&
        existingMembership.status === "inactive"
      ) {
        membership =
          await client.query(
            `
          UPDATE branch_memberships
          SET
            status = 'active',
            updated_at = NOW()
          WHERE id = $1
          RETURNING
            id,
            user_id,
            branch_id,
            status,
            created_at,
            updated_at
          `,
            [existingMembership.id]
          );

        membership = membership.rows[0];
      } else {
        membership =
          await BranchRepository.createMembership(
            client,
            employeeId,
            branchId
          );
      }

      await BranchRepository.grantPermissions(
        client,
        membership.id,
        permissionKeys
      );

      await client.query("COMMIT");

      return {
        membership,
        employee,
        permissions: permissionKeys,
      };
    } catch (error) {
      await client.query("ROLLBACK");

      if (error instanceof AppError) {
        throw error;
      }

      if (error.code === "23505") {
        throw new AppError(
          "Employee is already assigned to this branch.",
          409,
          "BRANCH_EMPLOYEE_ALREADY_EXISTS"
        );
      }

      console.error(
        "BranchService.addEmployeeToBranch:",
        error
      );

      throw new AppError(
        "Failed to add employee to branch.",
        500,
        "BRANCH_EMPLOYEE_ADD_FAILED"
      );
    } finally {
      client.release();
    }
  },

  async updateBranchEmployeePermissions(
    userId,
    accountId,
    branchId,
    employeeId,
    permissions
  ) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const branch =
        await BranchRepository.getBranchById(
          client,
          branchId
        );

      if (
        !branch ||
        branch.account_id !== accountId
      ) {
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
        "users.update"
      );

      const employee =
        await BranchRepository.getEmployeeForAccount(
          client,
          accountId,
          employeeId
        );

      if (!employee) {
        throw new AppError(
          "Employee not found.",
          404,
          "EMPLOYEE_NOT_FOUND"
        );
      }

      const membership =
        await BranchRepository.getMembership(
          client,
          employeeId,
          branchId
        );

      if (
        !membership ||
        membership.status !== "active"
      ) {
        throw new AppError(
          "Employee is not assigned to this branch.",
          404,
          "BRANCH_EMPLOYEE_NOT_FOUND"
        );
      }

      const permissionKeys = [
        ...new Set(permissions ?? []),
      ];

      const permissionRows =
        await BranchRepository.getPermissionsByKeys(
          client,
          permissionKeys
        );

      if (
        permissionRows.length !==
        permissionKeys.length
      ) {
        throw new AppError(
          "One or more selected permissions are invalid.",
          400,
          "INVALID_PERMISSIONS"
        );
      }

      await BranchRepository.replacePermissions(
        client,
        membership.id,
        permissionKeys
      );

      await client.query("COMMIT");

      return {
        membership,
        employee,
        permissions: permissionKeys,
      };
    } catch (error) {
      await client.query("ROLLBACK");

      if (error instanceof AppError) {
        throw error;
      }

      console.error(
        "BranchService.updateBranchEmployeePermissions:",
        error
      );

      throw new AppError(
        "Failed to update employee permissions.",
        500,
        "BRANCH_EMPLOYEE_PERMISSIONS_UPDATE_FAILED"
      );
    } finally {
      client.release();
    }
  },

  async removeEmployeeFromBranch(
    userId,
    accountId,
    branchId,
    employeeId
  ) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const branch =
        await BranchRepository.getBranchById(
          client,
          branchId
        );

      if (
        !branch ||
        branch.account_id !== accountId
      ) {
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
        "users.remove"
      );

      const employee =
        await BranchRepository.getEmployeeForAccount(
          client,
          accountId,
          employeeId
        );

      if (!employee) {
        throw new AppError(
          "Employee not found.",
          404,
          "EMPLOYEE_NOT_FOUND"
        );
      }

      const membership =
        await BranchRepository.getMembership(
          client,
          employeeId,
          branchId
        );

      if (
        !membership ||
        membership.status !== "active"
      ) {
        throw new AppError(
          "Employee is not assigned to this branch.",
          404,
          "BRANCH_EMPLOYEE_NOT_FOUND"
        );
      }

      const removedMembership =
        await BranchRepository.deactivateMembership(
          client,
          membership.id
        );

      await client.query("COMMIT");

      return removedMembership;
    } catch (error) {
      await client.query("ROLLBACK");

      if (error instanceof AppError) {
        throw error;
      }

      console.error(
        "BranchService.removeEmployeeFromBranch:",
        error
      );

      throw new AppError(
        "Failed to remove employee from branch.",
        500,
        "BRANCH_EMPLOYEE_REMOVE_FAILED"
      );
    } finally {
      client.release();
    }
  },
};

export default BranchService;