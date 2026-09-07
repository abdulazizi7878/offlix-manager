import { NextResponse } from "next/server";

import { loginSchema } from "@/validations/auth.validation";
import AuthService from "@/services/auth.service";
import { rateLimit } from "@/lib/security/rate-limit";
import { setSessionCookie } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/api-error";

export async function POST(request) {
  try {
    const rate = await rateLimit(request, {
      key: "auth-login",
      limit: 10,
      windowSeconds: 60,
    });

    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message:
              "Too many requests. Please try again later.",
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rate.retryAfter),
          },
        }
      );
    }

    const body = await request.json();

    const validation =
      loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid login data.",
            fields:
              validation.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const result =
      await AuthService.login(
        validation.data.login,
        validation.data.password
      );

    await setSessionCookie(
      result.sessionToken,
      result.sessionExpiresAt
    );

    return NextResponse.json(
      {
        success: true,
        message: "Login successful.",
        data: {
          user: result.user,
          sessionExpiresAt:
            result.sessionExpiresAt,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    return handleApiError(
      error,
      "POST /api/v1/auth/login"
    );
  }
}