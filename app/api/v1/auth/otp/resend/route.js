// file: app/api/v1/auth/otp/resend/route.js

import { NextResponse } from "next/server";

import {
  resendOtpSchema,
} from "@/validations/auth.validation";

import AuthService from "@/services/auth.service";

import { rateLimit } from "@/lib/security/rate-limit";

import { handleApiError } from "@/lib/api/api-error";

export async function POST(request) {
  try {
    const rate = await rateLimit(request, {
      key: "otp-resend",
      limit: 3,
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
      resendOtpSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message:
              "Invalid verification request.",
            fields:
              validation.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const result =
      await AuthService.resendOtp(
        validation.data.userId
      );

    return NextResponse.json(
      {
        success: true,
        message:
          "A new verification code has been sent.",
        data: result,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    return handleApiError(
      error,
      "POST /api/v1/auth/otp/resend"
    );
  }
}