import { NextResponse } from "next/server";

import AuthService from "@/services/auth.service";

import {
  getSessionCookie,
  clearSessionCookie,
} from "@/lib/auth/session";

import { handleApiError } from "@/lib/api/api-error";

export async function POST() {
  try {
    const sessionToken =
      await getSessionCookie();

    if (sessionToken) {
      await AuthService.logout(
        sessionToken
      );
    }

    await clearSessionCookie();

    return NextResponse.json(
      {
        success: true,
        message: "Logged out successfully.",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    return handleApiError(
      error,
      "POST /api/v1/auth/logout"
    );
  }
}