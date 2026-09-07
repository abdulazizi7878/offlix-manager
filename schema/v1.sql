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

    email VARCHAR(255) NOT NULL UNIQUE,

    phone VARCHAR(30) UNIQUE,

    username VARCHAR(50) NOT NULL UNIQUE,

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