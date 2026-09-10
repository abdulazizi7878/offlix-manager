import { NextResponse } from "next/server";

import MoneyService from "@/services/money.service";

import {
    payableIdSchema,
    payPayableSchema,
} from "@/validations/money.validation";

import { getCurrentUser } from "@/lib/auth/get-current-user";

import AppError from "@/lib/errors/AppError";

import { withErrorHandling } from "@/lib/api/with-error-handling";

export const POST = withErrorHandling(
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

        const { payableId } = await params;

        const validatedPayableId =
            payableIdSchema.parse(payableId);

        const body = await request.json();

        const validatedData =
            payPayableSchema.parse(body);

        const result =
            await MoneyService.payPayable(
                user.id,
                user.accountId,
                validatedPayableId,
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

        const { payableId } = await params;

        const validatedPayableId =
            payableIdSchema.parse(payableId);

        const payments =
            await MoneyService.getPayablePayments(
                user.id,
                user.accountId,
                validatedPayableId
            );

        return NextResponse.json({
            success: true,
            data: payments,
        });
    }
);