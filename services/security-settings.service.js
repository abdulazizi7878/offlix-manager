import argon2 from "argon2";

import pool from "@/lib/database";

import AppError from "@/lib/errors/AppError";
import AuthorizationService from "@/services/authorization.service";
import SecuritySettingsRepository from "@/repositories/security-settings.repository";

const SecuritySettingsService = {
    async getSecuritySettings(userId, accountId) {
        const client = await pool.connect();

        try {
            await AuthorizationService.assertAccountMember(
                client,
                userId,
                accountId
            );

            const [authAccount, sessions] = await Promise.all([
                SecuritySettingsRepository.getPasswordAuthAccount(
                    client,
                    userId
                ),
                SecuritySettingsRepository.getActiveSessions(
                    client,
                    userId
                ),
            ]);

            return {
                password: {
                    enabled: Boolean(authAccount?.password_hash),
                },
                sessions: sessions.map((session) => ({
                    id: session.id,
                    expiresAt: session.expires_at,
                    createdAt: session.created_at,
                })),
            };
        } finally {
            client.release();
        }
    },

    async changePassword(
        userId,
        accountId,
        currentSessionId,
        currentPassword,
        newPassword
    ) {
        const client = await pool.connect();

        try {
            await AuthorizationService.assertAccountMember(
                client,
                userId,
                accountId
            );

            const authAccount =
                await SecuritySettingsRepository.getPasswordAuthAccount(
                    client,
                    userId
                );

            if (!authAccount?.password_hash) {
                throw new AppError(
                    "Password authentication is not available for this account.",
                    400,
                    "PASSWORD_AUTH_NOT_AVAILABLE"
                );
            }

            let currentPasswordValid = false;

            try {
                currentPasswordValid = await argon2.verify(
                    authAccount.password_hash,
                    currentPassword
                );
            } catch {
                currentPasswordValid = false;
            }

            if (!currentPasswordValid) {
                throw new AppError(
                    "Current password is incorrect.",
                    401,
                    "INVALID_CURRENT_PASSWORD"
                );
            }

            const samePassword = await argon2.verify(
                authAccount.password_hash,
                newPassword
            );

            if (samePassword) {
                throw new AppError(
                    "Your new password must be different from your current password.",
                    400,
                    "PASSWORD_UNCHANGED"
                );
            }

            const newPasswordHash = await argon2.hash(
                newPassword,
                {
                    type: argon2.argon2id,
                }
            );

            await client.query("BEGIN");

            await SecuritySettingsRepository.updatePassword(
                client,
                userId,
                newPasswordHash
            );

            await SecuritySettingsRepository.revokeOtherSessions(
                client,
                userId,
                currentSessionId
            );

            await client.query("COMMIT");

            return {
                success: true,
                message: "Password changed successfully.",
            };
        } catch (error) {
            try {
                await client.query("ROLLBACK");
            } catch { }

            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "SecuritySettingsService.changePassword:",
                error
            );

            throw new AppError(
                "Unable to change your password right now.",
                500,
                "PASSWORD_CHANGE_FAILED"
            );
        } finally {
            client.release();
        }
    },

    async revokeSession(
        userId,
        accountId,
        sessionId,
        currentSessionId
    ) {
        const client = await pool.connect();

        try {
            await AuthorizationService.assertAccountMember(
                client,
                userId,
                accountId
            );

            if (sessionId === currentSessionId) {
                throw new AppError(
                    "You cannot revoke your current session here.",
                    400,
                    "CURRENT_SESSION_CANNOT_BE_REVOKED"
                );
            }

            const revoked =
                await SecuritySettingsRepository.revokeSession(
                    client,
                    sessionId,
                    userId
                );

            if (!revoked) {
                throw new AppError(
                    "Session not found or already revoked.",
                    404,
                    "SESSION_NOT_FOUND"
                );
            }

            return {
                success: true,
                message: "Session revoked successfully.",
            };
        } finally {
            client.release();
        }
    },

    async revokeOtherSessions(
        userId,
        accountId,
        currentSessionId
    ) {
        const client = await pool.connect();

        try {
            await AuthorizationService.assertAccountMember(
                client,
                userId,
                accountId
            );

            await SecuritySettingsRepository.revokeOtherSessions(
                client,
                userId,
                currentSessionId
            );

            return {
                success: true,
                message: "All other sessions have been revoked.",
            };
        } finally {
            client.release();
        }
    },
};

export default SecuritySettingsService;