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