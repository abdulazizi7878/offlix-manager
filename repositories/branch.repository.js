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

  async grantAllPermissions(client, membershipId) {
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