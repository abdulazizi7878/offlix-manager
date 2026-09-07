import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(150, "Name must not exceed 150 characters."),

  accountName: z
    .string()
    .trim()
    .min(2, "Business name must be at least 2 characters.")
    .max(150, "Business name must not exceed 150 characters."),

  email: z
    .string()
    .trim()
    .email("Please enter a valid email address.")
    .max(255)
    .transform((value) => value.toLowerCase()),

  phone: z
    .string()
    .trim()
    .min(7, "Invalid phone number.")
    .max(30, "Phone number must not exceed 30 characters.")
    .optional()
    .or(z.literal("")),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password must not exceed 128 characters."),
});

export const loginSchema = z.object({
  login: z
    .string()
    .trim()
    .min(1, "Enter your email, username, or phone."),

  password: z
    .string()
    .min(1, "Password is required."),
});

export const verifyOtpSchema = z.object({
  userId: z
    .string()
    .uuid("Invalid user identifier."),

  otp: z
    .string()
    .regex(/^\d{6}$/, "Verification code must be 6 digits."),
});

export const resendOtpSchema = z.object({
  userId: z
    .string()
    .uuid("Invalid user identifier."),
});