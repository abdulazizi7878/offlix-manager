// file: repositories/branch-access.repository.js

const BranchAccessRepository = {
    async getAvailableBranches(
        client,
        userId,
        accountId,
        permissionKey
    ) {
        const result = await client.query(
            `
            SELECT DISTINCT
                b.id,
                b.name,
                b.description,
                b.status
            FROM branches b
            INNER JOIN branch_memberships bm
                ON bm.branch_id = b.id
            INNER JOIN branch_membership_permissions bmp
                ON bmp.branch_membership_id = bm.id
            INNER JOIN permissions p
                ON p.id = bmp.permission_id
            WHERE b.account_id = $1
              AND bm.user_id = $2
              AND bm.status = 'active'
              AND b.status = 'active'
              AND p.key = $3
            ORDER BY b.name ASC
            `,
            [
                accountId,
                userId,
                permissionKey,
            ]
        );

        return result.rows;
    },
};

export default BranchAccessRepository;