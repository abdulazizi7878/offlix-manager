import { NextResponse } from "next/server";

import ProductService from "@/services/product.service";

import {
    productIdSchema,
    updateProductStatusSchema,
} from "@/validations/product.validation";

import { getCurrentUser } from "@/lib/auth/get-current-user";

import AppError from "@/lib/errors/AppError";

import { withErrorHandling } from "@/lib/api/with-error-handling";

export const PATCH = withErrorHandling(
    async (request, context) => {
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

        const { id } =
            await context.params;

        const productId =
            productIdSchema.parse(id);

        const body =
            await request.json();

        const validatedData =
            updateProductStatusSchema.parse(
                body
            );

        const product =
            await ProductService.updateProductStatus(
                user.id,
                user.accountId,
                productId,
                validatedData.status
            );

        return NextResponse.json({
            success: true,
            data: product,
        });
    }
);