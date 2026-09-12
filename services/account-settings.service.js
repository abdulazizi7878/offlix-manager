import pool from "@/lib/database";

import AccountSettingsRepository from "@/repositories/account-settings.repository";

import AuthorizationService from "@/services/authorization.service";

import AppError from "@/lib/errors/AppError";

import {
    generateOtp,
    hashOtp,
    generateToken,
    createEmailChangeToken,
    verifyEmailChangeToken,
    getEmailChangeTokenExpirationMinutes,
} from "@/lib/security/token";

import EmailService from "@/lib/email/email.service";

const EMAIL_CHANGE_PURPOSE = "email_change";

const OTP_COOLDOWN_SECONDS = 60;

const OTP_EXPIRES_MINUTES =
    Number(process.env.OTP_EXPIRES_MINUTES || 10);

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
                    emailVerifiedAt:
                        settings.email_verified_at,
                    bio: settings.bio,
                    profileImageKey:
                        settings.profile_image_key,
                },

                subscription: settings.subscription_id
                    ? {
                        id: settings.subscription_id,
                        plan: settings.plan,
                        status:
                            settings.subscription_status,
                        startedAt:
                            settings.started_at,
                        expiresAt:
                            settings.expires_at,
                    }
                    : null,

                preferences: settings.settings_id
                    ? {
                        currency: settings.currency,
                        timezone: settings.timezone,
                        dateFormat:
                            settings.date_format,
                    }
                    : null,
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "AccountSettingsService.getAccountSettings:",
                error
            );

            throw new AppError(
                "Failed to get account settings.",
                500,
                "ACCOUNT_SETTINGS_FETCH_FAILED"
            );
        } finally {
            client.release();
        }
    },

    async updateAccountSettings(
        userId,
        accountId,
        data
    ) {
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
                    data.profile.profileImageKey !==
                    undefined
                ) {
                    await AccountSettingsRepository.updateUserProfile(
                        client,
                        userId,
                        {
                            bio: data.profile.bio,
                            profileImageKey:
                                data.profile
                                    .profileImageKey,
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

            return await this.getAccountSettings(
                userId,
                accountId
            );
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

            console.error(
                "AccountSettingsService.updateAccountSettings:",
                error
            );

            throw new AppError(
                "Failed to update account settings.",
                500,
                "ACCOUNT_SETTINGS_UPDATE_FAILED"
            );
        } finally {
            client.release();
        }
    },

    async requestEmailChange(
        userId,
        accountId,
        newEmail
    ) {
        const client = await pool.connect();

        try {
            await AuthorizationService.assertAccountMember(
                client,
                userId,
                accountId
            );

            const email =
                newEmail.trim().toLowerCase();

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

            const currentEmail =
                settings.email?.trim().toLowerCase() ||
                null;

            if (currentEmail === email) {
                throw new AppError(
                    "This is already your current email address.",
                    400,
                    "EMAIL_ALREADY_CURRENT"
                );
            }

            /*
             * IMPORTANT:
             * Check whether another user already owns
             * this email before creating any OTP.
             */
            const existingUser =
                await AccountSettingsRepository.findUserByEmail(
                    client,
                    email,
                    userId
                );

            if (existingUser) {
                throw new AppError(
                    "This email address is already in use.",
                    409,
                    "EMAIL_ALREADY_EXISTS"
                );
            }

            const recentOtp =
                await AccountSettingsRepository.getRecentEmailChangeOtp(
                    client,
                    userId,
                    OTP_COOLDOWN_SECONDS
                );

            if (recentOtp) {
                throw new AppError(
                    "Please wait before requesting another verification code.",
                    429,
                    "OTP_RESEND_COOLDOWN"
                );
            }

            const challengeId =
                generateToken(16);

            const otp = generateOtp();

            /*
             * Bind the OTP to this exact email-change
             * challenge. An OTP from another challenge
             * cannot be paired with this token.
             */
            const codeHash = hashOtp(
                `${otp}:${challengeId}`
            );

            const expiresAt = new Date(
                Date.now() +
                OTP_EXPIRES_MINUTES *
                60 *
                1000
            );

            const verificationToken =
                createEmailChangeToken({
                    userId,
                    email,
                    challengeId,
                });

            await client.query("BEGIN");

            await AccountSettingsRepository.invalidateEmailChangeOtps(
                client,
                userId
            );

            await AccountSettingsRepository.createEmailChangeOtp(
                client,
                userId,
                expiresAt,
                codeHash
            );

            await client.query("COMMIT");

            try {
                await EmailService.sendVerificationOtp({
                    to: email,
                    name: settings.user_name,
                    otp,
                    expiresInMinutes:
                        OTP_EXPIRES_MINUTES,
                });
            } catch (emailError) {
                console.error(
                    "AccountSettingsService.requestEmailChange email delivery:",
                    emailError
                );

                /*
                 * The OTP remains stored. The user can
                 * use Resend Code to get another one.
                 */
                throw new AppError(
                    "Verification code could not be sent. Please try again.",
                    500,
                    "EMAIL_VERIFICATION_SEND_FAILED"
                );
            }

            return {
                userId,
                verificationToken,
                expiresInMinutes:
                    getEmailChangeTokenExpirationMinutes(),
            };
        } catch (error) {
            try {
                await client.query("ROLLBACK");
            } catch {
                // Nothing to do.
            }

            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "AccountSettingsService.requestEmailChange:",
                error
            );

            throw new AppError(
                "Failed to start email change.",
                500,
                "EMAIL_CHANGE_REQUEST_FAILED"
            );
        } finally {
            client.release();
        }
    },

    async verifyEmailChange(
        userId,
        otp,
        verificationToken
    ) {
        const tokenData =
            verifyEmailChangeToken(
                verificationToken
            );

        if (!tokenData) {
            throw new AppError(
                "Email verification session is invalid or expired.",
                400,
                "EMAIL_CHANGE_TOKEN_INVALID"
            );
        }

        if (tokenData.userId !== userId) {
            throw new AppError(
                "Email verification session is invalid.",
                403,
                "EMAIL_CHANGE_TOKEN_FORBIDDEN"
            );
        }

        const client = await pool.connect();

        try {
            const userResult = await client.query(
                 `SELECT id
                        FROM users
                        WHERE id = $1
                        LIMIT 1
                        `,
                [userId]
            );

            if (!userResult.rows[0]) {
                throw new AppError(
                    "User not found.",
                    404,
                    "USER_NOT_FOUND"
                );
            }

            /*
             * Re-check uniqueness at verification time.
             *
             * This matters because another user could have
             * claimed the email after the OTP was requested.
             */
            const existingUser =
                await AccountSettingsRepository.findUserByEmail(
                    client,
                    tokenData.email,
                    userId
                );

            if (existingUser) {
                throw new AppError(
                    "This email address is already in use.",
                    409,
                    "EMAIL_ALREADY_EXISTS"
                );
            }

            const otpRecord =
                await AccountSettingsRepository.getLatestEmailChangeOtp(
                    client,
                    userId
                );

            if (!otpRecord) {
                throw new AppError(
                    "Verification code not found.",
                    400,
                    "OTP_NOT_FOUND"
                );
            }

            if (otpRecord.verified_at) {
                throw new AppError(
                    "This verification code has already been used.",
                    400,
                    "OTP_ALREADY_USED"
                );
            }

            if (
                otpRecord.expires_at &&
                new Date(otpRecord.expires_at) <
                new Date()
            ) {
                throw new AppError(
                    "Verification code has expired.",
                    400,
                    "OTP_EXPIRED"
                );
            }

            const submittedHash = hashOtp(
                `${otp}:${tokenData.challengeId}`
            );

            if (
                submittedHash !==
                otpRecord.code_hash
            ) {
                throw new AppError(
                    "Invalid verification code.",
                    400,
                    "OTP_INVALID"
                );
            }

            await client.query("BEGIN");

            await AccountSettingsRepository.markEmailChangeOtpVerified(
                client,
                otpRecord.id
            );

            /*
             * THIS is the first point where users.email
             * is changed.
             */
            const updatedUser =
                await AccountSettingsRepository.updateUserEmail(
                    client,
                    userId,
                    tokenData.email
                );

            if (!updatedUser) {
                throw new AppError(
                    "Failed to update email address.",
                    500,
                    "EMAIL_UPDATE_FAILED"
                );
            }

            await client.query("COMMIT");

            return {
                userId: updatedUser.id,
                email: updatedUser.email,
                emailVerifiedAt:
                    updatedUser.email_verified_at,
            };
        } catch (error) {
            try {
                await client.query("ROLLBACK");
            } catch {
                // Nothing to do.
            }

            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "AccountSettingsService.verifyEmailChange:",
                error
            );

            throw new AppError(
                "Failed to verify email change.",
                500,
                "EMAIL_CHANGE_VERIFICATION_FAILED"
            );
        } finally {
            client.release();
        }
    },

    async resendEmailChange(
        userId,
        verificationToken
    ) {
        const tokenData =
            verifyEmailChangeToken(
                verificationToken
            );

        if (!tokenData) {
            throw new AppError(
                "Email verification session is invalid or expired. Please start again.",
                400,
                "EMAIL_CHANGE_TOKEN_INVALID"
            );
        }

        if (tokenData.userId !== userId) {
            throw new AppError(
                "Email verification session is invalid.",
                403,
                "EMAIL_CHANGE_TOKEN_FORBIDDEN"
            );
        }

        const client = await pool.connect();

        try {
            const recentOtp =
                await AccountSettingsRepository.getRecentEmailChangeOtp(
                    client,
                    userId,
                    OTP_COOLDOWN_SECONDS
                );

            if (recentOtp) {
                throw new AppError(
                    "Please wait before requesting another verification code.",
                    429,
                    "OTP_RESEND_COOLDOWN"
                );
            }

            const existingUser =
                await AccountSettingsRepository.findUserByEmail(
                    client,
                    tokenData.email,
                    userId
                );

            if (existingUser) {
                throw new AppError(
                    "This email address is already in use.",
                    409,
                    "EMAIL_ALREADY_EXISTS"
                );
            }

            const otp = generateOtp();

            const codeHash = hashOtp(
                `${otp}:${tokenData.challengeId}`
            );

            const expiresAt = new Date(
                Date.now() +
                OTP_EXPIRES_MINUTES *
                60 *
                1000
            );

            await client.query("BEGIN");

            await AccountSettingsRepository.invalidateEmailChangeOtps(
                client,
                userId
            );

            await AccountSettingsRepository.createEmailChangeOtp(
                client,
                userId,
                expiresAt,
                codeHash
            );

            await client.query("COMMIT");

            await EmailService.sendVerificationOtp({
                to: tokenData.email,
                name: "Offlix User",
                otp,
                expiresInMinutes:
                    OTP_EXPIRES_MINUTES,
            });

            return {
                expiresInMinutes:
                    OTP_EXPIRES_MINUTES,
            };
        } catch (error) {
            try {
                await client.query("ROLLBACK");
            } catch {
                // Nothing to do.
            }

            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "AccountSettingsService.resendEmailChange:",
                error
            );

            throw new AppError(
                "Failed to resend verification code.",
                500,
                "EMAIL_CHANGE_RESEND_FAILED"
            );
        } finally {
            client.release();
        }
    },

    async getAccountIdForUser(client, userId) {
        const result = await client.query(
            `
            SELECT account_id
            FROM users
            WHERE id = $1
            LIMIT 1
            `,
            [userId]
        );

        return result.rows[0]?.account_id || null;
    },
};

export default AccountSettingsService;