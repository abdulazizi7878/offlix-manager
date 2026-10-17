import AppError from "@/lib/errors/AppError";
import { verifyChekiReceipt } from "@/lib/payment-verification/cheki.client";
import PaymentVerificationRepository from "@/repositories/payment-verification.repository";

function normalizeAmount(value) {
    if (
        typeof value !== "number" &&
        typeof value !== "string"
    ) {
        return null;
    }

    const amount = Number(value);

    return Number.isFinite(amount) && amount > 0
        ? amount
        : null;
}

function normalizeReference(value) {
    if (typeof value !== "string") {
        return null;
    }

    const reference = value.trim();

    return reference.length > 0 && reference.length <= 500
        ? reference
        : null;
}

function normalizeBankCode(value) {
    if (typeof value !== "string") {
        return null;
    }

    const bankCode = value.trim().toLowerCase();

    return /^[a-z0-9_-]{1,50}$/.test(bankCode)
        ? bankCode
        : null;
}

class PaymentVerificationService {
    static async verifyPayment(input, identity) {
        let providerResult;

        try {
            providerResult = await verifyChekiReceipt(input);
        } catch (error) {
            // Do not log the input. It may contain a receipt URL,
            // transaction reference, or sensitive QR data.
            if (error instanceof AppError) {
                throw error;
            }

            throw new AppError(
                "The payment verification provider is unavailable.",
                502,
                "PAYMENT_PROVIDER_UNAVAILABLE"
            );
        }

        const verified = providerResult?.verified === true;
        const bankCode = normalizeBankCode(
            providerResult?.bankCode ?? input.bank
        );
        const reference = normalizeReference(
            providerResult?.reference
        );
        const amount = normalizeAmount(
            providerResult?.amount
        );
        const currency =
            typeof providerResult?.currency === "string" &&
                /^[A-Z]{3}$/.test(providerResult.currency)
                ? providerResult.currency
                : "ETB";

        // Never return a verified result without the details needed
        // to audit it and check for reuse.
        const canSafelyRecord =
            verified &&
            bankCode &&
            reference &&
            amount !== null;

        const status = canSafelyRecord
            ? "VERIFIED"
            : providerResult?.success === true
                ? "NOT_VERIFIED"
                : "PROVIDER_ERROR";

        const audit = await PaymentVerificationRepository.recordResult({
            accountId: identity.accountId,
            userId: identity.userId,
            bankCode,
            reference,
            status,
            amount: canSafelyRecord ? amount : null,
            currency: canSafelyRecord ? currency : null,
            errorCode: status === "PROVIDER_ERROR"
                ? "PROVIDER_DID_NOT_CONFIRM"
                : null,
        });

        if (audit.duplicate) {
            return {
                status: "DUPLICATE",
                verified: false,
                message:
                    "This transaction reference has already been verified. Check the original transaction before proceeding.",
            };
        }

        if (!canSafelyRecord) {
            return {
                status: "NOT_VERIFIED",
                verified: false,
                message: providerResult?.decodedOnly === true
                    ? "The QR code was decoded, but the bank did not confirm the payment."
                    : "The payment could not be safely confirmed. Check the receipt details and try again.",
            };
        }

        return {
            status: "VERIFIED",
            verified: true,
            message: "The provider confirmed the transaction.",
            bankCode,
            bank: typeof providerResult.bank === "string"
                ? providerResult.bank
                : bankCode,
            reference,
            amount,
            currency,
            senderName: typeof providerResult.senderName === "string"
                ? providerResult.senderName
                : null,
            receiverName: typeof providerResult.receiverName === "string"
                ? providerResult.receiverName
                : null,
            date: typeof providerResult.date === "string"
                ? providerResult.date
                : null,
            sourceUrl: typeof providerResult.sourceUrl === "string"
                ? providerResult.sourceUrl
                : null,
        };
    }
}

export default PaymentVerificationService;