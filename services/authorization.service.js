
// file: services/authorization.service.js

import AppError from "@/lib/errors/AppError";

const AuthorizationService = {
  async assertAccountMember(client, userId, accountId) {
    const result = await client.query(
      `
      SELECT id
      FROM users
      WHERE id = $1
        AND account_id = $2
      LIMIT 1
      `,
      [userId, accountId]
    );

    if (result.rows.length === 0) {
      throw new AppError(
        "You do not have access to this account.",
        403,
        "ACCOUNT_ACCESS_DENIED"
      );
    }

    return true;
  },

  // The first user created for an account is the account creator.
  async isAccountCreator(client, userId, accountId) {
    const result = await client.query(
      `
      SELECT 1
      FROM users u
      WHERE u.id = $1
        AND u.account_id = $2
        AND NOT EXISTS (
          SELECT 1
          FROM users earlier
          WHERE earlier.account_id = $2
            AND (
              earlier.created_at < u.created_at
              OR (
                earlier.created_at = u.created_at
                AND earlier.id < u.id
              )
            )
        )
      LIMIT 1
      `,
      [userId, accountId]
    );

    return result.rows.length > 0;
  },

  async hasPermission(client, userId, accountId, permissionKey) {
    // Account creator has all permissions across the account.
    const isCreator = await this.isAccountCreator(
      client,
      userId,
      accountId
    );

    if (isCreator) {
      return true;
    }

    const result = await client.query(
      `
      SELECT 1
      FROM branch_memberships bm
      INNER JOIN branches b
        ON b.id = bm.branch_id
      INNER JOIN branch_membership_permissions bmp
        ON bmp.branch_membership_id = bm.id
      INNER JOIN permissions p
        ON p.id = bmp.permission_id
      WHERE bm.user_id = $1
        AND b.account_id = $2
        AND bm.status = 'active'
        AND p.key = $3
      LIMIT 1
      `,
      [userId, accountId, permissionKey]
    );

    return result.rows.length > 0;
  },

  async assertPermission(
    client,
    userId,
    accountId,
    permissionKey
  ) {
    const hasPermission = await this.hasPermission(
      client,
      userId,
      accountId,
      permissionKey
    );

    if (!hasPermission) {
      throw new AppError(
        "You do not have permission to perform this action.",
        403,
        "PERMISSION_DENIED"
      );
    }

    return true;
  },

  async hasBranchPermission(
    client,
    userId,
    accountId,
    branchId,
    permissionKey
  ) {
    // Account creator has all permissions on every branch.
    const isCreator = await this.isAccountCreator(
      client,
      userId,
      accountId
    );

    if (isCreator) {
      return true;
    }

    const result = await client.query(
      `
      SELECT 1
      FROM branch_memberships bm
      INNER JOIN branches b
        ON b.id = bm.branch_id
      INNER JOIN branch_membership_permissions bmp
        ON bmp.branch_membership_id = bm.id
      INNER JOIN permissions p
        ON p.id = bmp.permission_id
      WHERE bm.user_id = $1
        AND bm.branch_id = $2
        AND b.account_id = $3
        AND bm.status = 'active'
        AND p.key = $4
      LIMIT 1
      `,
      [userId, branchId, accountId, permissionKey]
    );

    return result.rows.length > 0;
  },

  async assertBranchPermission(
    client,
    userId,
    accountId,
    branchId,
    permissionKey
  ) {
    const hasPermission = await this.hasBranchPermission(
      client,
      userId,
      accountId,
      branchId,
      permissionKey
    );

    if (!hasPermission) {
      throw new AppError(
        "You do not have permission to perform this action.",
        403,
        "PERMISSION_DENIED"
      );
    }

    return true;
  },

  async canCreateFirstBranch(client, userId, accountId) {
    const result = await client.query(
      `
      SELECT 1
      FROM users u
      WHERE u.id = $1
        AND u.account_id = $2
        AND NOT EXISTS (
          SELECT 1
          FROM branches b
          WHERE b.account_id = $2
        )
      LIMIT 1
      `,
      [userId, accountId]
    );

    return result.rows.length > 0;
  },
};

export default AuthorizationService;
