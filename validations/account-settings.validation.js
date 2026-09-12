import { z } from "zod";

const uuidSchema = z.string().uuid("Invalid UUID.");

const accountUpdateSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Account name is required.")
        .max(150, "Account name must not exceed 150 characters."),
});

const profileUpdateSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Name is required.")
        .max(150, "Name must not exceed 150 characters.")
        .optional(),

    email: z
        .string()
        .trim()
        .email("Invalid email address.")
        .max(255, "Email must not exceed 255 characters.")
        .optional(),

    phone: z
        .string()
        .trim()
        .max(30, "Phone must not exceed 30 characters.")
        .nullable()
        .optional(),

    username: z
        .string()
        .trim()
        .min(3, "Username must be at least 3 characters.")
        .max(50, "Username must not exceed 50 characters.")
        .optional(),

    bio: z
        .string()
        .max(2000, "Bio must not exceed 2000 characters.")
        .nullable()
        .optional(),

    profileImageKey: z
        .string()
        .max(500, "Profile image key must not exceed 500 characters.")
        .nullable()
        .optional(),
});

const preferencesUpdateSchema = z.object({
    currency: z
        .string()
        .trim()
        .min(1, "Currency is required.")
        .max(10, "Currency must not exceed 10 characters.")
        .optional(),

    timezone: z
        .string()
        .trim()
        .min(1, "Timezone is required.")
        .max(100, "Timezone must not exceed 100 characters.")
        .optional(),

    dateFormat: z
        .string()
        .trim()
        .min(1, "Date format is required.")
        .max(30, "Date format must not exceed 30 characters.")
        .optional(),
});

export const updateAccountSettingsSchema = z
    .object({
        account: accountUpdateSchema.optional(),
        profile: profileUpdateSchema.optional(),
        preferences: preferencesUpdateSchema.optional(),
    })
    .refine(
        (data) =>
            data.account !== undefined ||
            data.profile !== undefined ||
            data.preferences !== undefined,
        {
            message: "At least one settings section is required.",
        }
    );

export { uuidSchema };

export const requestEmailChangeSchema = z.object({
    email: z
        .string()
        .trim()
        .email("Please enter a valid email address.")
        .max(255),
});

export const verifyEmailChangeSchema = z.object({
    otp: z
        .string()
        .regex(
            /^\d{6}$/,
            "OTP must be exactly 6 digits."
        ),

    verificationToken: z
        .string()
        .min(1, "Verification token is required."),
});