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

CREATE TABLE account_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL UNIQUE
        REFERENCES accounts(id)
        ON DELETE CASCADE,

    currency VARCHAR(10) NOT NULL DEFAULT 'ETB',

    timezone VARCHAR(100) NOT NULL DEFAULT 'Africa/Addis_Ababa',

    date_format VARCHAR(30) NOT NULL DEFAULT 'YYYY-MM-DD',

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

CREATE TABLE branch_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL
        REFERENCES accounts(id),

    branch_id UUID NOT NULL,

    product_id UUID
        REFERENCES products(id)
        ON DELETE SET NULL,

    product_name VARCHAR(150) NOT NULL,

    created_by_user_id UUID NOT NULL
        REFERENCES users(id),

    quantity INTEGER NOT NULL,

    cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,

    payment_source VARCHAR(30) NOT NULL
        DEFAULT 'employee_personal',

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (quantity > 0),

    CHECK (cost_price >= 0),

    CHECK (
        payment_source IN (
            'employee_personal',
            'supplier_credit',
            'other'
        )
    ),

    CONSTRAINT fk_branch_purchases_branch_account
        FOREIGN KEY (branch_id, account_id)
        REFERENCES branches(id, account_id)
);

BEGIN;

CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL
        REFERENCES accounts(id) ON DELETE CASCADE,

    branch_id UUID NOT NULL,

    customer_name VARCHAR(150),
    notes TEXT,

    subtotal NUMERIC(12,2) NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL,

    payment_status VARCHAR(20) NOT NULL,

    created_by_user_id UUID NOT NULL
        REFERENCES users(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (subtotal >= 0),
    CHECK (total_amount >= 0),

    CHECK (
        payment_status IN (
            'credit',
            'partial',
            'paid'
        )
    ),

    CONSTRAINT fk_sales_branch_account
        FOREIGN KEY (branch_id, account_id)
        REFERENCES branches(id, account_id)
);


CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    sale_id UUID NOT NULL
        REFERENCES sales(id)
        ON DELETE CASCADE,

    product_id UUID
        REFERENCES products(id)
        ON DELETE SET NULL,

    product_name VARCHAR(150) NOT NULL,

    quantity INTEGER NOT NULL
        CHECK (quantity > 0),

    price_per_item NUMERIC(12,2) NOT NULL
        CHECK (price_per_item >= 0),

    total_amount NUMERIC(12,2) NOT NULL
        CHECK (total_amount >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sale_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    sale_id UUID NOT NULL
        REFERENCES sales(id) ON DELETE CASCADE,

    amount NUMERIC(12,2) NOT NULL,

    payment_method VARCHAR(20) NOT NULL,

    created_by_user_id UUID NOT NULL
        REFERENCES users(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (amount > 0),

    CHECK (
        payment_method IN (
            'cash',
            'bank'
        )
    )
);


CREATE TABLE sale_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL
        REFERENCES accounts(id) ON DELETE CASCADE,

    branch_id UUID NOT NULL,

    amount NUMERIC(12,2) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'pending',

    settlement_date DATE NOT NULL,

    requested_by_user_id UUID
        REFERENCES users(id),

    requested_at TIMESTAMPTZ,

    received_by_user_id UUID
        REFERENCES users(id),

    received_at TIMESTAMPTZ,

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

    CONSTRAINT fk_sale_settlements_branch_account
        FOREIGN KEY (branch_id, account_id)
        REFERENCES branches(id, account_id)
);


CREATE INDEX idx_sales_account_id
    ON sales(account_id);

CREATE INDEX idx_sales_branch_id
    ON sales(branch_id);

CREATE INDEX idx_sales_created_by_user_id
    ON sales(created_by_user_id);

CREATE INDEX idx_sales_payment_status
    ON sales(payment_status);

CREATE INDEX idx_sales_created_at
    ON sales(created_at);

CREATE INDEX idx_sale_items_sale_id
    ON sale_items(sale_id);

CREATE INDEX idx_sale_items_product_id
    ON sale_items(product_id);

CREATE INDEX idx_sale_payments_sale_id
    ON sale_payments(sale_id);

CREATE INDEX idx_sale_settlements_account_branch
    ON sale_settlements(account_id, branch_id);

CREATE INDEX idx_sale_settlements_status
    ON sale_settlements(status);

COMMIT;




-----

-- ============================================================
-- OFFLIX MONEY MANAGEMENT
-- ============================================================

BEGIN;


-- ============================================================
-- MONEY ACCOUNTS
-- ============================================================

CREATE TABLE money_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL
        REFERENCES accounts(id)
        ON DELETE CASCADE,

    name VARCHAR(150) NOT NULL,

    type VARCHAR(30) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (length(trim(name)) > 0),

    CHECK (
        type IN (
            'cash',
            'bank',
            'mobile_money'
        )
    ),

    CHECK (
        status IN (
            'active',
            'inactive'
        )
    ),

    -- Required because other tables reference
    -- (id, account_id) as a composite foreign key.
    CONSTRAINT uq_money_accounts_id_account
        UNIQUE (id, account_id)
);


CREATE INDEX idx_money_accounts_account_id
    ON money_accounts(account_id);

CREATE INDEX idx_money_accounts_account_type
    ON money_accounts(account_id, type);

CREATE INDEX idx_money_accounts_account_status
    ON money_accounts(account_id, status);


-- ============================================================
-- MONEY TRANSACTIONS
-- ============================================================

CREATE TABLE money_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL
        REFERENCES accounts(id)
        ON DELETE CASCADE,

    money_account_id UUID NOT NULL,

    type VARCHAR(30) NOT NULL,

    direction VARCHAR(10) NOT NULL,

    amount NUMERIC(12,2) NOT NULL,

    description TEXT,

    created_by_user_id UUID NOT NULL
        REFERENCES users(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (amount > 0),

    CHECK (
        type IN (
            'income',
            'expense',
            'deposit',
            'withdrawal',
            'payment',
            'settlement',
            'other'
        )
    ),

    CHECK (
        direction IN (
            'in',
            'out'
        )
    ),

    CONSTRAINT fk_money_transactions_account
        FOREIGN KEY (
            money_account_id,
            account_id
        )
        REFERENCES money_accounts (
            id,
            account_id
        )
);


CREATE INDEX idx_money_transactions_account_id
    ON money_transactions(account_id);

CREATE INDEX idx_money_transactions_money_account_id
    ON money_transactions(money_account_id);

CREATE INDEX idx_money_transactions_account_type
    ON money_transactions(account_id, type);

CREATE INDEX idx_money_transactions_account_created_at
    ON money_transactions(account_id, created_at);

CREATE INDEX idx_money_transactions_created_by_user_id
    ON money_transactions(created_by_user_id);


-- ============================================================
-- MONEY TRANSFERS
-- ============================================================
-- Internal movement between the business's own money accounts.
--
-- Example:
-- CBE -> Main Cash
--
-- Transfers do not change total business money.
-- ============================================================

CREATE TABLE money_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL
        REFERENCES accounts(id)
        ON DELETE CASCADE,

    from_money_account_id UUID NOT NULL,

    to_money_account_id UUID NOT NULL,

    amount NUMERIC(12,2) NOT NULL,

    notes TEXT,

    created_by_user_id UUID NOT NULL
        REFERENCES users(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (amount > 0),

    CHECK (
        from_money_account_id <> to_money_account_id
    ),

    CONSTRAINT fk_money_transfers_from_account
        FOREIGN KEY (
            from_money_account_id,
            account_id
        )
        REFERENCES money_accounts (
            id,
            account_id
        ),

    CONSTRAINT fk_money_transfers_to_account
        FOREIGN KEY (
            to_money_account_id,
            account_id
        )
        REFERENCES money_accounts (
            id,
            account_id
        )
);


CREATE INDEX idx_money_transfers_account_id
    ON money_transfers(account_id);

CREATE INDEX idx_money_transfers_from_account
    ON money_transfers(from_money_account_id);

CREATE INDEX idx_money_transfers_to_account
    ON money_transfers(to_money_account_id);

CREATE INDEX idx_money_transfers_created_at
    ON money_transfers(created_at);


-- ============================================================
-- SALE SETTLEMENT ACCEPTANCES
-- ============================================================
-- Connects the existing sale_settlements system
-- to the Money Management system.
--
-- The original sale_settlements.amount is NOT changed.
--
-- Example:
--
-- Original settlement: 50,000
--
-- Acceptance 1:
--   20,000 -> CBE
--
-- Acceptance 2:
--   15,000 -> Main Cash
--
-- Acceptance 3:
--   15,000 -> Telebirr
--
-- Total accepted: 50,000
-- Remaining: 0
-- ============================================================

CREATE TABLE sale_settlement_acceptances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL
        REFERENCES accounts(id)
        ON DELETE CASCADE,

    sale_settlement_id UUID NOT NULL,

    money_account_id UUID NOT NULL,

    amount NUMERIC(12,2) NOT NULL,

    accepted_by_user_id UUID NOT NULL
        REFERENCES users(id),

    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (amount > 0),

    CONSTRAINT fk_settlement_acceptance_settlement
        FOREIGN KEY (sale_settlement_id)
        REFERENCES sale_settlements(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_settlement_acceptance_money_account
        FOREIGN KEY (
            money_account_id,
            account_id
        )
        REFERENCES money_accounts (
            id,
            account_id
        )
);


CREATE INDEX idx_settlement_acceptances_account_id
    ON sale_settlement_acceptances(account_id);

CREATE INDEX idx_settlement_acceptances_settlement_id
    ON sale_settlement_acceptances(sale_settlement_id);

CREATE INDEX idx_settlement_acceptances_money_account_id
    ON sale_settlement_acceptances(money_account_id);

CREATE INDEX idx_settlement_acceptances_accepted_at
    ON sale_settlement_acceptances(accepted_at);


-- ============================================================
-- PAYABLES
-- ============================================================
-- Money the business owes someone else.
-- ============================================================

CREATE TABLE payables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL
        REFERENCES accounts(id)
        ON DELETE CASCADE,

    name VARCHAR(150) NOT NULL,

    description TEXT,

    amount NUMERIC(12,2) NOT NULL,

    due_date DATE,

    status VARCHAR(20) NOT NULL DEFAULT 'pending',

    created_by_user_id UUID NOT NULL
        REFERENCES users(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (length(trim(name)) > 0),

    CHECK (amount > 0),

    CHECK (
        status IN (
            'pending',
            'partial',
            'paid',
            'cancelled'
        )
    )
);


CREATE INDEX idx_payables_account_id
    ON payables(account_id);

CREATE INDEX idx_payables_account_status
    ON payables(account_id, status);

CREATE INDEX idx_payables_due_date
    ON payables(account_id, due_date);


-- ============================================================
-- PAYABLE PAYMENTS
-- ============================================================
-- Actual payments made against a payable.
-- ============================================================

CREATE TABLE payable_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL
        REFERENCES accounts(id)
        ON DELETE CASCADE,

    payable_id UUID NOT NULL,

    money_account_id UUID NOT NULL,

    amount NUMERIC(12,2) NOT NULL,

    paid_by_user_id UUID NOT NULL
        REFERENCES users(id),

    paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (amount > 0),

    CONSTRAINT fk_payable_payment_payable
        FOREIGN KEY (payable_id)
        REFERENCES payables(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_payable_payment_money_account
        FOREIGN KEY (
            money_account_id,
            account_id
        )
        REFERENCES money_accounts (
            id,
            account_id
        )
);


CREATE INDEX idx_payable_payments_account_id
    ON payable_payments(account_id);

CREATE INDEX idx_payable_payments_payable_id
    ON payable_payments(payable_id);

CREATE INDEX idx_payable_payments_money_account_id
    ON payable_payments(money_account_id);

CREATE INDEX idx_payable_payments_paid_at
    ON payable_payments(paid_at);

-- ============================================================
-- RECEIVABLES
-- ============================================================
-- Money owed to the business by another person/entity.
-- Completely independent from sales.
-- ============================================================

CREATE TABLE receivables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL
        REFERENCES accounts(id)
        ON DELETE CASCADE,

    name VARCHAR(150) NOT NULL,

    description TEXT,

    amount NUMERIC(12,2) NOT NULL,

    due_date DATE,

    status VARCHAR(20) NOT NULL DEFAULT 'pending',

    created_by_user_id UUID NOT NULL
        REFERENCES users(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (length(trim(name)) > 0),

    CHECK (amount > 0),

    CHECK (
        status IN (
            'pending',
            'partial',
            'paid',
            'cancelled'
        )
    )
);


CREATE INDEX idx_receivables_account_id
    ON receivables(account_id);

CREATE INDEX idx_receivables_account_status
    ON receivables(account_id, status);

CREATE INDEX idx_receivables_due_date
    ON receivables(account_id, due_date);


-- ============================================================
-- RECEIVABLE PAYMENTS
-- ============================================================
-- Actual money received against a receivable.
-- ============================================================

CREATE TABLE receivable_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL
        REFERENCES accounts(id)
        ON DELETE CASCADE,

    receivable_id UUID NOT NULL,

    money_account_id UUID NOT NULL,

    amount NUMERIC(12,2) NOT NULL,

    received_by_user_id UUID NOT NULL
        REFERENCES users(id),

    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (amount > 0),

    CONSTRAINT fk_receivable_payment_receivable
        FOREIGN KEY (receivable_id)
        REFERENCES receivables(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_receivable_payment_money_account
        FOREIGN KEY (
            money_account_id,
            account_id
        )
        REFERENCES money_accounts (
            id,
            account_id
        )
);


CREATE INDEX idx_receivable_payments_account_id
    ON receivable_payments(account_id);

CREATE INDEX idx_receivable_payments_receivable_id
    ON receivable_payments(receivable_id);

CREATE INDEX idx_receivable_payments_money_account_id
    ON receivable_payments(money_account_id);

CREATE INDEX idx_receivable_payments_received_at
    ON receivable_payments(received_at);

-- ============================================================
-- CREDITS
-- ============================================================
-- Money owed to the business.
--
-- UI can call this "Credit".
-- ============================================================

CREATE TABLE credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL
        REFERENCES accounts(id)
        ON DELETE CASCADE,

    name VARCHAR(150) NOT NULL,

    description TEXT,

    amount NUMERIC(12,2) NOT NULL,

    direction VARCHAR(10) NOT NULL DEFAULT 'out',

    due_date DATE,

    status VARCHAR(20) NOT NULL DEFAULT 'pending',

    created_by_user_id UUID NOT NULL
        REFERENCES users(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (length(trim(name)) > 0),

    CHECK (amount > 0),

    CHECK (
        direction IN (
            'in',
            'out'
        )
    ),

    CHECK (
        status IN (
            'pending',
            'partial',
            'paid',
            'cancelled'
        )
    )
);


CREATE INDEX idx_credits_account_id
    ON credits(account_id);

CREATE INDEX idx_credits_account_status
    ON credits(account_id, status);

CREATE INDEX idx_credits_due_date
    ON credits(account_id, due_date);


-- ============================================================
-- CREDIT PAYMENTS
-- ============================================================
-- Actual money received against a credit.
-- ============================================================

CREATE TABLE credit_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL
        REFERENCES accounts(id)
        ON DELETE CASCADE,

    credit_id UUID NOT NULL,

    money_account_id UUID NOT NULL,

    amount NUMERIC(12,2) NOT NULL,

    received_by_user_id UUID NOT NULL
        REFERENCES users(id),

    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (amount > 0),

    CONSTRAINT fk_credit_payment_credit
        FOREIGN KEY (credit_id)
        REFERENCES credits(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_credit_payment_money_account
        FOREIGN KEY (
            money_account_id,
            account_id
        )
        REFERENCES money_accounts (
            id,
            account_id
        )
);


CREATE INDEX idx_credit_payments_account_id
    ON credit_payments(account_id);

CREATE INDEX idx_credit_payments_credit_id
    ON credit_payments(credit_id);

CREATE INDEX idx_credit_payments_money_account_id
    ON credit_payments(money_account_id);

CREATE INDEX idx_credit_payments_received_at
    ON credit_payments(received_at);


COMMIT;