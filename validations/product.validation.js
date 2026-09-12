// file: validations/product.validation.js

import { z } from "zod";

const productNameSchema = z
    .string()
    .trim()
    .min(
        2,
        "Product name must be at least 2 characters."
    )
    .max(
        150,
        "Product name must not exceed 150 characters."
    );

const productDescriptionSchema = z
    .string()
    .trim()
    .max(
        5000,
        "Product description must not exceed 5000 characters."
    )
    .optional()
    .nullable();

const productTypeSchema = z.enum(
    ["public", "private"],
    {
        message:
            "Product type must be either public or private.",
    }
);

const productStatusSchema = z.enum(
    ["active", "inactive"],
    {
        message:
            "Status must be either active or inactive.",
    }
);

const productPriceSchema = z
    .number()
    .finite("Price must be a valid number.")
    .nonnegative("Price cannot be negative.")
    .refine(
        (value) => Number.isInteger(value * 100),
        {
            message:
                "Price must have at most 2 decimal places.",
        }
    );

const productFileSchema = z
    .instanceof(File, {
        message: "Invalid product image.",
    })
    .refine(
        (file) => file.type.startsWith("image/"),
        {
            message:
                "Product photos must be image files.",
        }
    )
    .refine(
        (file) => file.size <= 5 * 1024 * 1024,
        {
            message:
                "Each product photo must not exceed 5MB.",
        }
    );

const productStockSchema = z
    .number()
    .int("Stock must be a whole number.")
    .nonnegative("Stock cannot be negative.");

const productLowStockThresholdSchema = z
    .number()
    .int(
        "Low stock threshold must be a whole number."
    )
    .nonnegative(
        "Low stock threshold cannot be negative."
    );

export const productPhotosSchema = z
    .array(productFileSchema)
    .max(
        6,
        "A product can have a maximum of 6 photos."
    )
    .default([]);

export const createProductSchema = z
    .object({
        branchId: z.string().uuid(
            "Invalid branch ID."
        ),

        categoryId: z.string().uuid(
            "Invalid category ID."
        ),

        name: productNameSchema,

        description:
            productDescriptionSchema,

        type: productTypeSchema.default(
            "private"
        ),

        costPrice:
            productPriceSchema.default(0),

        sellingPrice:
            productPriceSchema.default(0),

        stock:
            productStockSchema.default(0),

        lowStockThreshold:
            productLowStockThresholdSchema.default(5),

        status:
            productStatusSchema.default(
                "active"
            ),

        photos: productPhotosSchema,

        purchase: z
            .object({
                paymentSource: z.enum(
                    [
                        "employee_personal",
                        "supplier_credit",
                        "other",
                    ],
                    {
                        message:
                            "Invalid purchase payment source.",
                    }
                ),

                notes: z
                    .string()
                    .trim()
                    .max(
                        1000,
                        "Purchase notes must not exceed 1000 characters."
                    )
                    .optional()
                    .nullable(),
            })
            .optional(),
    })
    .refine(
        (data) =>
            data.purchase === undefined ||
            data.stock > 0,
        {
            message:
                "Purchased product quantity must be greater than zero.",
            path: ["stock"],
        }
    );

export const updateProductSchema = z
    .object({
        branchId: z
            .string()
            .uuid("Invalid branch ID.")
            .optional(),

        categoryId: z
            .string()
            .uuid("Invalid category ID.")
            .optional(),

        name:
            productNameSchema.optional(),

        description:
            productDescriptionSchema,

        type:
            productTypeSchema.optional(),

        costPrice:
            productPriceSchema.optional(),

        sellingPrice:
            productPriceSchema.optional(),

        stock:
            productStockSchema.optional(),

        lowStockThreshold:
            productLowStockThresholdSchema.optional(),

        status:
            productStatusSchema.optional(),

        photos:
            z.array(productFileSchema)
                .max(
                    6,
                    "A product can have a maximum of 6 photos."
                )
                .optional(),
    })
    .refine(
        (data) =>
            data.branchId !== undefined ||
            data.categoryId !== undefined ||
            data.name !== undefined ||
            data.description !== undefined ||
            data.type !== undefined ||
            data.costPrice !== undefined ||
            data.sellingPrice !== undefined ||
            data.stock !== undefined ||
            data.lowStockThreshold !== undefined ||
            data.status !== undefined ||
            data.photos !== undefined,
        {
            message:
                "At least one field must be provided.",
        }
    );

export const updateProductStatusSchema =
    z.object({
        status: productStatusSchema,
    });

export const productIdSchema =
    z.string().uuid(
        "Invalid product ID."
    );

export const categoryIdSchema =
    z.string().uuid(
        "Invalid category ID."
    );

export const createCategorySchema =
    z.object({
        name: z
            .string()
            .trim()
            .min(
                2,
                "Category name must be at least 2 characters."
            )
            .max(
                100,
                "Category name must not exceed 100 characters."
            ),
    });

export const updateCategorySchema =
    z.object({
        name: z
            .string()
            .trim()
            .min(
                2,
                "Category name must be at least 2 characters."
            )
            .max(
                100,
                "Category name must not exceed 100 characters."
            )
            .optional(),
    })
        .refine(
            (data) =>
                data.name !== undefined,
            {
                message:
                    "At least one field must be provided.",
            }
        );

export const productListQuerySchema =
    z.object({
        page: z.coerce
            .number()
            .int(
                "Page must be a whole number."
            )
            .min(
                1,
                "Page must be at least 1."
            )
            .default(1),

        limit: z.coerce
            .number()
            .int(
                "Limit must be a whole number."
            )
            .min(
                1,
                "Limit must be at least 1."
            )
            .max(
                100,
                "Limit must not exceed 100."
            )
            .default(20),

        search: z
            .string()
            .trim()
            .max(
                150,
                "Search must not exceed 150 characters."
            )
            .optional(),

        branchId: z
            .string()
            .uuid("Invalid branch ID.")
            .optional(),

        categoryId: z
            .string()
            .uuid("Invalid category ID.")
            .optional(),

        status:
            productStatusSchema.optional(),

        type:
            productTypeSchema.optional(),
    });