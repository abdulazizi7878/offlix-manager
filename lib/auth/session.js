import { cookies } from "next/headers";

const COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME ||
  "offlix_session";

export async function setSessionCookie(
  sessionToken,
  expiresAt
) {
  const cookieStore = await cookies();

  cookieStore.set({
    name: COOKIE_NAME,
    value: sessionToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function getSessionCookie() {
  const cookieStore = await cookies();

  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}