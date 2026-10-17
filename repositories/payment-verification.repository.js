
import pool from "@/lib/database";

const PaymentVerificationRepository = {
    async recordResult(data) {
        const result = await pool.query(
            `
            INSERT INTO payment_verification_audits (
                account_id,
                user_id,
                bank_code,
                transaction_reference,
                status,
                amount,
                currency,
                provider,
                error_code
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'cheki', $8)
            ON CONFLICT (
                lower(bank_code),
                lower(btrim(transaction_reference))
            )
            WHERE status = 'VERIFIED'
              AND bank_code IS NOT NULL
              AND transaction_reference IS NOT NULL
            DO NOTHING
            RETURNING id, status, created_at
            `,
            [
                data.accountId,
                data.userId,
                data.bankCode ?? null,
                data.reference ?? null,
                data.status,
                data.amount ?? null,
                data.currency ?? null,
                data.errorCode ?? null,
            ]
        );

        if (result.rows[0]) {
            return {
                recorded: true,
                duplicate: false,
                audit: result.rows[0],
            };
        }

        // The unique index prevented a second VERIFIED record.
        // Record this attempt separately as a duplicate.
        await pool.query(
            `
            INSERT INTO payment_verification_audits (
                account_id,
                user_id,
                bank_code,
                transaction_reference,
                status,
                amount,
                currency,
                provider,
                error_code
            )
            VALUES ($1, $2, $3, $4, 'DUPLICATE', $5, $6, 'cheki', 'DUPLICATE_REFERENCE')
            `,
            [
                data.accountId,
                data.userId,
                data.bankCode,
                data.reference,
                data.amount ?? null,
                data.currency ?? null,
            ]
        );

        return {
            recorded: true,
            duplicate: true,
            audit: null,
        };
    },
};

export default PaymentVerificationRepository;
