
// file: app/api/v1/dashboard/money/payables/route.js

import { NextResponse } from "next/server";

import FinanceService from "@/services/finance.service";
import {
    createPayableSchema,
} from "@/validations/finance.validation";

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

        const { user } =
            currentUser;

        const body =
            await request.json();

        const data =
            createPayableSchema.parse(
                body
            );

        const payable =
            await FinanceService.createPayable(
                user.id,
                user.accountId,
                data
            );

        return NextResponse.json(
            {
                success: true,
                data: payable,
            },
            {
                status: 201,
            }
        );
    }
);