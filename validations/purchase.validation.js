// file: validations/purchase.validation.js

import { z } from "zod";

const uuidSchema = z
    .string()
    .uuid("Invalid UUID.");

export const purchaseListQuerySchema = z
    .object({
        page: z.coerce
            .number()
            .int("Page must be an integer.")
            .min(1, "Page must be at least 1.")
            .default(1),

        limit: z.coerce
            .number()
            .int("Limit must be an integer.")
            .min(1, "Limit must be at least 1.")
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
            .optional()
            .nullable(),

        branchId: uuidSchema
            .optional()
            .nullable(),

        productId: uuidSchema
            .optional()
            .nullable(),

        paymentSource: z
            .enum([
                "employee_personal",
                "supplier_credit",
                "other",
            ], {
                message:
                    "Invalid purchase payment source.",
            })
            .optional()
            .nullable(),

        from: z
            .string()
            .datetime({
                offset: true,
                message:
                    "Invalid start date.",
            })
            .optional()
            .nullable(),

        to: z
            .string()
            .datetime({
                offset: true,
                message:
                    "Invalid end date.",
            })
            .optional()
            .nullable(),
    })
    .refine(
        (data) => {
            if (!data.from || !data.to) {
                return true;
            }

            return (
                new Date(data.from) <=
                new Date(data.to)
            );
        },
        {
            message:
                "Start date must be before or equal to end date.",
            path: ["from"],
        }
    );