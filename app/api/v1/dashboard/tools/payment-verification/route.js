
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import AppError from "@/lib/errors/AppError";
import { withErrorHandling } from "@/lib/api/with-error-handling";
import { rateLimit } from "@/lib/security/rate-limit";

import PaymentVerificationService from "@/services/payment-verification.service";
import { paymentVerificationSchema } from "@/validations/payment-verification.validation";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 12_000;

async function readJsonBody(request) {
    const contentLength = request.headers.get("content-length");

    if (
        contentLength &&
        (!/^\d+$/.test(contentLength) ||
            Number(contentLength) > MAX_BODY_BYTES)
    ) {
        throw new AppError(
            "Request body is too large or invalid.",
            413,
            "PAYMENT_VERIFICATION_BODY_TOO_LARGE"
        );
    }

    if (!request.body) {
        throw new AppError(
            "Request body is required.",
            400,
            "INVALID_JSON"
        );
    }

    const reader = request.body.getReader();
    const chunks = [];
    let totalBytes = 0;

    try {
        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            totalBytes += value.byteLength;

            if (totalBytes > MAX_BODY_BYTES) {
                await reader.cancel();

                throw new AppError(
                    "Request body is too large.",
                    413,
                    "PAYMENT_VERIFICATION_BODY_TOO_LARGE"
                );
            }

            chunks.push(value);
        }
    } finally {
        reader.releaseLock();
    }

    const bytes = new Uint8Array(totalBytes);
    let offset = 0;

    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
    }

    try {
        return JSON.parse(new TextDecoder().decode(bytes));
    } catch {
        throw new AppError(
            "Invalid JSON request body.",
            400,
            "INVALID_JSON"
        );
    }
}

export const POST = withErrorHandling(async (request) => {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        throw new AppError(
            "Authentication required.",
            401,
            "UNAUTHORIZED"
        );
    }

    const { user } = currentUser;

    // Limits both the individual user and the source IP.
    // The existing limiter includes the IP in each Redis key.
    const [userLimit, ipLimit] = await Promise.all([
        rateLimit(request, {
            key: `payment-verification-user-${user.id}`,
            limit: 10,
            windowSeconds: 60,
        }),
        rateLimit(request, {
            key: "payment-verification-ip",
            limit: 30,
            windowSeconds: 60,
        }),
    ]);

    if (!userLimit.allowed || !ipLimit.allowed) {
        const retryAfter = Math.max(
            userLimit.allowed ? 0 : userLimit.retryAfter,
            ipLimit.allowed ? 0 : ipLimit.retryAfter
        );

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: "RATE_LIMITED",
                    message:
                        "Too many verification requests. Please try again later.",
                },
            },
            {
                status: 429,
                headers: {
                    "Retry-After": String(retryAfter),
                    "Cache-Control": "no-store",
                },
            }
        );
    }

    const body = await readJsonBody(request);
    const input = paymentVerificationSchema.parse(body);

    const data = await PaymentVerificationService.verifyPayment(
        input,
        {
            userId: user.id,
            accountId: user.accountId,
        }
    );

    return NextResponse.json(
        {
            success: true,
            data,
        },
        {
            headers: {
                "Cache-Control": "no-store",
            },
        }
    );
});
