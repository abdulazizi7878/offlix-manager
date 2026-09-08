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

export const createFinancialAccountSchema =
    z.object({
        branchId: z
            .string()
            .uuid("Invalid branch ID.")
            .nullable()
            .optional(),

        type: z.enum(["cash", "bank"], {
            message:
                "Account type must be cash or bank.",
        }),

        name: z
            .string()
            .trim()
            .min(2)
            .max(150),

        bankName: z
            .string()
            .trim()
            .max(150)
            .nullable()
            .optional(),

        accountIdentifier: z
            .string()
            .trim()
            .max(150)
            .nullable()
            .optional(),
    })
        .superRefine((data, ctx) => {
            if (
                data.type === "bank" &&
                !data.bankName
            ) {
                ctx.addIssue({
                    code: "custom",
                    path: ["bankName"],
                    message:
                        "Bank name is required for bank accounts.",
                });
            }

            if (
                data.type === "cash" &&
                data.bankName
            ) {
                ctx.addIssue({
                    code: "custom",
                    path: ["bankName"],
                    message:
                        "Cash accounts cannot have a bank name.",
                });
            }
        });

export const financialAccountIdSchema =
    z.string().uuid(
        "Invalid financial account ID."
    );

export const financialAccountListQuerySchema =
    z.object({
        branchId: z
            .string()
            .uuid("Invalid branch ID.")
            .optional(),
    });

export const receivableListQuerySchema =
    z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        branchId: z.string().uuid().optional(),
        search: z.string().trim().max(150).optional(),
        status: z
            .enum(["open", "partial", "paid", "cancelled"])
            .optional(),
    });

export const receivableIdSchema =
    z.string().uuid("Invalid receivable ID.");

export const createReceivablePaymentSchema =
    z.object({
        amount: moneySchema,
        paymentMethod: z.enum(["cash", "bank"]),
        financialAccountId: z.string().uuid(),
    });

export const createPayableSchema = z.object({
    branchId: z.string().uuid().nullable().optional(),

    partyName: z
        .string()
        .trim()
        .min(2)
        .max(150),

    originalAmount: moneySchema,

    description: z
        .string()
        .trim()
        .max(5000)
        .nullable()
        .optional(),

    dueAt: z.coerce.date().nullable().optional(),
});

export const payableIdSchema =
    z.string().uuid("Invalid payable ID.");

export const createPayablePaymentSchema =
    z.object({
        amount: moneySchema,
        financialAccountId: z.string().uuid(),
    });

export const settlementListQuerySchema =
    z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        branchId: z.string().uuid().optional(),
        status: z
            .enum([
                "pending",
                "requested",
                "received",
                "cancelled",
            ])
            .optional(),
    });

export const createSettlementSchema =
    z.object({
        branchId: z.string().uuid(),
        amount: moneySchema,
        notes: z
            .string()
            .trim()
            .max(5000)
            .nullable()
            .optional(),
    });

export const settlementIdSchema =
    z.string().uuid("Invalid settlement ID.");

export const receiveSettlementSchema =
    z.object({
        sourceFinancialAccountId:
            z.string().uuid(
                "Invalid source financial account ID."
            ),

        receivingFinancialAccountId:
            z.string().uuid(
                "Invalid receiving financial account ID."
            ),
    });