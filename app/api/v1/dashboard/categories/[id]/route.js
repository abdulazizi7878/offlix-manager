

// file: app/api/v1/dashboard/categories/[id]/route.js

import { NextResponse } from "next/server";

import ProductService from "@/services/product.service";

import {
    categoryIdSchema,
    updateCategorySchema,
} from "@/validations/product.validation";

import { getCurrentUser } from "@/lib/auth/get-current-user";

import AppError from "@/lib/errors/AppError";

import { withErrorHandling } from "@/lib/api/with-error-handling";

export const PATCH = withErrorHandling(
    async (request, context) => {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            throw new AppError(
                "Authentication required.",
                401,
                "UNAUTHORIZED"
            );
        }

        const { user } = currentUser;

        const { id } = await context.params;

        const categoryId =
            categoryIdSchema.parse(id);

        const body = await request.json();

        const validatedData =
            updateCategorySchema.parse(body);

        const category =
            await ProductService.updateCategory(
                user.id,
                user.accountId,
                categoryId,
                validatedData
            );

        return NextResponse.json({
            success: true,
            data: category,
        });
    }
);

export const DELETE = withErrorHandling(
    async (request, context) => {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            throw new AppError(
                "Authentication required.",
                401,
                "UNAUTHORIZED"
            );
        }

        const { user } = currentUser;

        const { id } = await context.params;

        const categoryId =
            categoryIdSchema.parse(id);

        const category =
            await ProductService.deleteCategory(
                user.id,
                user.accountId,
                categoryId
            );

        return NextResponse.json({
            success: true,
            data: category,
        });
    }
);