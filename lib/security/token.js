import crypto from "crypto";

const EMAIL_CHANGE_TOKEN_PURPOSE = "email_change";

const OTP_EXPIRES_MINUTES = Number(
  process.env.OTP_EXPIRES_MINUTES || 10
);

function getEncryptionKey() {
  const secret = process.env.EMAIL_CHANGE_TOKEN_SECRET;

  if (!secret) {
    throw new Error("EMAIL_CHANGE_TOKEN_SECRET is not configured.");
  }

  return crypto
    .createHash("sha256")
    .update(secret)
    .digest();
}

export function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

export function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

export function generateOtp() {
  return crypto
    .randomInt(100000, 1000000)
    .toString();
}

export function hashOtp(otp) {
  return crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
}

export function createEmailChangeToken({
  userId,
  email,
  challengeId,
}) {
  const expiresAt =
    Date.now() +
    OTP_EXPIRES_MINUTES * 60 * 1000;

  const payload = JSON.stringify({
    userId,
    email,
    challengeId,
    purpose: EMAIL_CHANGE_TOKEN_PURPOSE,
    expiresAt,
  });

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    key,
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(payload, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function verifyEmailChangeToken(token) {
  if (!token || typeof token !== "string") {
    return null;
  }

  try {
    const parts = token.split(".");

    if (parts.length !== 3) {
      return null;
    }

    const [ivPart, authTagPart, encryptedPart] = parts;

    const iv = Buffer.from(ivPart, "base64url");
    const authTag = Buffer.from(authTagPart, "base64url");
    const encrypted = Buffer.from(
      encryptedPart,
      "base64url"
    );

    const key = getEncryptionKey();

    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      key,
      iv
    );

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    const payload = JSON.parse(
      decrypted.toString("utf8")
    );

    if (
      payload.purpose !==
      EMAIL_CHANGE_TOKEN_PURPOSE
    ) {
      return null;
    }

    if (
      !payload.userId ||
      !payload.email ||
      !payload.challengeId ||
      !payload.expiresAt
    ) {
      return null;
    }

    if (
      Date.now() >= Number(payload.expiresAt)
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      challengeId: payload.challengeId,
      purpose: payload.purpose,
      expiresAt: payload.expiresAt,
    };
  } catch {
    return null;
  }
}

export function getEmailChangeTokenExpirationMinutes() {
  return OTP_EXPIRES_MINUTES;
}