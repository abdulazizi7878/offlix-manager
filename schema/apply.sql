ALTER TABLE branches
ADD CONSTRAINT uq_branches_id_account
UNIQUE (id, account_id);

INSERT INTO permissions (key, name, description)
VALUES
    (
        'finance.accounts.view',
        'View financial accounts',
        'View cash and bank accounts.'
    ),
    (
        'finance.accounts.create',
        'Create financial accounts',
        'Create cash and bank accounts.'
    ),
    (
        'finance.accounts.update',
        'Update financial accounts',
        'Update financial account information.'
    ),
    (
        'finance.payments.view',
        'View payments',
        'View incoming payment records.'
    ),
    (
        'finance.payments.create',
        'Create payments',
        'Record incoming payments.'
    ),
    (
        'finance.receivables.view',
        'View receivables',
        'View customer receivables and credit.'
    ),
    (
        'finance.receivables.create',
        'Create receivables',
        'Create customer receivables and credit.'
    ),
    (
        'finance.receivables.update',
        'Update receivables',
        'Update receivable records.'
    ),
    (
        'finance.payables.view',
        'View payables',
        'View business payables.'
    ),
    (
        'finance.payables.create',
        'Create payables',
        'Create business payables.'
    ),
    (
        'finance.payables.update',
        'Update payables',
        'Update payable records.'
    ),
    (
        'finance.withdrawals.create',
        'Create withdrawals',
        'Withdraw money from financial accounts.'
    ),
    (
        'finance.transfers.create',
        'Create transfers',
        'Transfer money between financial accounts.'
    ),
    (
        'finance.settlements.view',
        'View branch settlements',
        'View branch settlement records.'
    ),
    (
        'finance.settlements.create',
        'Create branch settlements',
        'Create and request branch settlements.'
    ),
    (
        'finance.settlements.receive',
        'Receive branch settlements',
        'Confirm branch settlement receipt.'
    )
ON CONFLICT (key) DO NOTHING;



BEGIN;

ALTER TABLE money_transactions
DROP CONSTRAINT IF EXISTS money_transactions_type_check;

ALTER TABLE money_transactions
ADD CONSTRAINT money_transactions_type_check
CHECK (
    type IN (
        'income',
        'expense',
        'deposit',
        'withdrawal',
        'payment',
        'credit',
        'settlement',
        'other'
    )
);

COMMIT;