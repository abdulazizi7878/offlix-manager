import { NextResponse } from "next/server";

import { registerSchema } from "@/validations/auth.validation";
import AuthService from "@/services/auth.service";
import { rateLimit } from "@/lib/security/rate-limit";
import { handleApiError } from "@/lib/api/api-error";

export async function POST(request) {
  try {
    const rate = await rateLimit(request, {
      key: "auth-register",
      limit: 5,
      windowSeconds: 300,
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
      registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid registration data.",
            fields:
              validation.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const result =
      await AuthService.register(
        validation.data
      );

    return NextResponse.json(
      {
        success: true,
        message:
          "Account created successfully. Please verify your email.",
        data: result,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    return handleApiError(
      error,
      "POST /api/v1/auth/register"
    );
  }
}