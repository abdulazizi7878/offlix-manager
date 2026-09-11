// validations/money.validation.js

import { z } from "zod";

// ============================================================
// SHARED MONEY SCHEMA
// ============================================================

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

// ============================================================
// MONEY ACCOUNT
// ============================================================

export const createMoneyAccountSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Money account name is required.")
        .max(
            150,
            "Money account name must not exceed 150 characters."
        ),

    type: z.enum(
        ["cash", "bank", "mobile_money"],
        {
            message:
                "Money account type must be cash, bank, or mobile money.",
        }
    ),
});

export const updateMoneyAccountSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Money account name is required.")
        .max(
            150,
            "Money account name must not exceed 150 characters."
        )
        .optional(),

    type: z
        .enum(
            ["cash", "bank", "mobile_money"],
            {
                message:
                    "Money account type must be cash, bank, or mobile money.",
            }
        )
        .optional(),

    status: z
        .enum(
            ["active", "inactive"],
            {
                message:
                    "Money account status must be active or inactive.",
            }
        )
        .optional(),
});

export const moneyAccountIdSchema =
    z.string().uuid("Invalid money account ID.");

export const moneyAccountListQuerySchema = z.object({
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

    type: z
        .enum([
            "cash",
            "bank",
            "mobile_money",
        ])
        .optional(),

    status: z
        .enum([
            "active",
            "inactive",
        ])
        .optional(),
});

// ============================================================
// TRANSACTIONS
// ============================================================

export const createTransactionSchema = z.object({
    moneyAccountId: z
        .string()
        .uuid("Invalid money account ID."),

    type: z.enum(
        [
            "income",
            "expense",
            "deposit",
            "withdrawal",
            "payment",
            "credit",
            "settlement",
            "other",
        ],
        {
            message:
                "Invalid transaction type.",
        }
    ),

    direction: z.enum(
        ["in", "out"],
        {
            message:
                "Transaction direction must be in or out.",
        }
    ),

    amount: moneySchema,

    description: z
        .string()
        .trim()
        .max(
            5000,
            "Description must not exceed 5000 characters."
        )
        .optional()
        .nullable(),
});

export const transactionIdSchema =
    z.string().uuid("Invalid transaction ID.");

export const transactionListQuerySchema = z.object({
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

    moneyAccountId: z
        .string()
        .uuid("Invalid money account ID.")
        .optional(),

    type: z
        .enum([
            "income",
            "expense",
            "deposit",
            "withdrawal",
            "payment",
            "settlement",
            "other",
        ])
        .optional(),

    direction: z
        .enum([
            "in",
            "out",
        ])
        .optional(),

    search: z
        .string()
        .trim()
        .max(150)
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

// ============================================================
// TRANSFERS
// ============================================================

export const createTransferSchema = z.object({
    fromMoneyAccountId: z
        .string()
        .uuid("Invalid source money account ID."),

    toMoneyAccountId: z
        .string()
        .uuid("Invalid destination money account ID."),

    amount: moneySchema,

    notes: z
        .string()
        .trim()
        .max(
            5000,
            "Notes must not exceed 5000 characters."
        )
        .optional()
        .nullable(),
}).superRefine((data, ctx) => {
    if (
        data.fromMoneyAccountId ===
        data.toMoneyAccountId
    ) {
        ctx.addIssue({
            code: "custom",
            path: ["toMoneyAccountId"],
            message:
                "Source and destination accounts must be different.",
        });
    }
});

export const transferIdSchema =
    z.string().uuid("Invalid transfer ID.");

export const transferListQuerySchema = z.object({
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

    moneyAccountId: z
        .string()
        .uuid("Invalid money account ID.")
        .optional(),

    search: z
        .string()
        .trim()
        .max(150)
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

// ============================================================
// SETTLEMENTS
// ============================================================

export const settlementIdSchema =
    z.string().uuid("Invalid settlement ID.");

export const settlementListQuerySchema = z.object({
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

    branchId: z
        .string()
        .uuid("Invalid branch ID.")
        .optional(),

    status: z
        .enum([
            "pending",
            "requested",
            "received",
            "cancelled",
        ])
        .optional(),
});

export const acceptSettlementSchema = z
    .object({
        moneyAccountId: z
            .string()
            .uuid("Invalid money account ID."),

        amount: moneySchema.optional(),

        full: z
            .boolean()
            .optional()
            .default(false),

        notes: z
            .string()
            .trim()
            .max(
                5000,
                "Notes must not exceed 5000 characters."
            )
            .optional()
            .nullable(),
    })
    .superRefine((data, ctx) => {
        if (!data.full && data.amount === undefined) {
            ctx.addIssue({
                code: "custom",
                path: ["amount"],
                message:
                    "Amount is required unless the full settlement is being accepted.",
            });
        }

        if (data.full && data.amount !== undefined) {
            ctx.addIssue({
                code: "custom",
                path: ["amount"],
                message:
                    "Do not provide an amount when accepting the full remaining settlement.",
            });
        }
    });

// ============================================================
// PAYABLES
// ============================================================

export const createPayableSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Payable name is required.")
        .max(
            150,
            "Payable name must not exceed 150 characters."
        ),

    description: z
        .string()
        .trim()
        .max(
            5000,
            "Description must not exceed 5000 characters."
        )
        .optional()
        .nullable(),

    amount: moneySchema,

    dueDate: z
        .coerce
        .date()
        .optional()
        .nullable(),
});

export const payableIdSchema =
    z.string().uuid("Invalid payable ID.");

export const payableListQuerySchema = z.object({
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

    status: z
        .enum([
            "pending",
            "partial",
            "paid",
            "cancelled",
        ])
        .optional(),

    search: z
        .string()
        .trim()
        .max(150)
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

export const payPayableSchema = z
    .object({
        moneyAccountId: z
            .string()
            .uuid("Invalid money account ID."),

        amount: moneySchema.optional(),

        full: z
            .boolean()
            .optional()
            .default(false),

        notes: z
            .string()
            .trim()
            .max(
                5000,
                "Notes must not exceed 5000 characters."
            )
            .optional()
            .nullable(),
    })
    .superRefine((data, ctx) => {
        if (!data.full && data.amount === undefined) {
            ctx.addIssue({
                code: "custom",
                path: ["amount"],
                message:
                    "Amount is required unless the full payable is being paid.",
            });
        }

        if (data.full && data.amount !== undefined) {
            ctx.addIssue({
                code: "custom",
                path: ["amount"],
                message:
                    "Do not provide an amount when paying the full remaining payable.",
            });
        }
    });

// ============================================================
// CREDITS
// ============================================================


export const createCreditSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Credit name is required.")
        .max(
            150,
            "Credit name must not exceed 150 characters."
        ),

    description: z
        .string()
        .trim()
        .max(
            5000,
            "Description must not exceed 5000 characters."
        )
        .optional()
        .nullable(),

    amount: moneySchema,

    moneyAccountId: z
        .string()
        .uuid("Invalid money account ID."),

    dueDate: z
        .coerce
        .date()
        .optional()
        .nullable(),
});

export const creditIdSchema =
    z.string().uuid("Invalid credit ID.");

export const creditListQuerySchema = z.object({
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

    status: z
        .enum([
            "pending",
            "partial",
            "paid",
            "cancelled",
        ])
        .optional(),

    search: z
        .string()
        .trim()
        .max(150)
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

export const receiveCreditPaymentSchema = z
    .object({
        moneyAccountId: z
            .string()
            .uuid("Invalid money account ID."),

        amount: moneySchema.optional(),

        full: z
            .boolean()
            .optional()
            .default(false),

        notes: z
            .string()
            .trim()
            .max(
                5000,
                "Notes must not exceed 5000 characters."
            )
            .optional()
            .nullable(),
    })
    .superRefine((data, ctx) => {
        if (!data.full && data.amount === undefined) {
            ctx.addIssue({
                code: "custom",
                path: ["amount"],
                message:
                    "Amount is required unless the full credit is being received.",
            });
        }

        if (data.full && data.amount !== undefined) {
            ctx.addIssue({
                code: "custom",
                path: ["amount"],
                message:
                    "Do not provide an amount when receiving the full remaining credit.",
            });
        }
    });

// ============================================================
// TOTAL MONEY
// ============================================================

export const totalMoneyQuerySchema = z.object({});
