-- ============================================================
-- ACCOUNT & SUBSCRIPTION
-- ============================================================

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(150) NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL
        REFERENCES accounts(id),

    plan VARCHAR(50) NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'active',

    started_at TIMESTAMPTZ NOT NULL,

    expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- USER & IDENTITY
-- ============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL
        REFERENCES accounts(id),

    name VARCHAR(150) NOT NULL,

    email VARCHAR(255) UNIQUE,

    phone VARCHAR(30) UNIQUE,

    username VARCHAR(50) UNIQUE,

    email_verified_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL UNIQUE
        REFERENCES users(id),

    bio TEXT,

    profile_image_key TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- AUTHENTICATION
-- ============================================================

CREATE TABLE auth_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id),

    provider VARCHAR(30) NOT NULL,

    provider_account_id VARCHAR(255),

    password_hash TEXT,

    failed_login_attempts INTEGER NOT NULL DEFAULT 0,

    locked_until TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (provider, provider_account_id)
);


CREATE TABLE otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id),

    code_hash TEXT NOT NULL,

    purpose VARCHAR(50) NOT NULL DEFAULT 'email_verification',

    expires_at TIMESTAMPTZ NOT NULL,

    verified_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- SESSIONS
-- ============================================================

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id),

    token_hash TEXT NOT NULL UNIQUE,

    expires_at TIMESTAMPTZ NOT NULL,

    revoked_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id
    ON sessions(user_id);

CREATE INDEX idx_sessions_token_hash
    ON sessions(token_hash);


-- ============================================================
-- BRANCHES
-- ============================================================

CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL
        REFERENCES accounts(id),

    name VARCHAR(150) NOT NULL,

    description TEXT,

    status VARCHAR(30) NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_branches_account_id
    ON branches(account_id);


-- ============================================================
-- PERMISSIONS
-- ============================================================

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    key VARCHAR(100) NOT NULL UNIQUE,

    name VARCHAR(150) NOT NULL,

    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- BRANCH MEMBERSHIPS
-- ============================================================

CREATE TABLE branch_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id),

    branch_id UUID NOT NULL
        REFERENCES branches(id),

    status VARCHAR(30) NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, branch_id)
);

CREATE INDEX idx_branch_memberships_user_id
    ON branch_memberships(user_id);

CREATE INDEX idx_branch_memberships_branch_id
    ON branch_memberships(branch_id);


-- ============================================================
-- BRANCH MEMBERSHIP PERMISSIONS
-- ============================================================

CREATE TABLE branch_membership_permissions (
    branch_membership_id UUID NOT NULL
        REFERENCES branch_memberships(id)
        ON DELETE CASCADE,

    permission_id UUID NOT NULL
        REFERENCES permissions(id)
        ON DELETE CASCADE,

    PRIMARY KEY (
        branch_membership_id,
        permission_id
    )
);

CREATE INDEX idx_membership_permissions_permission_id
    ON branch_membership_permissions(permission_id);


-- ============================================================
-- INVITATIONS
-- ============================================================

CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL
        REFERENCES accounts(id),

    branch_id UUID NOT NULL
        REFERENCES branches(id),

    invited_by_user_id UUID NOT NULL
        REFERENCES users(id),

    user_id UUID
        REFERENCES users(id),

    email VARCHAR(255),

    phone VARCHAR(30),

    code_hash TEXT NOT NULL,

    expires_at TIMESTAMPTZ NOT NULL,

    accepted_at TIMESTAMPTZ,

    revoked_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (
        email IS NOT NULL
        OR phone IS NOT NULL
    )
);

CREATE INDEX idx_invitations_account_id
    ON invitations(account_id);

CREATE INDEX idx_invitations_branch_id
    ON invitations(branch_id);

CREATE INDEX idx_invitations_invited_by_user_id
    ON invitations(invited_by_user_id);

CREATE INDEX idx_invitations_user_id
    ON invitations(user_id);

CREATE INDEX idx_invitations_email
    ON invitations(email);

CREATE INDEX idx_invitations_phone
    ON invitations(phone);

CREATE INDEX idx_invitations_expires_at
    ON invitations(expires_at);


-- ============================================================
-- INVITATION PERMISSIONS
-- ============================================================

CREATE TABLE invitation_permissions (
    invitation_id UUID NOT NULL
        REFERENCES invitations(id)
        ON DELETE CASCADE,

    permission_id UUID NOT NULL
        REFERENCES permissions(id)
        ON DELETE CASCADE,

    PRIMARY KEY (
        invitation_id,
        permission_id
    )
);

CREATE INDEX idx_invitation_permissions_permission_id
    ON invitation_permissions(permission_id);


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

-- ============================================================
-- OFFLIX PRODUCT SYSTEM
-- Categories + Products + Product Photos
-- ============================================================

BEGIN;


-- ============================================================
-- 1. CATEGORIES
-- ============================================================
-- Global categories:
--   account_id IS NULL
--   scope = 'global'
--
-- Account-specific categories:
--   account_id IS NOT NULL
--   scope = 'account'
--
-- Global categories are shared by every account.
-- Account categories belong only to their account.
-- ============================================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID
        REFERENCES accounts(id)
        ON DELETE CASCADE,

    name VARCHAR(100) NOT NULL,

    scope VARCHAR(20) NOT NULL DEFAULT 'account',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (
        (scope = 'global' AND account_id IS NULL)
        OR
        (scope = 'account' AND account_id IS NOT NULL)
    ),

    CHECK (length(trim(name)) > 0)
);


-- Global category names must be unique.
CREATE UNIQUE INDEX uq_categories_global_name
    ON categories (LOWER(name))
    WHERE scope = 'global';


-- Account-specific category names must be unique
-- inside each account.
CREATE UNIQUE INDEX uq_categories_account_name
    ON categories (account_id, LOWER(name))
    WHERE scope = 'account';


CREATE INDEX idx_categories_account_id
    ON categories(account_id);

CREATE INDEX idx_categories_scope
    ON categories(scope);

CREATE INDEX idx_categories_account_scope
    ON categories(account_id, scope);


-- ============================================================
-- 2. PRODUCTS
-- ============================================================
-- Every product belongs to:
--   1 account
--   1 branch
--   1 category
--
-- Stock is stored directly on the product because products
-- are branch-based.
--
-- stock:
--   Current quantity available in the product's branch.
--
-- low_stock_threshold:
--   Quantity at or below which the product is considered
--   low stock.
--
-- category_id can point to:
--   - a global category
--   - an account-specific category
--
-- The service layer MUST verify that an account-specific
-- category belongs to the same account as the product.
-- ============================================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL
        REFERENCES accounts(id),

    branch_id UUID NOT NULL,

    category_id UUID NOT NULL
        REFERENCES categories(id),

    name VARCHAR(150) NOT NULL,

    slug VARCHAR(180) NOT NULL,

    description TEXT,

    type VARCHAR(20) NOT NULL DEFAULT 'private',

    cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,

    selling_price NUMERIC(12,2) NOT NULL DEFAULT 0,

    stock INTEGER NOT NULL DEFAULT 0,

    low_stock_threshold INTEGER NOT NULL DEFAULT 5,

    status VARCHAR(30) NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (length(trim(name)) > 0),

    CHECK (length(trim(slug)) > 0),

    CHECK (type IN ('public', 'private')),

    CHECK (status IN ('active', 'inactive')),

    CHECK (cost_price >= 0),

    CHECK (selling_price >= 0),

    CHECK (stock >= 0),

    CHECK (low_stock_threshold >= 0),

    UNIQUE (slug),

    CONSTRAINT fk_products_branch_account
        FOREIGN KEY (branch_id, account_id)
        REFERENCES branches(id, account_id)
);


-- ============================================================
-- PRODUCT INDEXES
-- ============================================================

CREATE INDEX idx_products_account_id
    ON products(account_id);

CREATE INDEX idx_products_branch_id
    ON products(branch_id);

CREATE INDEX idx_products_category_id
    ON products(category_id);

CREATE INDEX idx_products_account_branch
    ON products(account_id, branch_id);

CREATE INDEX idx_products_account_category
    ON products(account_id, category_id);

CREATE INDEX idx_products_account_type
    ON products(account_id, type);

CREATE INDEX idx_products_account_status
    ON products(account_id, status);

CREATE INDEX idx_products_branch_status
    ON products(branch_id, status);

CREATE INDEX idx_products_branch_stock
    ON products(branch_id, stock);


-- ============================================================
-- 3. PRODUCT PHOTOS
-- ============================================================
-- Maximum 6 photos per product.
--
-- position:
--   1 = primary photo
--   2 = second photo
--   ...
--   6 = sixth photo
--
-- Provider:
--   cloudinary
--   r2
--
-- The schema intentionally stores both provider and object_key
-- so the storage implementation remains provider-agnostic.
-- ============================================================

CREATE TABLE product_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id UUID NOT NULL
        REFERENCES products(id)
        ON DELETE CASCADE,

    provider VARCHAR(30) NOT NULL,

    object_key TEXT NOT NULL,

    url TEXT NOT NULL,

    position INTEGER NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (provider IN ('cloudinary', 'r2')),

    CHECK (position BETWEEN 1 AND 6),

    CHECK (length(trim(object_key)) > 0),

    CHECK (length(trim(url)) > 0),

    UNIQUE (product_id, position)
);


-- ============================================================
-- PRODUCT PHOTO INDEXES
-- ============================================================

CREATE INDEX idx_product_photos_product_id
    ON product_photos(product_id);

CREATE INDEX idx_product_photos_provider
    ON product_photos(provider);


COMMIT;

-- ============================================================
-- REQUIRED FIX FOR EXISTING PRODUCTS COMPOSITE FOREIGN KEY
-- ============================================================

ALTER TABLE branches
ADD CONSTRAINT uq_branches_id_account UNIQUE (id, account_id);


-- ============================================================
-- FINANCIAL ACCOUNTS
-- ============================================================
-- Represents actual places where the business's money exists.
--
-- Examples:
--   Owner Cash
--   Owner CBE
--   Owner Awash
--   Branch A Cash
--   Branch A CBE
--
-- branch_id = NULL  -> account/owner level
-- branch_id != NULL -> branch level
-- ============================================================


CREATE TABLE financial_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL
        REFERENCES accounts(id) ON DELETE CASCADE,

    branch_id UUID
        REFERENCES branches(id),

    type VARCHAR(20) NOT NULL,
    name VARCHAR(150) NOT NULL,

    bank_name VARCHAR(150),
    account_identifier VARCHAR(150),

    status VARCHAR(30) NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (type IN ('cash', 'bank')),

    CHECK (status IN ('active', 'inactive')),

    CHECK (
        (type = 'cash'
            AND bank_name IS NULL
            AND account_identifier IS NULL)
        OR
        (type = 'bank'
            AND bank_name IS NOT NULL)
    ),

    CHECK (length(trim(name)) > 0)
);

CREATE INDEX idx_financial_accounts_account_id
    ON financial_accounts(account_id);

CREATE INDEX idx_financial_accounts_branch_id
    ON financial_accounts(branch_id);

CREATE INDEX idx_financial_accounts_account_branch
    ON financial_accounts(account_id, branch_id);

CREATE INDEX idx_financial_accounts_type
    ON financial_accounts(type);

CREATE INDEX idx_financial_accounts_status
    ON financial_accounts(status);


-- One active cash account per owner/account
CREATE UNIQUE INDEX uq_financial_accounts_owner_cash
    ON financial_accounts(account_id)
    WHERE branch_id IS NULL
      AND type = 'cash'
      AND status = 'active';


-- One active cash account per branch
CREATE UNIQUE INDEX uq_financial_accounts_branch_cash
    ON financial_accounts(branch_id)
    WHERE branch_id IS NOT NULL
      AND type = 'cash'
      AND status = 'active';


-- ============================================================
-- SALES
-- ============================================================

CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL
        REFERENCES accounts(id),

    branch_id UUID NOT NULL
        REFERENCES branches(id),

    customer_name VARCHAR(150),

    notes TEXT,

    subtotal NUMERIC(12,2) NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL,

    -- credit = nothing paid yet
    -- partial = partially paid
    -- paid = fully paid
    payment_status VARCHAR(20) NOT NULL,

    created_by_user_id UUID NOT NULL
        REFERENCES users(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (subtotal >= 0),
    CHECK (total_amount >= 0),

    CHECK (
        payment_status IN ('credit', 'partial', 'paid')
    )
);

CREATE INDEX idx_sales_account_id
    ON sales(account_id);

CREATE INDEX idx_sales_branch_id
    ON sales(branch_id);

CREATE INDEX idx_sales_account_branch
    ON sales(account_id, branch_id);

CREATE INDEX idx_sales_payment_status
    ON sales(payment_status);

CREATE INDEX idx_sales_created_at
    ON sales(created_at);

CREATE INDEX idx_sales_customer_name
    ON sales(customer_name);


-- ============================================================
-- SALE ITEMS
-- ============================================================
-- Product information is SNAPSHOTTED here.
--
-- If the product name or selling price changes later,
-- old sales remain historically correct.
-- ============================================================

CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    sale_id UUID NOT NULL
        REFERENCES sales(id) ON DELETE CASCADE,

    product_id UUID NOT NULL
        REFERENCES products(id),

    product_name VARCHAR(150) NOT NULL,

    quantity INTEGER NOT NULL,

    price_per_item NUMERIC(12,2) NOT NULL,

    total_amount NUMERIC(12,2) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (quantity > 0),
    CHECK (price_per_item >= 0),
    CHECK (total_amount >= 0)
);

CREATE INDEX idx_sale_items_sale_id
    ON sale_items(sale_id);

CREATE INDEX idx_sale_items_product_id
    ON sale_items(product_id);


-- ============================================================
-- MONEY TRANSACTIONS
-- ============================================================
-- This is the core money ledger.
--
-- Money always moves:
--
--   external -> financial account
--   financial account -> external
--   financial account -> financial account
--
-- Examples:
--
-- Sale payment:
--   NULL -> Branch Cash
--
-- Withdrawal:
--   Owner Cash -> NULL
--
-- Bank transfer:
--   Owner CBE -> Owner Awash
--
-- Branch settlement:
--   Branch Cash -> Owner CBE
-- ============================================================

CREATE TABLE money_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL
        REFERENCES accounts(id),

    branch_id UUID
        REFERENCES branches(id),

    type VARCHAR(30) NOT NULL,

    amount NUMERIC(12,2) NOT NULL,

    from_financial_account_id UUID
        REFERENCES financial_accounts(id),

    to_financial_account_id UUID
        REFERENCES financial_accounts(id),

    description TEXT,

    reference_type VARCHAR(50),
    reference_id UUID,

    created_by_user_id UUID NOT NULL
        REFERENCES users(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (amount > 0),

    CHECK (
        type IN (
            'sale_payment',
            'receivable_payment',
            'payable_payment',
            'deposit',
            'withdrawal',
            'transfer',
            'settlement'
        )
    ),

    CHECK (
        from_financial_account_id IS NOT NULL
        OR
        to_financial_account_id IS NOT NULL
    ),

    CHECK (
        from_financial_account_id IS NULL
        OR
        to_financial_account_id IS NULL
        OR
        from_financial_account_id <> to_financial_account_id
    )
);

CREATE INDEX idx_money_transactions_account_id
    ON money_transactions(account_id);

CREATE INDEX idx_money_transactions_branch_id
    ON money_transactions(branch_id);

CREATE INDEX idx_money_transactions_account_branch
    ON money_transactions(account_id, branch_id);

CREATE INDEX idx_money_transactions_type
    ON money_transactions(type);

CREATE INDEX idx_money_transactions_created_at
    ON money_transactions(created_at);

CREATE INDEX idx_money_transactions_reference
    ON money_transactions(reference_type, reference_id);

CREATE INDEX idx_money_transactions_from_account
    ON money_transactions(from_financial_account_id);

CREATE INDEX idx_money_transactions_to_account
    ON money_transactions(to_financial_account_id);


CREATE TABLE receivables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL
        REFERENCES accounts(id),

    branch_id UUID NOT NULL
        REFERENCES branches(id),

    sale_id UUID
        REFERENCES sales(id),

    customer_name VARCHAR(150),

    original_amount NUMERIC(12,2) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'open',

    due_at TIMESTAMPTZ,

    notes TEXT,

    created_by_user_id UUID NOT NULL
        REFERENCES users(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (original_amount > 0),

    CHECK (
        status IN (
            'open',
            'paid',
            'cancelled'
        )
    )
);

CREATE UNIQUE INDEX uq_receivables_sale
    ON receivables(sale_id)
    WHERE sale_id IS NOT NULL;

CREATE INDEX idx_receivables_account_id
    ON receivables(account_id);

CREATE INDEX idx_receivables_branch_id
    ON receivables(branch_id);

CREATE INDEX idx_receivables_account_branch
    ON receivables(account_id, branch_id);

CREATE INDEX idx_receivables_status
    ON receivables(status);

CREATE INDEX idx_receivables_due_at
    ON receivables(due_at);

CREATE INDEX idx_receivables_customer_name
    ON receivables(customer_name);


-- ============================================================
-- PAYMENTS
-- ============================================================
-- Represents money received from a customer.
--
-- sale_payment:
--   Payment directly associated with a sale.
--
-- receivable_payment:
--   Payment toward an existing receivable/credit.
--
-- The financial_account tells us WHERE the money actually went.
-- ============================================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL
        REFERENCES accounts(id),

    branch_id UUID NOT NULL
        REFERENCES branches(id),

    payment_type VARCHAR(30) NOT NULL,

    sale_id UUID
        REFERENCES sales(id),

    receivable_id UUID
        REFERENCES receivables(id),

    amount NUMERIC(12,2) NOT NULL,

    payment_method VARCHAR(20) NOT NULL,

    financial_account_id UUID NOT NULL
        REFERENCES financial_accounts(id),

    money_transaction_id UUID UNIQUE
        REFERENCES money_transactions(id),

    created_by_user_id UUID NOT NULL
        REFERENCES users(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (amount > 0),

    CHECK (
        payment_type IN (
            'sale_payment',
            'receivable_payment'
        )
    ),

    CHECK (
        payment_method IN ('cash', 'bank')
    ),

    CHECK (
        (
            payment_type = 'sale_payment'
            AND sale_id IS NOT NULL
            AND receivable_id IS NULL
        )
        OR
        (
            payment_type = 'receivable_payment'
            AND receivable_id IS NOT NULL
        )
    )
);

CREATE INDEX idx_payments_account_id
    ON payments(account_id);

CREATE INDEX idx_payments_branch_id
    ON payments(branch_id);

CREATE INDEX idx_payments_sale_id
    ON payments(sale_id);

CREATE INDEX idx_payments_receivable_id
    ON payments(receivable_id);

CREATE INDEX idx_payments_financial_account_id
    ON payments(financial_account_id);

CREATE INDEX idx_payments_created_at
    ON payments(created_at);

CREATE INDEX idx_payments_payment_method
    ON payments(payment_method);


-- ============================================================
-- RECEIVABLES / ብድር
-- ============================================================
-- Supports:
--
-- 1. Credit created automatically from a sale
-- 2. Manually created receivables
--
-- sale_id can therefore be NULL.
--
-- Remaining amount is NOT stored.
-- It is calculated:
--
--   original_amount - SUM(payments)
--
-- This prevents balance drift.
-- ============================================================


-- ============================================================
-- PAYABLES
-- ============================================================
-- Money the business owes to an external party.
--
-- Examples:
--   Supplier
--   Landlord
--   Employee
--   Service provider
-- ============================================================

CREATE TABLE payables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL
        REFERENCES accounts(id),

    branch_id UUID
        REFERENCES branches(id),

    party_name VARCHAR(150) NOT NULL,

    original_amount NUMERIC(12,2) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'open',

    description TEXT,

    due_at TIMESTAMPTZ,

    created_by_user_id UUID NOT NULL
        REFERENCES users(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (original_amount > 0),

    CHECK (
        status IN (
            'open',
            'partial',
            'paid',
            'cancelled'
        )
    ),

    CHECK (length(trim(party_name)) > 0)
);

CREATE INDEX idx_payables_account_id
    ON payables(account_id);

CREATE INDEX idx_payables_branch_id
    ON payables(branch_id);

CREATE INDEX idx_payables_account_branch
    ON payables(account_id, branch_id);

CREATE INDEX idx_payables_status
    ON payables(status);

CREATE INDEX idx_payables_due_at
    ON payables(due_at);


-- ============================================================
-- PAYABLE PAYMENTS
-- ============================================================
-- Every payable payment is backed by an actual
-- money transaction.
--
-- The source financial account tells us whether the business
-- paid from cash or a bank account.
-- ============================================================

CREATE TABLE payable_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    payable_id UUID NOT NULL
        REFERENCES payables(id) ON DELETE CASCADE,

    amount NUMERIC(12,2) NOT NULL,

    money_transaction_id UUID NOT NULL UNIQUE
        REFERENCES money_transactions(id),

    created_by_user_id UUID NOT NULL
        REFERENCES users(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (amount > 0)
);

CREATE INDEX idx_payable_payments_payable_id
    ON payable_payments(payable_id);

CREATE INDEX idx_payable_payments_created_at
    ON payable_payments(created_at);


-- ============================================================
-- BRANCH SETTLEMENTS
-- ============================================================
-- Moves branch money to owner/account-level money.
--
-- Lifecycle:
--
--   pending
--       ↓
--   requested
--       ↓
--   received
--
-- At "received":
--
--   Branch financial account
--           ↓
--   Owner financial account
--
-- The employee never chooses the owner's bank account.
-- The receiver/admin chooses it during settlement.
-- ============================================================

CREATE TABLE branch_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL
        REFERENCES accounts(id),

    branch_id UUID NOT NULL
        REFERENCES branches(id),

    amount NUMERIC(12,2) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'pending',

    requested_by_user_id UUID
        REFERENCES users(id),

    requested_at TIMESTAMPTZ,

    received_by_user_id UUID
        REFERENCES users(id),

    received_at TIMESTAMPTZ,

    source_financial_account_id UUID
        REFERENCES financial_accounts(id),

    receiving_financial_account_id UUID
        REFERENCES financial_accounts(id),

    money_transaction_id UUID UNIQUE
        REFERENCES money_transactions(id),

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (amount > 0),

    CHECK (
        status IN (
            'pending',
            'requested',
            'received',
            'cancelled'
        )
    ),

    CHECK (
        status <> 'received'
        OR
        (
            source_financial_account_id IS NOT NULL
            AND receiving_financial_account_id IS NOT NULL
            AND money_transaction_id IS NOT NULL
            AND received_at IS NOT NULL
        )
    )
);

CREATE INDEX idx_branch_settlements_account_id
    ON branch_settlements(account_id);

CREATE INDEX idx_branch_settlements_branch_id
    ON branch_settlements(branch_id);

CREATE INDEX idx_branch_settlements_account_branch
    ON branch_settlements(account_id, branch_id);

CREATE INDEX idx_branch_settlements_status
    ON branch_settlements(status);

CREATE INDEX idx_branch_settlements_created_at
    ON branch_settlements(created_at);


