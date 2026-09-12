import { NextResponse } from "next/server";

import PurchaseService from "@/services/purchase.service";

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

        const { purchaseId } =
            await params;

        const purchase =
            await PurchaseService.getPurchase(
                user.id,
                user.accountId,
                purchaseId
            );

        return NextResponse.json({
            success: true,
            data: purchase,
        });
    }
);