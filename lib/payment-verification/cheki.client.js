
import AppError from "@/lib/errors/AppError";

const CHEKI_BASE_URL = "https://cheki.et";
const REQUEST_TIMEOUT_MS = 65_000;

export async function verifyChekiReceipt(data) {
    const payload = {};

    if (data.bank) payload.bank = data.bank;
    if (data.reference) payload.reference = data.reference;
    if (data.accountNumber) {
        payload.accountNumber = data.accountNumber;
    }
    if (data.qrData) payload.qrData = data.qrData;

    let response;

    try {
        response = await fetch(
            `${CHEKI_BASE_URL}/api/verify`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(payload),
                cache: "no-store",
                redirect: "error",
                signal: AbortSignal.timeout(
                    REQUEST_TIMEOUT_MS
                ),
            }
        );
    } catch (error) {
        if (
            error?.name === "TimeoutError" ||
            error?.name === "AbortError"
        ) {
            throw new AppError(
                "Verification timed out. Try again later.",
                504,
                "PAYMENT_VERIFICATION_TIMEOUT"
            );
        }

        throw new AppError(
            "The payment verification provider is unavailable.",
            502,
            "PAYMENT_PROVIDER_UNAVAILABLE"
        );
    }

    if (response.status === 429) {
        throw new AppError(
            "Too many verification requests. Try again later.",
            429,
            "PAYMENT_VERIFICATION_RATE_LIMITED"
        );
    }

    if (!response.ok) {
        throw new AppError(
            "The provider could not verify this receipt.",
            502,
            "PAYMENT_PROVIDER_ERROR"
        );
    }

    let result;

    try {
        result = await response.json();
    } catch {
        throw new AppError(
            "The provider returned an invalid response.",
            502,
            "INVALID_PAYMENT_PROVIDER_RESPONSE"
        );
    }

    if (
        !result ||
        typeof result !== "object" ||
        Array.isArray(result) ||
        typeof result.success !== "boolean" ||
        (
            result.verified !== undefined &&
            typeof result.verified !== "boolean"
        )
    ) {
        throw new AppError(
            "The provider returned an unexpected response.",
            502,
            "INVALID_PAYMENT_PROVIDER_RESPONSE"
        );
    }

    return result;
}
