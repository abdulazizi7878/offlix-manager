// file: app/api/v1/dashboard/products/purchases/route.js

import { NextResponse } from "next/server";

import PurchaseService from "@/services/purchase.service";

import {
    purchaseListQuerySchema,
} from "@/validations/purchase.validation";

import { getCurrentUser } from "@/lib/auth/get-current-user";

import AppError from "@/lib/errors/AppError";

import { withErrorHandling } from "@/lib/api/with-error-handling";

export const GET = withErrorHandling(async (request) => {
    const currentUser = await getCurrentUser();

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

    const query = {
        page:
            searchParams.get("page") ??
            undefined,

        limit:
            searchParams.get("limit") ??
            undefined,

        search:
            searchParams.get("search") ??
            undefined,

        branchId:
            searchParams.get("branchId") ??
            undefined,

        productId:
            searchParams.get("productId") ??
            undefined,

        paymentSource:
            searchParams.get("paymentSource") ??
            undefined,

        from:
            searchParams.get("from") ??
            undefined,

        to:
            searchParams.get("to") ??
            undefined,
    };

    const validatedQuery =
        purchaseListQuerySchema.parse(query);

    const result =
        await PurchaseService.getPurchases(
            user.id,
            user.accountId,
            validatedQuery
        );

    return NextResponse.json({
        success: true,
        data: result,
    });
});