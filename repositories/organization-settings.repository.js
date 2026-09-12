import BranchRepository from "@/repositories/branch.repository";

const OrganizationSettingsRepository = {
    async getBranches(client, accountId) {
        return await BranchRepository.getBranchesByAccountId(
            client,
            accountId
        );
    },

    async getBranchEmployees(client, accountId, branchId) {
        return await BranchRepository.getBranchEmployees(
            client,
            accountId,
            branchId
        );
    },

    async getEmployees(client, accountId) {
        const result = await client.query(
            `
            SELECT
                u.id,
                u.name,
                u.email,
                u.phone,
                u.username,
                u.email_verified_at,
                u.created_at,
                u.updated_at
            FROM users u
            WHERE u.account_id = $1
            ORDER BY u.created_at DESC
            `,
            [accountId]
        );

        return result.rows;
    },

    async getPermissions(client) {
        const result = await client.query(
            `
            SELECT
                id,
                key,
                name,
                description,
                created_at
            FROM permissions
            ORDER BY name ASC, key ASC
            `
        );

        return result.rows;
    },

    async getEmployeeMemberships(client, accountId) {
        const result = await client.query(
            `
            SELECT
                bm.id,
                bm.user_id,
                bm.branch_id,
                bm.status,
                bm.created_at,
                bm.updated_at,

                u.name AS user_name,
                u.email AS user_email,
                u.phone AS user_phone,
                u.username AS user_username,

                b.name AS branch_name

            FROM branch_memberships bm

            INNER JOIN users u
                ON u.id = bm.user_id
               AND u.account_id = $1

            INNER JOIN branches b
                ON b.id = bm.branch_id
               AND b.account_id = $1

            ORDER BY u.name ASC, b.name ASC
            `,
            [accountId]
        );

        return result.rows;
    },

    async getMembershipPermissions(client, accountId) {
        const result = await client.query(
            `
            SELECT
                bmp.branch_membership_id,
                p.id,
                p.key,
                p.name,
                p.description

            FROM branch_membership_permissions bmp

            INNER JOIN permissions p
                ON p.id = bmp.permission_id

            INNER JOIN branch_memberships bm
                ON bm.id = bmp.branch_membership_id

            INNER JOIN users u
                ON u.id = bm.user_id
               AND u.account_id = $1

            INNER JOIN branches b
                ON b.id = bm.branch_id
               AND b.account_id = $1

            ORDER BY p.name ASC, p.key ASC
            `,
            [accountId]
        );

        return result.rows;
    },

    async getOrganizationSettings(client, accountId) {
        const [
            branches,
            employees,
            memberships,
            permissions,
            membershipPermissions,
        ] = await Promise.all([
            this.getBranches(client, accountId),
            this.getEmployees(client, accountId),
            this.getEmployeeMemberships(client, accountId),
            this.getPermissions(client),
            this.getMembershipPermissions(client, accountId),
        ]);

        return {
            branches,
            employees,
            memberships,
            permissions,
            membershipPermissions,
        };
    },
};

export default OrganizationSettingsRepository;