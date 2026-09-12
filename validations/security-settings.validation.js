import { z } from "zod";

export const uuidSchema = z.string().uuid(
    "Invalid UUID."
);

export const changePasswordSchema = z
    .object({
        currentPassword: z
            .string()
            .min(
                1,
                "Current password is required."
            ),

        newPassword: z
            .string()
            .min(
                8,
                "New password must be at least 8 characters."
            )
            .max(
                128,
                "New password must not exceed 128 characters."
            ),

        confirmPassword: z
            .string()
            .min(
                1,
                "Please confirm your new password."
            ),
    })
    .refine(
        (data) =>
            data.newPassword === data.confirmPassword,
        {
            message: "Passwords do not match.",
            path: ["confirmPassword"],
        }
    );

export const revokeSessionSchema = z.object({
    sessionId: uuidSchema,
});

export const revokeOtherSessionsSchema = z.object({
    confirm: z.literal(true, {
        errorMap: () => ({
            message:
                "Confirmation is required.",
        }),
    }),
});