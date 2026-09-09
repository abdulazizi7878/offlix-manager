import { NextResponse } from "next/server";

import {
    createFinancialAccountSchema,
    financialAccountListQuerySchema,
} from "@/validations/finance.validation";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import AppError from "@/lib/errors/AppError";
import { withErrorHandling } from "@/lib/api/with-error-handling";

export const POST = withErrorHandling(
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

        const body =
            await request.json();

        const data =
            createFinancialAccountSchema.parse(
                body
            );

        const financialAccount =
            await FinanceService.createFinancialAccount(
                user.id,
                user.accountId,
                data
            );

        return NextResponse.json(
            {
                success: true,
                data: financialAccount,
            },
            {
                status: 201,
            }
        );
    }
);

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
            financialAccountListQuerySchema.parse({
                branchId:
                    searchParams.get(
                        "branchId"
                    ) ?? undefined,
            });

        const accounts =
            await FinanceService.getFinancialAccounts(
                user.id,
                user.accountId,
                query
            );

        return NextResponse.json({
            success: true,
            data: accounts,
        });
    }
);