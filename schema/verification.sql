
BEGIN;

CREATE TABLE IF NOT EXISTS payment_verification_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL
        REFERENCES accounts(id) ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(id) ON DELETE RESTRICT,

    bank_code VARCHAR(50),
    transaction_reference VARCHAR(500),

    status VARCHAR(30) NOT NULL,

    amount NUMERIC(12, 2),
    currency VARCHAR(10),

    provider VARCHAR(30) NOT NULL DEFAULT 'cheki',
    error_code VARCHAR(100),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT payment_verification_audits_status_check
        CHECK (
            status IN (
                'VERIFIED',
                'NOT_VERIFIED',
                'DUPLICATE',
                'PROVIDER_ERROR'
            )
        )
);

CREATE INDEX IF NOT EXISTS
    idx_payment_verification_audits_account_created
ON payment_verification_audits (
    account_id,
    created_at DESC
);

CREATE INDEX IF NOT EXISTS
    idx_payment_verification_audits_user_created
ON payment_verification_audits (
    user_id,
    created_at DESC
);

-- A confirmed transaction reference can only be accepted once
-- for the same normalized bank and reference.
CREATE UNIQUE INDEX IF NOT EXISTS
    uq_payment_verification_confirmed_transaction
ON payment_verification_audits (
    lower(bank_code),
    lower(btrim(transaction_reference))
)
WHERE status = 'VERIFIED'
  AND bank_code IS NOT NULL
  AND transaction_reference IS NOT NULL;

COMMIT;
