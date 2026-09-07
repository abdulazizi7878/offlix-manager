import { NextResponse } from "next/server";
import AppError from "@/lib/errors/AppError";
import { ZodError } from "zod";

export function withErrorHandling(handler) {
  return async function routeHandler(request, context) {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error("API Error:", error);

      if (error instanceof ZodError) {
            return NextResponse.json(
                {
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Invalid request data.",
                    details: error.flatten(),
                },
                },
                {
                status: 400,
                }
            );
        }

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

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Something went wrong.",
          },
        },
        {
          status: 500,
        }
      );
    }
  };
}