

// file: app/api/v1/dashboard/categories/route.js

import { NextResponse } from "next/server";

import ProductService from "@/services/product.service";

import {
    createCategorySchema,
} from "@/validations/product.validation";

import { getCurrentUser } from "@/lib/auth/get-current-user";

import AppError from "@/lib/errors/AppError";

import { withErrorHandling } from "@/lib/api/with-error-handling";

export const GET = withErrorHandling(async () => {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        throw new AppError(
            "Authentication required.",
            401,
            "UNAUTHORIZED"
        );
    }

    const { user } = currentUser;

    const categories =
        await ProductService.getCategories(
            user.id,
            user.accountId
        );

    return NextResponse.json({
        success: true,
        data: categories,
    });
});

export const POST = withErrorHandling(
    async (request) => {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            throw new AppError(
                "Authentication required.",
                401,
                "UNAUTHORIZED"
            );
        }

        const { user } = currentUser;

        const body = await request.json();

        const validatedData =
            createCategorySchema.parse(body);

        const category =
            await ProductService.createCategory(
                user.id,
                user.accountId,
                validatedData
            );

        return NextResponse.json(
            {
                success: true,
                data: category,
            },
            {
                status: 201,
            }
        );
    }
);