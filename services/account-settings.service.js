import pool from "@/lib/db";
import AccountSettingsRepository from "@/repositories/account-settings.repository";
import AuthorizationService from "@/services/authorization.service";
import AppError from "@/lib/errors/AppError";

const AccountSettingsService = {
    async getAccountSettings(userId, accountId) {
        const client = await pool.connect();

        try {
            await AuthorizationService.assertAccountMember(
                client,
                userId,
                accountId
            );

            const settings =
                await AccountSettingsRepository.getAccountSettings(
                    client,
                    accountId,
                    userId
                );

            if (!settings) {
                throw new AppError(
                    "Account settings not found.",
                    404,
                    "ACCOUNT_SETTINGS_NOT_FOUND"
                );
            }

            return {
                account: {
                    id: settings.id,
                    name: settings.name,
                    status: settings.status,
                    createdAt: settings.created_at,
                    updatedAt: settings.updated_at,
                },

                profile: {
                    userId: settings.user_id,
                    name: settings.user_name,
                    email: settings.email,
                    phone: settings.phone,
                    username: settings.username,
                    emailVerifiedAt: settings.email_verified_at,
                    bio: settings.bio,
                    profileImageKey: settings.profile_image_key,
                },

                subscription: settings.subscription_id
                    ? {
                        id: settings.subscription_id,
                        plan: settings.plan,
                        status: settings.subscription_status,
                        startedAt: settings.started_at,
                        expiresAt: settings.expires_at,
                    }
                    : null,

                preferences: settings.settings_id
                    ? {
                        currency: settings.currency,
                        timezone: settings.timezone,
                        dateFormat: settings.date_format,
                    }
                    : null,
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            console.error("AccountSettingsService.getAccountSettings:", error);

            throw new AppError(
                "Failed to get account settings.",
                500,
                "ACCOUNT_SETTINGS_FETCH_FAILED"
            );
        } finally {
            client.release();
        }
    },

    async updateAccountSettings(userId, accountId, data) {
        const client = await pool.connect();

        try {
            await AuthorizationService.assertAccountMember(
                client,
                userId,
                accountId
            );

            await client.query("BEGIN");

            if (data.account) {
                await AccountSettingsRepository.updateAccount(
                    client,
                    accountId,
                    data.account
                );
            }

            if (data.profile) {
                await AccountSettingsRepository.updateUser(
                    client,
                    userId,
                    data.profile
                );

                if (
                    data.profile.bio !== undefined ||
                    data.profile.profileImageKey !== undefined
                ) {
                    await AccountSettingsRepository.updateUserProfile(
                        client,
                        userId,
                        {
                            bio: data.profile.bio,
                            profileImageKey: data.profile.profileImageKey,
                        }
                    );
                }
            }

            if (data.preferences) {
                await AccountSettingsRepository.updatePreferences(
                    client,
                    accountId,
                    data.preferences
                );
            }

            await client.query("COMMIT");

            return await this.getAccountSettings(userId, accountId);
        } catch (error) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error(
                    "AccountSettingsService.updateAccountSettings rollback:",
                    rollbackError
                );
            }

            if (error instanceof AppError) {
                throw error;
            }

            console.error("AccountSettingsService.updateAccountSettings:", error);

            throw new AppError(
                "Failed to update account settings.",
                500,
                "ACCOUNT_SETTINGS_UPDATE_FAILED"
            );
        } finally {
            client.release();
        }
    },
};

export default AccountSettingsService;