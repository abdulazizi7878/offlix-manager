import { NextResponse } from "next/server";

import FinanceService from "@/services/finance.service";
import {
    receivableListQuerySchema,
} from "@/validations/finance.validation";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import AppError from "@/lib/errors/AppError";
import { withErrorHandling } from "@/lib/api/with-error-handling";

export const GET = withErrorHandling(
    async (request) => {
        const currentUser =
            await getCurrentUser();

        if (!currentUser) {
            throw new AppError(
                "Authentication required.",
                401,
                "UNAUTHORIZED"
            );
        }

        const { user } =
            currentUser;

        const { searchParams } =
            new URL(request.url);

        const query =
            receivableListQuerySchema.parse({
                page:
                    searchParams.get("page") ??
                    undefined,
                limit:
                    searchParams.get("limit") ??
                    undefined,
                branchId:
                    searchParams.get("branchId") ??
                    undefined,
                search:
                    searchParams.get("search") ??
                    undefined,
                status:
                    searchParams.get("status") ??
                    undefined,
            });

        const result =
            await FinanceService.getReceivables(
                user.id,
                user.accountId,
                query
            );

        return NextResponse.json({
            success: true,
            data: result,
        });
    }
);