import { cookies } from "next/headers";

import pool from "@/lib/database";
import AuthRepository from "@/repositories/auth.repository";
import { hashToken } from "@/lib/security/token";

const COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME || "offlix_session";

export async function getCurrentUser() {
  const cookieStore = await cookies();

  const sessionToken =
    cookieStore.get(COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const tokenHash = hashToken(sessionToken);

  const client = await pool.connect();

  try {
    const session =
      await AuthRepository.findSessionByTokenHash(
        client,
        tokenHash
      );

    if (!session) {
      return null;
    }

    return {
      session: {
        id: session.id,
        expiresAt: session.expires_at,
      },

      user: {
        id: session.user_id,
        accountId: session.account_id,
        name: session.name,
        email: session.email,
        phone: session.phone,
        username: session.username,
        emailVerifiedAt:
          session.email_verified_at,
      },
    };
  } finally {
    client.release();
  }
}