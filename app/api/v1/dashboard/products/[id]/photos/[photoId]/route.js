
// file: app/api/v1/dashboard/products/[id]/photos/[photoId]/route.js

import { NextResponse } from "next/server";
import { z } from "zod";

import ProductService from "@/services/product.service";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function DELETE(
    request,
    { params }
) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id, photoId } = await params;

        const productId = z
            .string()
            .uuid()
            .parse(id);

        const parsedPhotoId = z
            .string()
            .uuid()
            .parse(photoId);

        const result =
            await ProductService.deleteProductPhoto(
                user.user.id,
                user.user.accountId,
                productId,
                parsedPhotoId
            );

        return NextResponse.json(result);
    } catch (error) {
        console.error(
            "DELETE product photo error:",
            error
        );

        return NextResponse.json(
            {
                message:
                    error?.message ||
                    "Failed to delete product photo",
            },
            {
                status: error?.statusCode || 500,
            }
        );
    }
}