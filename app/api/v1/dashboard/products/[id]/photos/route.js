
// file: app/api/v1/dashboard/products/[id]/photos/route.js

import { NextResponse } from "next/server";
import { z } from "zod";

import ProductService from "@/services/product.service";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { productPhotosSchema } from "@/validations/product.validation";

export async function POST(request, { params }) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;

        const productId = z
            .string()
            .uuid()
            .parse(id);

        const formData = await request.formData();

        const files = formData
            .getAll("photos")
            .filter((value) => value instanceof File);

        productPhotosSchema.parse(files);

        const result =
            await ProductService.addProductPhotos(
                user.user.id,
                user.user.accountId,
                productId,
                files
            );

        return NextResponse.json(
            result,
            { status: 201 }
        );
    } catch (error) {
        console.error(
            "POST product photos error:",
            error
        );

        return NextResponse.json(
            {
                message:
                    error?.message ||
                    "Failed to add product photos",
            },
            {
                status: error?.statusCode || 500,
            }
        );
    }
}