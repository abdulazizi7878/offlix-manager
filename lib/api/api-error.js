import { NextResponse } from "next/server";
import AppError from "@/lib/errors/AppError";

export function handleApiError(error, context) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      },
      {
        status: error.statusCode,
      }
    );
  }

  console.error(context, error);

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