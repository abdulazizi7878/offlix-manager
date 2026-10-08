// file: app/api/v1/dashboard/money/receivables/[id]/payments/route.js

import { NextResponse } from "next/server";

import ReceivableService from "@/services/receivable.service";

import {
    createReceivablePaymentSchema,
} from "@/validations/money.validation";

import { getCurrentUser } from "@/lib/auth/get-current-user";

import AppError from "@/lib/errors/AppError";

import { withErrorHandling } from "@/lib/api/with-error-handling";

export const GET = withErrorHandling(
    async (
        request,
        { params }
    ) => {
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

        const { id } = await params;

        const receivable =
            await ReceivableService.getReceivable(
                user.id,
                user.accountId,
                id
            );

        return NextResponse.json({
            success: true,
            data: receivable.payments,
        });
    }
);

export const POST = withErrorHandling(
    async (
        request,
        { params }
    ) => {
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

        const { id } = await params;

        const body =
            await request.json();

        const validatedData =
            createReceivablePaymentSchema.parse(
                body
            );

        const result =
            await ReceivableService.receivePayment(
                user.id,
                user.accountId,
                id,
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