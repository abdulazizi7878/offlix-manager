ALTER TABLE branches
ADD CONSTRAINT uq_branches_id_account
UNIQUE (id, account_id);
INSERT INTO permissions (key, name, description)
VALUES
    ('branches.view', 'View branches', 'View branch information.'),
    ('branches.create', 'Create branches', 'Create new branches.'),
    ('branches.update', 'Update branches', 'Update branch information and status.'),

    ('users.view', 'View users', 'View employees and users.'),
    ('users.add', 'Add users', 'Add employees to a branch.'),
    ('users.remove', 'Remove users', 'Remove employees from a branch.'),
    ('users.update', 'Update users', 'Update employee branch membership and permissions.'),

    ('products.view', 'View products', 'View products.'),
    ('products.create', 'Create products', 'Create new products.'),
    ('products.update', 'Update products', 'Update product information.'),
    ('products.delete', 'Delete products', 'Delete products where permitted.'),

    ('inventory.view', 'View inventory', 'View inventory information.'),
    ('inventory.adjust', 'Adjust inventory', 'Make inventory adjustments.'),

    ('sales.view', 'View sales', 'View sales records.'),
    ('sales.create', 'Create sales', 'Create new sales.'),

    ('expenses.view', 'View expenses', 'View expense records.'),
    ('expenses.create', 'Create expenses', 'Create new expenses.'),

    ('finance.view', 'View finance', 'View financial information.'),
    ('finance.create', 'Create financial records', 'Create financial records.'),

    ('reports.view', 'View reports', 'View business reports.')
ON CONFLICT (key) DO NOTHING;

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