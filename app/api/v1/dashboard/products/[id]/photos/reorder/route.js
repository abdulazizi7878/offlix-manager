import { NextResponse } from "next/server";
import { z } from "zod";

import ProductService from "@/services/product.service";
import { getCurrentUser } from "@/lib/auth/get-current-user";

const reorderSchema = z.object({
    photoIds: z
        .array(z.string().uuid())
        .min(1)
        .max(6),
});

export async function PATCH(
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

        const { id } = await params;

        const productId = z
            .string()
            .uuid()
            .parse(id);

        const body = await request.json();

        const { photoIds } =
            reorderSchema.parse(body);

        const result =
            await ProductService.reorderProductPhotos(
                user.user.id,
                user.user.accountId,
                productId,
                photoIds
            );

        return NextResponse.json(result);
    } catch (error) {
        console.error(
            "PATCH product photo reorder error:",
            error
        );

        return NextResponse.json(
            {
                message:
                    error?.message ||
                    "Failed to reorder product photos",
            },
            {
                status: error?.statusCode || 500,
            }
        );
    }
}