
// file: app/api/v1/dashboard/sales/[saleId]/route.js

import { NextResponse } from "next/server";

import SaleService from "@/services/sale.service";
import { saleIdSchema } from "@/validations/sale.validation";

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

        const { user } =
            currentUser;

        const { saleId } = await params;

        const id =
            saleIdSchema.parse(saleId);

        const sale =
            await SaleService.getSale(
                user.id,
                user.accountId,
                id
            );

        return NextResponse.json({
            success: true,
            data: sale,
        });
    }
);