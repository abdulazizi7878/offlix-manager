import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/get-current-user";

import AppError from "@/lib/errors/AppError";

import OverviewService from "@/services/overview.service";

import {
    overviewQuerySchema,
} from "@/validations/overview.validation";

export async function GET(request) {
    try {
        const currentUser =
            await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "UNAUTHORIZED",
                        message:
                            "Authentication required.",
                    },
                },
                {
                    status: 401,
                }
            );
        }

        const { user } = currentUser;

        const { searchParams } =
            new URL(request.url);

        const rawQuery = {
            period:
                searchParams.get("period") ??
                undefined,

            date:
                searchParams.get("date") ??
                undefined,

            branchId:
                searchParams.get("branchId") ??
                undefined,

            from:
                searchParams.get("from") ??
                undefined,

            to:
                searchParams.get("to") ??
                undefined,

            page:
                searchParams.get("page") ??
                undefined,

            limit:
                searchParams.get("limit") ??
                undefined,
        };

        const validationResult =
            overviewQuerySchema.safeParse(
                rawQuery
            );

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message:
                            "Invalid overview query.",
                        details:
                            validationResult.error.flatten(),
                    },
                },
                {
                    status: 400,
                }
            );
        }

        const data =
            await OverviewService.getOverview(
                user.id,
                user.accountId,
                validationResult.data
            );

        return NextResponse.json(
            {
                success: true,
                data,
            },
            {
                status: 200,
            }
        );
    } catch (error) {
        console.error(
            "GET /api/v1/dashboard/overview error:",
            error
        );

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
                    code:
                        "INTERNAL_SERVER_ERROR",
                    message:
                        "Something went wrong.",
                },
            },
            {
                status: 500,
            }
        );
    }
}