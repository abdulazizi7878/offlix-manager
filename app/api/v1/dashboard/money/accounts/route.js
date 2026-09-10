
// app/api/v1/dashboard/money/accounts/route.js


import { NextResponse } from "next/server";

import MoneyService from "@/services/money.service";

import {
    createMoneyAccountSchema,
    moneyAccountListQuerySchema,
} from "@/validations/money.validation";

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

        const { user } = currentUser;

        const body =
            await request.json();

        const validatedData =
            createMoneyAccountSchema.parse(body);

        const moneyAccount =
            await MoneyService.createMoneyAccount(
                user.id,
                user.accountId,
                validatedData
            );

        return NextResponse.json(
            {
                success: true,
                data: moneyAccount,
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

        const { user } = currentUser;

        const { searchParams } =
            new URL(request.url);

        const query =
            moneyAccountListQuerySchema.parse({
                page:
                    searchParams.get("page") ??
                    undefined,

                limit:
                    searchParams.get("limit") ??
                    undefined,

                search:
                    searchParams.get("search") ??
                    undefined,

                type:
                    searchParams.get("type") ??
                    undefined,

                status:
                    searchParams.get("status") ??
                    undefined,
            });

        const result =
            await MoneyService.getMoneyAccounts(
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