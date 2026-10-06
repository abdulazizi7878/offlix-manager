-- This file is used to update the database schema to the latest version.
-- It is not a migration file, so it will not be rolled back.
-- It is used to update the database schema to the latest version.


-- 1. Add the column as nullable first
ALTER TABLE sale_settlements
ADD COLUMN settlement_date DATE;

-- 2. Populate existing rows
UPDATE sale_settlements
SET settlement_date = created_at::DATE
WHERE settlement_date IS NULL;

-- 3. Make it NOT NULL
ALTER TABLE sale_settlements
ALTER COLUMN settlement_date SET NOT NULL;

-- 4. Create the unique index
CREATE UNIQUE INDEX uq_sale_settlements_account_branch_date
ON sale_settlements (
    account_id,
    branch_id,
    settlement_date
);

-- 5. Create the additional index
CREATE INDEX idx_sale_settlements_account_date
ON sale_settlements (
    account_id,
    settlement_date
);
