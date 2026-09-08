const BranchRepository = {
  async createBranch(client, data) {
    const result = await client.query(
      `
      INSERT INTO branches (
        account_id,
        name,
        description,
        status
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        account_id,
        name,
        description,
        status,
        created_at,
        updated_at
      `,
      [
        data.accountId,
        data.name,
        data.description ?? null,
        data.status ?? "active",
      ]
    );

    return result.rows[0];
  },

  async getBranchById(client, branchId) {
    const result = await client.query(
      `
      SELECT
        id,
        account_id,
        name,
        description,
        status,
        created_at,
        updated_at
      FROM branches
      WHERE id = $1
      LIMIT 1
      `,
      [branchId]
    );

    return result.rows[0] ?? null;
  },

  async getBranchesByAccountId(client, accountId) {
    const result = await client.query(
      `
      SELECT
        id,
        account_id,
        name,
        description,
        status,
        created_at,
        updated_at
      FROM branches
      WHERE account_id = $1
      ORDER BY created_at DESC
      `,
      [accountId]
    );

    return result.rows;
  },

  async updateBranch(client, branchId, data) {
    const result = await client.query(
      `
      UPDATE branches
      SET
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        account_id,
        name,
        description,
        status,
        created_at,
        updated_at
      `,
      [
        branchId,
        data.name ?? null,
        data.description ?? null,
      ]
    );

    return result.rows[0] ?? null;
  },

  async updateBranchStatus(client, branchId, status) {
    const result = await client.query(
      `
      UPDATE branches
      SET
        status = $2,
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        account_id,
        name,
        description,
        status,
        created_at,
        updated_at
      `,
      [branchId, status]
    );

    return result.rows[0] ?? null;
  },

  async createMembership(client, userId, branchId) {
    const result = await client.query(
      `
      INSERT INTO branch_memberships (
        user_id,
        branch_id,
        status
      )
      VALUES ($1, $2, 'active')
      RETURNING
        id,
        user_id,
        branch_id,
        status,
        created_at,
        updated_at
      `,
      [userId, branchId]
    );

    return result.rows[0];
  },

  async getMembership(
    client,
    userId,
    branchId
  ) {
    const result = await client.query(
      `
      SELECT
        bm.id,
        bm.user_id,
        bm.branch_id,
        bm.status,
        bm.created_at,
        bm.updated_at
      FROM branch_memberships bm
      INNER JOIN branches b
        ON b.id = bm.branch_id
      WHERE bm.user_id = $1
        AND bm.branch_id = $2
      LIMIT 1
      `,
      [userId, branchId]
    );

    return result.rows[0] ?? null;
  },

  async getEmployeeForAccount(
    client,
    accountId,
    userId
  ) {
    const result = await client.query(
      `
      SELECT
        u.id,
        u.account_id,
        u.name,
        u.email,
        u.phone,
        u.username,
        u.created_at
      FROM users u
      WHERE u.id = $1
        AND u.account_id = $2
        AND u.id <> (
          SELECT owner.id
          FROM users owner
          WHERE owner.account_id = $2
          ORDER BY owner.created_at ASC, owner.id ASC
          LIMIT 1
        )
      LIMIT 1
      `,
      [userId, accountId]
    );

    return result.rows[0] ?? null;
  },

  async getBranchEmployees(
    client,
    accountId,
    branchId
  ) {
    const result = await client.query(
      `
      SELECT
        bm.id AS membership_id,
        u.id AS user_id,
        u.name,
        u.email,
        u.phone,
        u.username,
        bm.status,
        bm.created_at,
        bm.updated_at,
        COALESCE(
          ARRAY_AGG(p.key ORDER BY p.key)
          FILTER (WHERE p.key IS NOT NULL),
          ARRAY[]::text[]
        ) AS permissions
      FROM branch_memberships bm
      INNER JOIN branches b
        ON b.id = bm.branch_id
      INNER JOIN users u
        ON u.id = bm.user_id
      LEFT JOIN branch_membership_permissions bmp
        ON bmp.branch_membership_id = bm.id
      LEFT JOIN permissions p
        ON p.id = bmp.permission_id
      WHERE bm.branch_id = $1
        AND b.account_id = $2
        AND u.id <> (
          SELECT owner.id
          FROM users owner
          WHERE owner.account_id = $2
          ORDER BY owner.created_at ASC, owner.id ASC
          LIMIT 1
        )
      GROUP BY
        bm.id,
        u.id,
        u.name,
        u.email,
        u.phone,
        u.username,
        bm.status,
        bm.created_at,
        bm.updated_at
      ORDER BY u.name ASC
      `,
      [branchId, accountId]
    );

    return result.rows;
  },

  async getPermissionsByKeys(
    client,
    permissionKeys
  ) {
    if (!permissionKeys.length) {
      return [];
    }

    const result = await client.query(
      `
      SELECT
        id,
        key,
        name,
        description
      FROM permissions
      WHERE key = ANY($1::text[])
      ORDER BY key ASC
      `,
      [permissionKeys]
    );

    return result.rows;
  },

  async grantPermissions(
    client,
    membershipId,
    permissionKeys
  ) {
    if (!permissionKeys.length) {
      return;
    }

    await client.query(
      `
      INSERT INTO branch_membership_permissions (
        branch_membership_id,
        permission_id
      )
      SELECT
        $1,
        p.id
      FROM permissions p
      WHERE p.key = ANY($2::text[])
      ON CONFLICT DO NOTHING
      `,
      [membershipId, permissionKeys]
    );
  },

  async replacePermissions(
    client,
    membershipId,
    permissionKeys
  ) {
    await client.query(
      `
      DELETE FROM branch_membership_permissions
      WHERE branch_membership_id = $1
      `,
      [membershipId]
    );

    await this.grantPermissions(
      client,
      membershipId,
      permissionKeys
    );
  },

  async deactivateMembership(
    client,
    membershipId
  ) {
    const result = await client.query(
      `
      UPDATE branch_memberships
      SET
        status = 'inactive',
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
      [membershipId]
    );

    return result.rows[0] ?? null;
  },

  async grantAllPermissions(
    client,
    membershipId
  ) {
    await client.query(
      `
      INSERT INTO branch_membership_permissions (
        branch_membership_id,
        permission_id
      )
      SELECT
        $1,
        id
      FROM permissions
      ON CONFLICT DO NOTHING
      `,
      [membershipId]
    );
  },
};

export default BranchRepository;