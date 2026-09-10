
// validations/sale.validation.js


import { z } from "zod";

const moneySchema = z
    .number()
    .finite("Amount must be a valid number.")
    .positive("Amount must be greater than zero.")
    .refine(
        (value) => Number.isInteger(value * 100),
        {
            message:
                "Amount must have at most 2 decimal places.",
        }
    );

export const saleItemSchema = z.object({
    productId: z.string().uuid(
        "Invalid product ID."
    ),

    quantity: z
        .number()
        .int(
            "Quantity must be a whole number."
        )
        .positive(
            "Quantity must be greater than zero."
        ),

    pricePerItem: moneySchema,
});

export const createSaleSchema = z
    .object({
        branchId: z.string().uuid(
            "Invalid branch ID."
        ),

        customerName: z
            .string()
            .trim()
            .max(
                150,
                "Customer name must not exceed 150 characters."
            )
            .optional()
            .nullable(),

        notes: z
            .string()
            .trim()
            .max(
                5000,
                "Notes must not exceed 5000 characters."
            )
            .optional()
            .nullable(),

        items: z
            .array(saleItemSchema)
            .min(
                1,
                "A sale must contain at least one item."
            ),

        paymentType: z.enum(
            ["paid", "partial", "credit"],
            {
                message:
                    "Payment type must be paid, partial, or credit.",
            }
        ),

        paymentMethod: z
            .enum(["cash", "bank"], {
                message:
                    "Payment method must be cash or bank.",
            })
            .optional(),

        paidAmount: moneySchema
            .optional()
            .default(0),

        dueAt: z
            .coerce
            .date()
            .optional()
            .nullable(),
    })
    .superRefine((data, ctx) => {
        if (
            data.paymentType === "paid" ||
            data.paymentType === "partial"
        ) {
            if (!data.paymentMethod) {
                ctx.addIssue({
                    code: "custom",
                    path: ["paymentMethod"],
                    message:
                        "Payment method is required.",
                });
            }

            if (data.paidAmount <= 0) {
                ctx.addIssue({
                    code: "custom",
                    path: ["paidAmount"],
                    message:
                        "Paid amount must be greater than zero.",
                });
            }
        }

        if (
            data.paymentType === "credit" &&
            data.paidAmount > 0
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["paidAmount"],
                message:
                    "Credit sales cannot contain a payment.",
            });
        }

        if (
            data.paymentType === "credit" &&
            data.paymentMethod
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["paymentMethod"],
                message:
                    "Credit sales cannot contain a payment method.",
            });
        }
    });

export const saleIdSchema =
    z.string().uuid("Invalid sale ID.");

export const saleListQuerySchema = z.object({
    page: z.coerce
        .number()
        .int()
        .min(1)
        .default(1),

    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .default(20),

    search: z
        .string()
        .trim()
        .max(150)
        .optional(),

    branchId: z
        .string()
        .uuid("Invalid branch ID.")
        .optional(),

    employeeId: z
        .string()
        .uuid("Invalid employee ID.")
        .optional(),

    paymentStatus: z
        .enum([
            "credit",
            "partial",
            "paid",
        ])
        .optional(),

    dateFrom: z
        .coerce
        .date()
        .optional(),

    dateTo: z
        .coerce
        .date()
        .optional(),
});