import { NextResponse } from "next/server";

import ProductService from "@/services/product.service";

import {
    createProductSchema,
    productListQuerySchema,
} from "@/validations/product.validation";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import AppError from "@/lib/errors/AppError";
import { withErrorHandling } from "@/lib/api/with-error-handling";

export const POST = withErrorHandling(async (request) => {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        throw new AppError(
            "Authentication required.",
            401,
            "UNAUTHORIZED"
        );
    }

    const { user } = currentUser;

    const formData = await request.formData();

    const photos = formData
        .getAll("photos")
        .filter((value) => value instanceof File);

    const rawData = {
        branchId: formData.get("branchId"),
        categoryId: formData.get("categoryId"),
        name: formData.get("name"),
        slug: formData.get("slug"),
        description: formData.get("description") || null,
        type: formData.get("type") || "private",
        costPrice: Number(formData.get("costPrice") || 0),
        sellingPrice: Number(
            formData.get("sellingPrice") || 0
        ),
        status: formData.get("status") || "active",
        photos,
    };

    const validatedData =
        createProductSchema.parse(rawData);

    const product =
        await ProductService.createProduct(
            user.id,
            user.accountId,
            validatedData
        );

    return NextResponse.json(
        {
            success: true,
            data: product,
        },
        {
            status: 201,
        }
    );
});

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
        page: searchParams.get("page") ?? undefined,
        limit: searchParams.get("limit") ?? undefined,
        search: searchParams.get("search") ?? undefined,
        branchId:
            searchParams.get("branchId") ?? undefined,
        categoryId:
            searchParams.get("categoryId") ?? undefined,
        status:
            searchParams.get("status") ?? undefined,
        type:
            searchParams.get("type") ?? undefined,
    };

    const validatedQuery =
        productListQuerySchema.parse(query);

    const result =
        await ProductService.getProducts(
            user.id,
            user.accountId,
            validatedQuery
        );

    return NextResponse.json({
        success: true,
        data: result,
    });
});