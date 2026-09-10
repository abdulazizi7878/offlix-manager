
// app/api/v1/dashboard/money/transfers/[transferId]/route.js

import { NextResponse } from "next/server";

import MoneyService from "@/services/money.service";

import {
    transferIdSchema,
} from "@/validations/money.validation";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import AppError from "@/lib/errors/AppError";
import { withErrorHandling } from "@/lib/api/with-error-handling";

export const GET = withErrorHandling(
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

        const { transferId } = await params;

        const validatedTransferId =
            transferIdSchema.parse(transferId);

        const transfer =
            await MoneyService.getTransfer(
                user.id,
                user.accountId,
                validatedTransferId
            );

        return NextResponse.json({
            success: true,
            data: transfer,
        });
    }
);