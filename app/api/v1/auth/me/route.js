import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required.",
          },
        },
        {
          status: 401,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          user: currentUser.user,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET /api/v1/auth/me:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message:
            "Something went wrong. Please try again later.",
        },
      },
      {
        status: 500,
      }
    );
  }
}