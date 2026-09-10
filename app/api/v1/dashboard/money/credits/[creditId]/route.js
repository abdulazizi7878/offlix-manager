import { NextResponse } from "next/server";

import MoneyService from "@/services/money.service";

import {
    creditIdSchema,
} from "@/validations/money.validation";

import { getCurrentUser } from "@/lib/auth/get-current-user";

import AppError from "@/lib/errors/AppError";

import { withErrorHandling } from "@/lib/api/with-error-handling";

export const GET = withErrorHandling(
    async (request, { params }) => {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            throw new AppError(
                "Authentication required.",
                401,
                "UNAUTHORIZED"
            );
        }

        const { user } = currentUser;

        const { creditId } = await params;

        const validatedCreditId =
            creditIdSchema.parse(creditId);

        const credit =
            await MoneyService.getCredit(
                user.id,
                user.accountId,
                validatedCreditId
            );

        return NextResponse.json({
            success: true,
            data: credit,
        });
    }
);