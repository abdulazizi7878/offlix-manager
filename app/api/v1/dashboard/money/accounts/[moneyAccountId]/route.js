// file: app/api/v1/dashboard/money/accounts/[moneyAccountId]/route.js

import { NextResponse } from "next/server";

import MoneyService from "@/services/money.service";

import {
    moneyAccountIdSchema,
    updateMoneyAccountSchema,
} from "@/validations/money.validation";

import { getCurrentUser } from "@/lib/auth/get-current-user";

import AppError from "@/lib/errors/AppError";

import { withErrorHandling } from "@/lib/api/with-error-handling";

export const GET = withErrorHandling(
    async (request, context) => {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            throw new AppError(
                "Authentication required.",
                401,
                "UNAUTHORIZED"
            );
        }

        const { user } = currentUser;

        const resolvedParams = await context.params;

        const moneyAccountId =
            resolvedParams?.moneyAccountId;

        const validatedMoneyAccountId =
            moneyAccountIdSchema.parse(moneyAccountId);

        const moneyAccount =
            await MoneyService.getMoneyAccount(
                user.id,
                user.accountId,
                validatedMoneyAccountId
            );

        return NextResponse.json({
            success: true,
            data: moneyAccount,
        });
    }
);

export const PATCH = withErrorHandling(
    async (request, context) => {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            throw new AppError(
                "Authentication required.",
                401,
                "UNAUTHORIZED"
            );
        }

        const { user } = currentUser;

        const resolvedParams = await context.params;

        const moneyAccountId =
            resolvedParams?.moneyAccountId;

        const validatedMoneyAccountId =
            moneyAccountIdSchema.parse(moneyAccountId);

        const body = await request.json();

        const validatedData =
            updateMoneyAccountSchema.parse(body);

        const moneyAccount =
            await MoneyService.updateMoneyAccount(
                user.id,
                user.accountId,
                validatedMoneyAccountId,
                validatedData
            );

        return NextResponse.json({
            success: true,
            data: moneyAccount,
        });
    }
);