import argon2 from "argon2";

import pool from "@/lib/database";
import AuthRepository from "@/repositories/auth.repository";
import AppError from "@/lib/errors/AppError";

import {
  generateOtp,
  hashOtp,
  generateToken,
  hashToken,
} from "@/lib/security/token";

import EmailService from "@/lib/email/email.service";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

const OTP_PURPOSE = "email_verification";

const OTP_EXPIRES_MINUTES = Number(
  process.env.OTP_EXPIRES_MINUTES || 10
);

const SESSION_DURATION_DAYS = Number(
  process.env.SESSION_DURATION_DAYS || 30
);

function generateUsername(name) {
  const base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 30) || "user";

  return base;
}

async function generateUniqueUsername(client, name) {
  const base = generateUsername(name);

  let username = base;
  let counter = 1;

  while (true) {
    const existing =
      await AuthRepository.findUserByUsername(
        client,
        username
      );

    if (!existing) {
      return username;
    }

    username = `${base}${counter}`;
    counter += 1;
  }
}

function getSessionExpiration() {
  const expiresAt = new Date();

  expiresAt.setDate(
    expiresAt.getDate() + SESSION_DURATION_DAYS
  );

  return expiresAt;
}

const AuthService = {
  async register(data) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const existingEmail =
        await AuthRepository.findUserByEmail(
          client,
          data.email
        );

      if (existingEmail) {
        throw new AppError(
          "An account with this email already exists.",
          409,
          "EMAIL_ALREADY_EXISTS"
        );
      }

      if (data.phone) {
        const existingPhone =
          await AuthRepository.findUserByPhone(
            client,
            data.phone
          );

        if (existingPhone) {
          throw new AppError(
            "An account with this phone number already exists.",
            409,
            "PHONE_ALREADY_EXISTS"
          );
        }
      }

      const username =
        await generateUniqueUsername(
          client,
          data.name
        );

      const passwordHash =
        await argon2.hash(data.password, {
          type: argon2.argon2id,
        });

      const account =
        await AuthRepository.createAccount(
          client,
          data.accountName
        );

      const user =
        await AuthRepository.createUser(
          client,
          {
            accountId: account.id,
            name: data.name,
            email: data.email,
            phone: data.phone || null,
            username,
          }
        );

      await AuthRepository.createAuthAccount(
        client,
        {
          userId: user.id,
          provider: "password",
          passwordHash,
        }
      );

      await AuthRepository.createUserProfile(
        client,
        user.id
      );

      const otp = generateOtp();
      const otpHash = hashOtp(otp);

      const expiresAt = new Date(
        Date.now() +
          OTP_EXPIRES_MINUTES * 60 * 1000
      );

      await AuthRepository.createOtp(
        client,
        {
          userId: user.id,
          codeHash: otpHash,
          purpose: OTP_PURPOSE,
          expiresAt,
        }
      );

      await client.query("COMMIT");

      try {
        await EmailService.sendVerificationOtp({
          to: user.email,
          name: user.name,
          otp,
          expiresInMinutes: OTP_EXPIRES_MINUTES,
        });
      } catch (emailError) {
        console.error(
          "Registration email failed:",
          emailError
        );

        throw new AppError(
          "Your account was created, but we could not send the verification email. Please request a new code.",
          503,
          "EMAIL_DELIVERY_FAILED"
        );
      }

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          username: user.username,
        },
        account: {
          id: account.id,
          name: account.name,
        },
        requiresVerification: true,
      };
    } catch (error) {
      await client.query("ROLLBACK");

      if (error instanceof AppError) {
        throw error;
      }

      if (error.code === "23505") {
        throw new AppError(
          "An account with some of these details already exists.",
          409,
          "ACCOUNT_ALREADY_EXISTS"
        );
      }

      console.error(
        "AuthService.register:",
        error
      );

      throw new AppError(
        "Unable to create your account right now.",
        500,
        "REGISTRATION_FAILED"
      );
    } finally {
      client.release();
    }
  },

  async login(login, password) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const user =
        await AuthRepository.findUserByLogin(
          client,
          login
        );

      if (!user) {
        throw new AppError(
          "Invalid login credentials.",
          401,
          "INVALID_CREDENTIALS"
        );
      }

      const authAccount =
        await AuthRepository.findPasswordAuthAccount(
          client,
          user.id
        );

      if (!authAccount) {
        throw new AppError(
          "Invalid login credentials.",
          401,
          "INVALID_CREDENTIALS"
        );
      }

      if (
        authAccount.locked_until &&
        new Date(authAccount.locked_until) > new Date()
      ) {
        throw new AppError(
          "Too many unsuccessful login attempts. Please try again later.",
          429,
          "ACCOUNT_TEMPORARILY_LOCKED"
        );
      }

      let passwordValid = false;

      try {
        passwordValid = await argon2.verify(
          authAccount.password_hash,
          password
        );
      } catch {
        passwordValid = false;
      }

      if (!passwordValid) {
        const updated =
          await AuthRepository.recordFailedLogin(
            client,
            authAccount.id,
            MAX_LOGIN_ATTEMPTS,
            LOCK_DURATION_MINUTES
          );

        if (
          updated?.locked_until &&
          new Date(updated.locked_until) > new Date()
        ) {
          throw new AppError(
            "Too many unsuccessful login attempts. Please try again later.",
            429,
            "ACCOUNT_TEMPORARILY_LOCKED"
          );
        }

        throw new AppError(
          "Invalid login credentials.",
          401,
          "INVALID_CREDENTIALS"
        );
      }

      await AuthRepository.resetLoginAttempts(
        client,
        authAccount.id
      );

      let verificationEmail = null;

      /*
       * Generate a verification OTP automatically
       * when the user's email exists but is not verified.
       */
      if (user.email && !user.email_verified_at) {
        const cooldownSeconds = 60;

        const recentOtp =
          await AuthRepository.findRecentOtp(
            client,
            user.id,
            OTP_PURPOSE,
            cooldownSeconds
          );

        if (!recentOtp) {
          await AuthRepository.invalidateActiveOtps(
            client,
            user.id,
            OTP_PURPOSE
          );

          const otp = generateOtp();

          const otpHash = hashOtp(otp);

          const otpExpiresAt = new Date(
            Date.now() +
            OTP_EXPIRES_MINUTES * 60 * 1000
          );

          await AuthRepository.createOtp(
            client,
            {
              userId: user.id,
              codeHash: otpHash,
              purpose: OTP_PURPOSE,
              expiresAt: otpExpiresAt,
            }
          );

          verificationEmail = {
            to: user.email,
            name: user.name,
            otp,
            expiresInMinutes:
              OTP_EXPIRES_MINUTES,
          };
        }
      }

      const sessionToken =
        generateToken(32);

      const tokenHash =
        hashToken(sessionToken);

      const sessionExpiresAt =
        getSessionExpiration();

      const session =
        await AuthRepository.createSession(
          client,
          {
            userId: user.id,
            tokenHash,
            expiresAt: sessionExpiresAt,
          }
        );

      await client.query("COMMIT");

      /*
       * Send the email only after the database transaction
       * has successfully committed.
       */
      if (verificationEmail) {
        try {
          await EmailService.sendVerificationOtp(
            verificationEmail
          );
        } catch (emailError) {
          console.error(
            "Login verification email failed:",
            emailError
          );

          throw new AppError(
            "Your login was successful, but we could not send the verification code. Please use Resend Code on the verification page.",
            503,
            "EMAIL_DELIVERY_FAILED"
          );
        }
      }

      return {
        sessionToken,
        sessionExpiresAt:
          session.expires_at,

        requiresEmailVerification:
          Boolean(user.email) &&
          !user.email_verified_at,

        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          username: user.username,
          accountId: user.account_id,
        },
      };
    } catch (error) {
      await client.query("ROLLBACK");

      if (error instanceof AppError) {
        throw error;
      }

      console.error(
        "AuthService.login:",
        error
      );

      throw new AppError(
        "Unable to sign in right now.",
        500,
        "LOGIN_FAILED"
      );
    } finally {
      client.release();
    }
  },

  async verifyOtp(userId, otp) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const otpRecord =
        await AuthRepository.findLatestOtp(
          client,
          userId,
          OTP_PURPOSE
        );

      if (!otpRecord) {
        throw new AppError(
          "Invalid verification code.",
          400,
          "INVALID_OTP"
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
        new Date(otpRecord.expires_at) <= new Date()
      ) {
        throw new AppError(
          "This verification code has expired.",
          400,
          "OTP_EXPIRED"
        );
      }

      const valid =
        hashOtp(otp) === otpRecord.code_hash;

      if (!valid) {
        throw new AppError(
          "Invalid verification code.",
          400,
          "INVALID_OTP"
        );
      }

      const verifiedOtp =
        await AuthRepository.markOtpVerified(
          client,
          otpRecord.id
        );

      if (!verifiedOtp) {
        throw new AppError(
          "This verification code is no longer valid.",
          400,
          "OTP_ALREADY_USED"
        );
      }

      const user =
        await AuthRepository.markEmailVerified(
          client,
          userId
        );

      if (!user) {
        throw new AppError(
          "Unable to verify this account.",
          400,
          "VERIFICATION_FAILED"
        );
      }

      const sessionToken =
        generateToken(32);

      const tokenHash =
        hashToken(sessionToken);

      const expiresAt =
        getSessionExpiration();

      const session =
        await AuthRepository.createSession(
          client,
          {
            userId: user.id,
            tokenHash,
            expiresAt,
          }
        );

      await client.query("COMMIT");

      return {
        sessionToken,
        sessionExpiresAt: session.expires_at,

        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          username: user.username,
          accountId: user.account_id,
        },
      };
    } catch (error) {
      await client.query("ROLLBACK");

      if (error instanceof AppError) {
        throw error;
      }

      console.error(
        "AuthService.verifyOtp:",
        error
      );

      throw new AppError(
        "Unable to verify your account right now.",
        500,
        "VERIFICATION_FAILED"
      );
    } finally {
      client.release();
    }
  },

    async resendOtp(userId) {
      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        const userResult = await client.query(
          `
          SELECT *
          FROM users
          WHERE id = $1
          LIMIT 1
          `,
          [userId]
        );

        const user = userResult.rows[0];

        if (!user) {
          throw new AppError(
            "Unable to process this request.",
            404,
            "USER_NOT_FOUND"
          );
        }

        if (user.email_verified_at) {
          throw new AppError(
            "This email has already been verified.",
            400,
            "EMAIL_ALREADY_VERIFIED"
          );
        }

        // --------------------------------------------------
        // RESEND COOLDOWN
        // --------------------------------------------------

        const cooldownSeconds = 60;

        const recentOtp =
          await AuthRepository.findRecentOtp(
            client,
            user.id,
            OTP_PURPOSE,
            cooldownSeconds
          );

        if (recentOtp) {
          const createdAt =
            new Date(recentOtp.created_at).getTime();

          const elapsedSeconds = Math.floor(
            (Date.now() - createdAt) / 1000
          );

          const retryAfter = Math.max(
            1,
            cooldownSeconds - elapsedSeconds
          );

          throw new AppError(
            `Please wait ${retryAfter} seconds before requesting another code.`,
            429,
            "OTP_RESEND_COOLDOWN"
          );
        }

        // --------------------------------------------------
        // CREATE NEW OTP
        // --------------------------------------------------

        await AuthRepository.invalidateActiveOtps(
          client,
          user.id,
          OTP_PURPOSE
        );

        const otp = generateOtp();

        const otpHash = hashOtp(otp);

        const expiresAt = new Date(
          Date.now() +
            OTP_EXPIRES_MINUTES * 60 * 1000
        );

        await AuthRepository.createOtp(
          client,
          {
            userId: user.id,
            codeHash: otpHash,
            purpose: OTP_PURPOSE,
            expiresAt,
          }
        );

        await client.query("COMMIT");

        // --------------------------------------------------
        // SEND EMAIL
        // --------------------------------------------------

        try {
          await EmailService.sendVerificationOtp({
            to: user.email,
            name: user.name,
            otp,
            expiresInMinutes: OTP_EXPIRES_MINUTES,
          });
        } catch (emailError) {
          console.error(
            "Resend OTP email failed:",
            emailError
          );

          throw new AppError(
            "We could not send a new verification code. Please try again later.",
            503,
            "EMAIL_DELIVERY_FAILED"
          );
        }

        return {
          expiresInMinutes: OTP_EXPIRES_MINUTES,
        };
      } catch (error) {
        await client.query("ROLLBACK");

        if (error instanceof AppError) {
          throw error;
        }

        console.error(
          "AuthService.resendOtp:",
          error
        );

        throw new AppError(
          "Unable to resend the verification code.",
          500,
          "OTP_RESEND_FAILED"
        );
      } finally {
        client.release();
      }
    },

  async createSessionFromToken(sessionToken) {
    if (!sessionToken) {
      return null;
    }

    const client = await pool.connect();

    try {
      return await AuthRepository.findSessionByTokenHash(
        client,
        hashToken(sessionToken)
      );
    } finally {
      client.release();
    }
  },
  
  async logout(sessionToken) {
    if (!sessionToken) {
        return;
    }

    const client = await pool.connect();

    try {
        await AuthRepository.revokeSessionByTokenHash(
        client,
        hashToken(sessionToken)
        );
    } finally {
        client.release();
    }
    },
};

export default AuthService;