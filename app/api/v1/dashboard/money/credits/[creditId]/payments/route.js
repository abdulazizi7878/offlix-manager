// file: app/api/v1/dashboard/money/credits/[creditId]/payments/route.js


import { NextResponse } from "next/server";

import MoneyService from "@/services/money.service";

import {
    creditIdSchema,
    receiveCreditPaymentSchema,
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

        const resolvedParams = await params;

        console.log("CREDIT PAYMENT PARAMS:", resolvedParams);

        const { creditId } = resolvedParams;

        console.log("CREDIT PAYMENT CREDIT ID:", creditId);

        const validatedCreditId =
            creditIdSchema.parse(creditId);

        const body = await request.json();

        console.log("CREDIT PAYMENT BODY:", body);

        const validatedData =
            receiveCreditPaymentSchema.parse(body);

        const result =
            await MoneyService.receiveCreditPayment(
                user.id,
                user.accountId,
                validatedCreditId,
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

        const { creditId } = await params;

        const validatedCreditId =
            creditIdSchema.parse(creditId);

        const payments =
            await MoneyService.getCreditPayments(
                user.id,
                user.accountId,
                validatedCreditId
            );

        return NextResponse.json({
            success: true,
            data: payments,
        });
    }
);