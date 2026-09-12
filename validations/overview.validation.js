// file: validations/overview.validation.js

import { z } from "zod";

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DATE_REGEX =
    /^\d{4}-\d{2}-\d{2}$/;

const PERIODS = [
    "today",
    "week",
    "month",
    "three_months",
    "year",
    "all_time",
    "custom",
];

function isValidDateOnly(value) {
    if (!DATE_REGEX.test(value)) {
        return false;
    }

    const [year, month, day] =
        value.split("-").map(Number);

    const date = new Date(
        year,
        month - 1,
        day
    );

    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );
}

const dateSchema = z
    .string()
    .regex(
        DATE_REGEX,
        "Date must use YYYY-MM-DD format."
    )
    .refine(
        isValidDateOnly,
        "Invalid calendar date."
    );

export const overviewQuerySchema = z
    .object({
        period: z
            .enum(PERIODS)
            .default("today"),

        date: dateSchema.optional(),

        branchId: z
            .string()
            .regex(
                UUID_REGEX,
                "branchId must be a valid UUID."
            )
            .optional()
            .nullable(),

        from: dateSchema.optional(),

        to: dateSchema.optional(),

        page: z.coerce
            .number()
            .int("page must be an integer.")
            .min(
                1,
                "page must be at least 1."
            )
            .default(1),

        limit: z.coerce
            .number()
            .int("limit must be an integer.")
            .min(
                1,
                "limit must be at least 1."
            )
            .max(
                100,
                "limit cannot exceed 100."
            )
            .default(10),
    })
    .superRefine((data, ctx) => {
        if (data.period === "custom") {
            if (!data.from) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["from"],
                    message:
                        "from is required for custom period.",
                });
            }

            if (!data.to) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["to"],
                    message:
                        "to is required for custom period.",
                });
            }
        }

        if (data.period !== "custom") {
            if (data.from) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["from"],
                    message:
                        "from can only be used with custom period.",
                });
            }

            if (data.to) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["to"],
                    message:
                        "to can only be used with custom period.",
                });
            }
        }

        if (
            data.period === "custom" &&
            data.from &&
            data.to &&
            data.from >= data.to
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["to"],
                message:
                    "to must be later than from.",
            });
        }
    });

export function validateOverviewQuery(query) {
    return overviewQuerySchema.parse(query);
}