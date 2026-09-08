import { NextResponse } from "next/server";

import FinanceService from "@/services/finance.service";
import {
    createSettlementSchema,
    settlementListQuerySchema,
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
            createSettlementSchema.parse(
                body
            );

        const settlement =
            await FinanceService.createSettlement(
                user.id,
                user.accountId,
                data
            );

        return NextResponse.json(
            {
                success: true,
                data: settlement,
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

        const { user } =
            currentUser;

        const { searchParams } =
            new URL(request.url);

        const query =
            settlementListQuerySchema.parse({
                page:
                    searchParams.get("page") ??
                    undefined,
                limit:
                    searchParams.get("limit") ??
                    undefined,
                branchId:
                    searchParams.get("branchId") ??
                    undefined,
                status:
                    searchParams.get("status") ??
                    undefined,
            });

        const client = null;

        // Settlement listing service should be added
        // before enabling this GET endpoint.
        throw new AppError(
            "Settlement listing is not implemented yet.",
            501,
            "SETTLEMENT_LIST_NOT_IMPLEMENTED"
        );
    }
);