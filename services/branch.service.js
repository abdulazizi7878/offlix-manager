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

        console.error("BranchService.createBranch:", error);

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
};

export default BranchService;