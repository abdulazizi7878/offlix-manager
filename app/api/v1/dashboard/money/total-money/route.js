import { NextResponse } from "next/server";

import MoneyService from "@/services/money.service";

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

        const { user } = currentUser;

        const [
            total,
            byType,
            accounts,
        ] = await Promise.all([
            MoneyService.getTotalMoney(
                user.id,
                user.accountId
            ),

            MoneyService.getMoneyTotalsByType(
                user.id,
                user.accountId
            ),

            MoneyService.getMoneyAccountTotals(
                user.id,
                user.accountId
            ),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                total,
                byType,
                accounts,
            },
        });
    }
);