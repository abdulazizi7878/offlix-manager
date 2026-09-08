import { NextResponse } from "next/server";

import FinanceService from "@/services/finance.service";
import {
    receivableIdSchema,
    createReceivablePaymentSchema,
} from "@/validations/finance.validation";

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

        const { user } =
            currentUser;

        const { receivableId } =
            await params;

        const id =
            receivableIdSchema.parse(
                receivableId
            );

        const body =
            await request.json();

        const data =
            createReceivablePaymentSchema.parse(
                body
            );

        const receivable =
            await FinanceService.payReceivable(
                user.id,
                user.accountId,
                id,
                data
            );

        return NextResponse.json({
            success: true,
            data: receivable,
        });
    }
);