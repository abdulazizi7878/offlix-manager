const AuthRepository = {
  async findUserByEmail(client, email) {
    const result = await client.query(
      `
      SELECT *
      FROM users
      WHERE email = $1
      LIMIT 1
      `,
      [email]
    );

    return result.rows[0] ?? null;
  },

  async findUserByPhone(client, phone) {
    const result = await client.query(
      `
      SELECT *
      FROM users
      WHERE phone = $1
      LIMIT 1
      `,
      [phone]
    );

    return result.rows[0] ?? null;
  },

  async findUserByUsername(client, username) {
    const result = await client.query(
      `
      SELECT *
      FROM users
      WHERE username = $1
      LIMIT 1
      `,
      [username]
    );

    return result.rows[0] ?? null;
  },

  async findUserByLogin(client, login) {
    const result = await client.query(
      `
      SELECT *
      FROM users
      WHERE email = $1
         OR username = $1
         OR phone = $1
      LIMIT 1
      `,
      [login]
    );

    return result.rows[0] ?? null;
  },

  async createAccount(client, name) {
    const result = await client.query(
      `
      INSERT INTO accounts (
        name
      )
      VALUES ($1)
      RETURNING *
      `,
      [name]
    );

    return result.rows[0];
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
      RETURNING *
      `,
      [
        data.accountId,
        data.name,
        data.email,
        data.phone || null,
        data.username,
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
      RETURNING *
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

  async createOtp(client, data) {
    const result = await client.query(
      `
      INSERT INTO otp_codes (
        user_id,
        code_hash,
        purpose,
        expires_at
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        data.userId,
        data.codeHash,
        data.purpose,
        data.expiresAt,
      ]
    );

    return result.rows[0];
  },

  async findLatestActiveOtp(client, userId, purpose) {
    const result = await client.query(
      `
      SELECT *
      FROM otp_codes
      WHERE user_id = $1
        AND purpose = $2
        AND verified_at IS NULL
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [userId, purpose]
    );

    return result.rows[0] ?? null;
  },

  async findLatestOtp(client, userId, purpose) {
    const result = await client.query(
      `
      SELECT *
      FROM otp_codes
      WHERE user_id = $1
        AND purpose = $2
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [userId, purpose]
    );

    return result.rows[0] ?? null;
  },

  async markOtpVerified(client, otpId) {
    const result = await client.query(
      `
      UPDATE otp_codes
      SET verified_at = NOW()
      WHERE id = $1
        AND verified_at IS NULL
      RETURNING *
      `,
      [otpId]
    );

    return result.rows[0] ?? null;
  },

  async invalidateActiveOtps(client, userId, purpose) {
    await client.query(
      `
      UPDATE otp_codes
      SET expires_at = NOW()
      WHERE user_id = $1
        AND purpose = $2
        AND verified_at IS NULL
        AND expires_at > NOW()
      `,
      [userId, purpose]
    );
  },

  async markEmailVerified(client, userId) {
    const result = await client.query(
      `
      UPDATE users
      SET email_verified_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [userId]
    );

    return result.rows[0] ?? null;
  },

  async createSession(client, data) {
    const result = await client.query(
      `
      INSERT INTO sessions (
        user_id,
        token_hash,
        expires_at
      )
      VALUES ($1, $2, $3)
      RETURNING id, user_id, expires_at, created_at
      `,
      [
        data.userId,
        data.tokenHash,
        data.expiresAt,
      ]
    );

    return result.rows[0];
  },

  async findSessionByTokenHash(client, tokenHash) {
    const result = await client.query(
      `
      SELECT
        sessions.*,
        users.account_id,
        users.name,
        users.email,
        users.phone,
        users.username,
        users.email_verified_at
      FROM sessions
      INNER JOIN users
        ON users.id = sessions.user_id
      WHERE sessions.token_hash = $1
        AND sessions.revoked_at IS NULL
        AND sessions.expires_at > NOW()
      LIMIT 1
      `,
      [tokenHash]
    );

    return result.rows[0] ?? null;
  },

  async revokeSession(client, sessionId) {
    const result = await client.query(
      `
      UPDATE sessions
      SET revoked_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
        AND revoked_at IS NULL
      RETURNING *
      `,
      [sessionId]
    );

    return result.rows[0] ?? null;
  },

  async findPasswordAuthAccount(client, userId) {
    const result = await client.query(
      `
      SELECT *
      FROM auth_accounts
      WHERE user_id = $1
        AND provider = 'password'
      LIMIT 1
      `,
      [userId]
    );

    return result.rows[0] ?? null;
  },

  async recordFailedLogin(client, authAccountId, maxAttempts, lockMinutes) {
    const result = await client.query(
      `
      UPDATE auth_accounts
      SET
        failed_login_attempts = failed_login_attempts + 1,
        locked_until = CASE
          WHEN failed_login_attempts + 1 >= $2
          THEN NOW() + ($3 * INTERVAL '1 minute')
          ELSE locked_until
        END,
        updated_at = NOW()
      WHERE id = $1
      RETURNING failed_login_attempts, locked_until
      `,
      [
        authAccountId,
        maxAttempts,
        lockMinutes,
      ]
    );

    return result.rows[0] ?? null;
  },

  async resetLoginAttempts(client, authAccountId) {
    const result = await client.query(
      `
      UPDATE auth_accounts
      SET
        failed_login_attempts = 0,
        locked_until = NULL,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [authAccountId]
    );

    return result.rows[0] ?? null;
  },
  async revokeSessionByTokenHash(client, tokenHash) {
    const result = await client.query(
        `
        UPDATE sessions
        SET revoked_at = NOW(),
            updated_at = NOW()
        WHERE token_hash = $1
        AND revoked_at IS NULL
        RETURNING *
        `,
        [tokenHash]
    );

    return result.rows[0] ?? null;
    },
    async findRecentOtp(client, userId, purpose, cooldownSeconds) {
        const result = await client.query(
            `
            SELECT
            id,
            created_at,
            expires_at
            FROM otp_codes
            WHERE user_id = $1
            AND purpose = $2
            AND verified_at IS NULL
            AND created_at > NOW() - ($3 * INTERVAL '1 second')
            ORDER BY created_at DESC
            LIMIT 1
            `,
            [userId, purpose, cooldownSeconds]
        );

        return result.rows[0] ?? null;
        },
};

export default AuthRepository;