import { NextResponse } from "next/server";

import SaleService from "@/services/sale.service";

import {
    saleIdSchema,
    addSalePaymentSchema,
} from "@/validations/sale.validation";

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

        const { saleId } = await params;

        const id =
            saleIdSchema.parse(saleId);

        const body =
            await request.json();

        const data =
            addSalePaymentSchema.parse(body);

        const payment =
            await SaleService.addSalePayment(
                user.id,
                user.accountId,
                id,
                data
            );

        return NextResponse.json(
            {
                success: true,
                data: payment,
            },
            {
                status: 201,
            }
        );
    }
);