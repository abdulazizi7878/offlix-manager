const UserRepository = {
    async findUserByPhone(client, phone) {
        const result = await client.query(
            `
      SELECT id, account_id, name, email, phone, username,
             email_verified_at, created_at, updated_at
      FROM users
      WHERE phone = $1
      LIMIT 1
      `,
            [phone]
        );

        return result.rows[0] ?? null;
    },

    async findUserByEmail(client, email) {
        const result = await client.query(
            `
      SELECT id, account_id, name, email, phone, username,
             email_verified_at, created_at, updated_at
      FROM users
      WHERE email = $1
      LIMIT 1
      `,
            [email]
        );

        return result.rows[0] ?? null;
    },

    async createUser(client, data) {
        const result = await client.query(
            `
      INSERT INTO users (
        account_id,
        name,
        email,
        phone,
        username
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        account_id,
        name,
        email,
        phone,
        username,
        email_verified_at,
        created_at,
        updated_at
      `,
            [
                data.accountId,
                data.name,
                data.email ?? null,
                data.phone,
                data.username ?? null,
            ]
        );

        return result.rows[0];
    },

    async createAuthAccount(client, data) {
        const result = await client.query(
            `
      INSERT INTO auth_accounts (
        user_id,
        provider,
        provider_account_id,
        password_hash
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id, provider, created_at
      `,
            [
                data.userId,
                data.provider,
                data.providerAccountId ?? null,
                data.passwordHash ?? null,
            ]
        );

        return result.rows[0];
    },

    async createUserProfile(client, userId) {
        const result = await client.query(
            `
      INSERT INTO user_profiles (
        user_id
      )
      VALUES ($1)
      RETURNING *
      `,
            [userId]
        );

        return result.rows[0];
    },
    async getEmployeesByAccountId(client, accountId, limit, offset) {
        const result = await client.query(
            `
        SELECT
            u.id,
            u.account_id,
            u.name,
            u.email,
            u.phone,
            u.username,
            u.email_verified_at,
            u.created_at,
            u.updated_at
        FROM users u
        WHERE u.account_id = $1
          AND u.id <> (
              SELECT owner.id
              FROM users owner
              WHERE owner.account_id = $1
              ORDER BY owner.created_at ASC, owner.id ASC
              LIMIT 1
          )
        ORDER BY u.created_at DESC, u.id DESC
        LIMIT $2
        OFFSET $3
        `,
            [accountId, limit, offset]
        );

        const countResult = await client.query(
            `
        SELECT COUNT(*)::int AS total
        FROM users u
        WHERE u.account_id = $1
          AND u.id <> (
              SELECT owner.id
              FROM users owner
              WHERE owner.account_id = $1
              ORDER BY owner.created_at ASC, owner.id ASC
              LIMIT 1
          )
        `,
            [accountId]
        );

        return {
            users: result.rows,
            total: countResult.rows[0].total,
        };
    },
    async getEmployeeById(client, accountId, employeeId) {
        const result = await client.query(
            `
            SELECT
                u.id,
                u.account_id,
                u.name,
                u.email,
                u.phone,
                u.username,
                u.email_verified_at,
                u.created_at,
                u.updated_at
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
            [employeeId, accountId]
        );

        return result.rows[0] ?? null;
    },

    async updateEmployee(client, accountId, employeeId, data) {
        const result = await client.query(
            `
            UPDATE users
            SET
                name = $1,
                email = $2,
                phone = $3,
                updated_at = NOW()
            WHERE id = $4
              AND account_id = $5
              AND id <> (
                  SELECT owner.id
                  FROM users owner
                  WHERE owner.account_id = $5
                  ORDER BY owner.created_at ASC, owner.id ASC
                  LIMIT 1
              )
            RETURNING
                id,
                account_id,
                name,
                email,
                phone,
                username,
                email_verified_at,
                created_at,
                updated_at
            `,
            [
                data.name,
                data.email ?? null,
                data.phone,
                employeeId,
                accountId,
            ]
        );

        return result.rows[0] ?? null;
    },
};

export default UserRepository;