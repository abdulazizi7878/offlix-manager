import AuthRepository from "@/repositories/auth.repository";

const AccountSettingsRepository = {
    async getAccountSettings(client, accountId, userId) {
        const result = await client.query(
            `
      SELECT
        a.id,
        a.name,
        a.status,
        a.created_at,
        a.updated_at,

        u.id AS user_id,
        u.name AS user_name,
        u.email,
        u.phone,
        u.username,
        u.email_verified_at,

        up.id AS profile_id,
        up.bio,
        up.profile_image_key,

        s.id AS subscription_id,
        s.plan,
        s.status AS subscription_status,
        s.started_at,
        s.expires_at,

        aset.id AS settings_id,
        aset.currency,
        aset.timezone,
        aset.date_format

      FROM accounts a

      INNER JOIN users u
        ON u.account_id = a.id
       AND u.id = $2

      LEFT JOIN user_profiles up
        ON up.user_id = u.id

      LEFT JOIN LATERAL (
        SELECT
          id,
          plan,
          status,
          started_at,
          expires_at
        FROM subscriptions
        WHERE account_id = a.id
        ORDER BY created_at DESC
        LIMIT 1
      ) s
        ON TRUE

      LEFT JOIN account_settings aset
        ON aset.account_id = a.id

      WHERE a.id = $1

      LIMIT 1
      `,
            [accountId, userId]
        );

        return result.rows[0] ?? null;
    },

    async updateAccount(client, accountId, data) {
        const fields = [];
        const values = [];
        let parameterIndex = 1;

        if (data.name !== undefined) {
            fields.push(`name = $${parameterIndex}`);
            values.push(data.name);
            parameterIndex += 1;
        }

        if (data.status !== undefined) {
            fields.push(`status = $${parameterIndex}`);
            values.push(data.status);
            parameterIndex += 1;
        }

        if (fields.length === 0) {
            return null;
        }

        fields.push(`updated_at = NOW()`);

        values.push(accountId);

        const result = await client.query(
            `
      UPDATE accounts
      SET ${fields.join(", ")}
      WHERE id = $${parameterIndex}
      RETURNING *
      `,
            values
        );

        return result.rows[0] ?? null;
    },

    async updateUser(client, userId, data) {
        const fields = [];
        const values = [];
        let parameterIndex = 1;

        if (data.name !== undefined) {
            fields.push(`name = $${parameterIndex}`);
            values.push(data.name);
            parameterIndex += 1;
        }

        if (data.email !== undefined) {
            fields.push(`email = $${parameterIndex}`);
            values.push(data.email);
            parameterIndex += 1;
        }

        if (data.phone !== undefined) {
            fields.push(`phone = $${parameterIndex}`);
            values.push(data.phone);
            parameterIndex += 1;
        }

        if (data.username !== undefined) {
            fields.push(`username = $${parameterIndex}`);
            values.push(data.username);
            parameterIndex += 1;
        }

        if (fields.length === 0) {
            return null;
        }

        fields.push(`updated_at = NOW()`);

        values.push(userId);

        const result = await client.query(
            `
      UPDATE users
      SET ${fields.join(", ")}
      WHERE id = $${parameterIndex}
      RETURNING *
      `,
            values
        );

        return result.rows[0] ?? null;
    },

    async updateUserProfile(client, userId, data) {
        const fields = [];
        const values = [];
        let parameterIndex = 1;

        if (data.bio !== undefined) {
            fields.push(`bio = $${parameterIndex}`);
            values.push(data.bio);
            parameterIndex += 1;
        }

        if (data.profileImageKey !== undefined) {
            fields.push(`profile_image_key = $${parameterIndex}`);
            values.push(data.profileImageKey);
            parameterIndex += 1;
        }

        if (fields.length === 0) {
            return null;
        }

        fields.push(`updated_at = NOW()`);

        values.push(userId);

        const result = await client.query(
            `
      UPDATE user_profiles
      SET ${fields.join(", ")}
      WHERE user_id = $${parameterIndex}
      RETURNING *
      `,
            values
        );

        return result.rows[0] ?? null;
    },

    async updatePreferences(client, accountId, data) {
        const fields = [];
        const values = [];
        let parameterIndex = 1;

        if (data.currency !== undefined) {
            fields.push(`currency = $${parameterIndex}`);
            values.push(data.currency);
            parameterIndex += 1;
        }

        if (data.timezone !== undefined) {
            fields.push(`timezone = $${parameterIndex}`);
            values.push(data.timezone);
            parameterIndex += 1;
        }

        if (data.dateFormat !== undefined) {
            fields.push(`date_format = $${parameterIndex}`);
            values.push(data.dateFormat);
            parameterIndex += 1;
        }

        if (fields.length === 0) {
            return null;
        }

        fields.push(`updated_at = NOW()`);

        values.push(accountId);

        const result = await client.query(
            `
      UPDATE account_settings
      SET ${fields.join(", ")}
      WHERE account_id = $${parameterIndex}
      RETURNING *
      `,
            values
        );

        return result.rows[0] ?? null;
    },

    async createDefaultSettings(client, accountId) {
        const result = await client.query(
            `
      INSERT INTO account_settings (
        account_id
      )
      VALUES ($1)
      ON CONFLICT (account_id)
      DO NOTHING
      RETURNING *
      `,
            [accountId]
        );

        return result.rows[0] ?? null;
    },
};

export default AccountSettingsRepository;