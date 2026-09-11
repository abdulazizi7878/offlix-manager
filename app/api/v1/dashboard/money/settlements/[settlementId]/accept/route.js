import { NextResponse } from "next/server";

import MoneyService from "@/services/money.service";

import {
    settlementIdSchema,
    acceptSettlementSchema,
} from "@/validations/money.validation";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import AppError from "@/lib/errors/AppError";
import { withErrorHandling } from "@/lib/api/with-error-handling";

export const POST = withErrorHandling(
    async (request, { params }) => {
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

        const { settlementId } = await params;

        const validatedSettlementId =
            settlementIdSchema.parse(settlementId);

        const body =
            await request.json();

        const validatedData =
            acceptSettlementSchema.parse(body);

        const result =
            await MoneyService.acceptSettlement(
                user.id,
                user.accountId,
                validatedSettlementId,
                validatedData
            );

        return NextResponse.json(
            {
                success: true,
                data: result,
            },
            {
                status: 201,
            }
        );
    }
);