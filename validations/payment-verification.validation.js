
import { z } from "zod";

export const paymentVerificationSchema = z
    .object({
        bank: z
            .string()
            .trim()
            .toLowerCase()
            .min(1)
            .max(50)
            .optional(),

        reference: z
            .string()
            .trim()
            .min(1)
            .max(500)
            .optional(),

        accountNumber: z
            .string()
            .trim()
            .min(1)
            .max(50)
            .optional(),

        qrData: z
            .string()
            .trim()
            .min(1)
            .max(5000)
            .optional(),
    })
    .strict()
    .refine(
        (data) => Boolean(data.reference || data.qrData),
        {
            message:
                "A transaction reference or QR payload is required.",
            path: ["reference"],
        }
    );
