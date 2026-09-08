import { NextResponse } from "next/server";

import ProductService from "@/services/product.service";

import {
    productIdSchema,
    updateProductSchema,
} from "@/validations/product.validation";

import { getCurrentUser } from "@/lib/auth/get-current-user";

import AppError from "@/lib/errors/AppError";

import { withErrorHandling } from "@/lib/api/with-error-handling";

function getOptionalFormValue(formData, key) {
    const value = formData.get(key);

    if (value === null) {
        return undefined;
    }

    if (typeof value !== "string") {
        return undefined;
    }

    return value;
}

function getNumberFormValue(
    formData,
    key
) {
    const value = formData.get(key);

    if (value === null || value === "") {
        return undefined;
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        throw new AppError(
            `${key} must be a valid number.`,
            400,
            "VALIDATION_ERROR"
        );
    }

    return number;
}

function getFiles(formData, key) {
    return formData
        .getAll(key)
        .filter(
            (value) =>
                value instanceof File &&
                value.size > 0
        );
}

function buildUpdateData(formData) {
    const data = {};

    const branchId =
        getOptionalFormValue(
            formData,
            "branchId"
        );

    if (branchId !== undefined) {
        data.branchId = branchId;
    }

    const categoryId =
        getOptionalFormValue(
            formData,
            "categoryId"
        );

    if (categoryId !== undefined) {
        data.categoryId = categoryId;
    }

    const name =
        getOptionalFormValue(
            formData,
            "name"
        );

    if (name !== undefined) {
        data.name = name;
    }

    const slug =
        getOptionalFormValue(
            formData,
            "slug"
        );

    if (slug !== undefined) {
        data.slug = slug;
    }

    const description =
        getOptionalFormValue(
            formData,
            "description"
        );

    if (description !== undefined) {
        data.description = description;
    }

    const type =
        getOptionalFormValue(
            formData,
            "type"
        );

    if (type !== undefined) {
        data.type = type;
    }

    const status =
        getOptionalFormValue(
            formData,
            "status"
        );

    if (status !== undefined) {
        data.status = status;
    }

    const costPrice =
        getNumberFormValue(
            formData,
            "costPrice"
        );

    if (costPrice !== undefined) {
        data.costPrice = costPrice;
    }

    const sellingPrice =
        getNumberFormValue(
            formData,
            "sellingPrice"
        );

    if (sellingPrice !== undefined) {
        data.sellingPrice = sellingPrice;
    }

    /*
     * Important:
     *
     * We need to distinguish:
     *
     * photos field absent
     *      => don't modify photos
     *
     * photos field present but empty
     *      => replace photos with zero photos
     *
     * Since multipart FormData doesn't give us a
     * reliable "array field exists" primitive, we use
     * a dedicated `replacePhotos` field.
     */
    const replacePhotos = formData.get("replacePhotos");

    if (replacePhotos === "true") {
        data.photos = getFiles(formData, "photos");
    }

    return data;
}

export const GET = withErrorHandling(
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

        const product =
            await ProductService.getProduct(
                user.id,
                user.accountId,
                productId
            );

        return NextResponse.json({
            success: true,
            data: product,
        });
    }
);

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

        const formData =
            await request.formData();

        const body =
            buildUpdateData(formData);

        const validatedData =
            updateProductSchema.parse(body);

        const product =
            await ProductService.updateProduct(
                user.id,
                user.accountId,
                productId,
                validatedData
            );

        return NextResponse.json({
            success: true,
            data: product,
        });
    }
);