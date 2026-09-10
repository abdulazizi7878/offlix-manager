import { NextResponse } from "next/server";

import MoneyService from "@/services/money.service";

import {
    createTransactionSchema,
    transactionListQuerySchema,
} from "@/validations/money.validation";

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

        const { user } = currentUser;

        const body =
            await request.json();

        const validatedData =
            createTransactionSchema.parse(body);

        const transaction =
            await MoneyService.createTransaction(
                user.id,
                user.accountId,
                validatedData
            );

        return NextResponse.json(
            {
                success: true,
                data: transaction,
            },
            {
                status: 201,
            }
        );
    }
);

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

        const { searchParams } =
            new URL(request.url);

        const query =
            transactionListQuerySchema.parse({
                page:
                    searchParams.get("page") ??
                    undefined,

                limit:
                    searchParams.get("limit") ??
                    undefined,

                moneyAccountId:
                    searchParams.get(
                        "moneyAccountId"
                    ) ?? undefined,

                type:
                    searchParams.get("type") ??
                    undefined,

                direction:
                    searchParams.get("direction") ??
                    undefined,

                search:
                    searchParams.get("search") ??
                    undefined,

                dateFrom:
                    searchParams.get("dateFrom") ??
                    undefined,

                dateTo:
                    searchParams.get("dateTo") ??
                    undefined,
            });

        const result =
            await MoneyService.getTransactions(
                user.id,
                user.accountId,
                query
            );

        return NextResponse.json({
            success: true,
            data: result,
        });
    }
);