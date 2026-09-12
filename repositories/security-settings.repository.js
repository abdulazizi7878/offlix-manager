import AuthRepository from "@/repositories/auth.repository";

const SecuritySettingsRepository = {
    async getPasswordAuthAccount(client, userId) {
        return await AuthRepository.findPasswordAuthAccount(
            client,
            userId
        );
    },

    async getSessions(client, userId) {
        const result = await client.query(
            `
            SELECT
                id,
                user_id,
                expires_at,
                revoked_at,
                created_at,
                updated_at
            FROM sessions
            WHERE user_id = $1
            ORDER BY created_at DESC
            `,
            [userId]
        );

        return result.rows;
    },

    async getActiveSessions(client, userId) {
        const result = await client.query(
            `
            SELECT
                id,
                user_id,
                expires_at,
                revoked_at,
                created_at,
                updated_at
            FROM sessions
            WHERE user_id = $1
              AND revoked_at IS NULL
              AND expires_at > NOW()
            ORDER BY created_at DESC
            `,
            [userId]
        );

        return result.rows;
    },

    async revokeSession(client, sessionId, userId) {
        const result = await client.query(
            `
            UPDATE sessions
            SET
                revoked_at = NOW(),
                updated_at = NOW()
            WHERE id = $1
              AND user_id = $2
              AND revoked_at IS NULL
            RETURNING id, revoked_at
            `,
            [sessionId, userId]
        );

        return result.rows[0] ?? null;
    },

    async revokeOtherSessions(
        client,
        userId,
        currentSessionId
    ) {
        const result = await client.query(
            `
            UPDATE sessions
            SET
                revoked_at = NOW(),
                updated_at = NOW()
            WHERE user_id = $1
              AND id <> $2
              AND revoked_at IS NULL
              AND expires_at > NOW()
            RETURNING id
            `,
            [userId, currentSessionId]
        );

        return result.rows;
    },

    async updatePassword(
        client,
        userId,
        passwordHash
    ) {
        const result = await client.query(
            `
            UPDATE auth_accounts
            SET
                password_hash = $1,
                failed_login_attempts = 0,
                locked_until = NULL,
                updated_at = NOW()
            WHERE user_id = $2
              AND provider = 'password'
            RETURNING id, user_id, provider, updated_at
            `,
            [passwordHash, userId]
        );

        return result.rows[0] ?? null;
    },
};

export default SecuritySettingsRepository;