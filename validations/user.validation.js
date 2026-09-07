import { z } from "zod";

export const createEmployeeSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters.")
        .max(150, "Name must not exceed 150 characters."),

    phone: z
        .string()
        .trim()
        .min(1, "Phone number is required.")
        .max(30, "Phone number must not exceed 30 characters."),

    email: z
        .string()
        .trim()
        .email("Please provide a valid email address.")
        .max(255, "Email must not exceed 255 characters.")
        .optional()
        .or(z.literal("")),
});

export const updateEmployeeSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters.")
        .max(150, "Name must not exceed 150 characters."),

    phone: z
        .string()
        .trim()
        .min(1, "Phone number is required.")
        .max(30, "Phone number must not exceed 30 characters."),

    email: z
        .string()
        .trim()
        .email("Please provide a valid email address.")
        .max(255, "Email must not exceed 255 characters.")
        .optional()
        .or(z.literal("")),
});