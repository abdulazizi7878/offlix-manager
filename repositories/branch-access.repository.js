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
            WHERE b.account_id = $1
              AND b.status = 'active'
              AND (
                    -- Account creator can access every branch
                    NOT EXISTS (
                        SELECT 1
                        FROM users earlier
                        INNER JOIN users u
                            ON u.id = $2
                        WHERE earlier.account_id = $1
                          AND (
                                earlier.created_at < u.created_at
                                OR (
                                    earlier.created_at = u.created_at
                                    AND earlier.id < u.id
                                )
                          )
                    )

                    OR

                    -- Employees need membership + requested permission
                    EXISTS (
                        SELECT 1
                        FROM branch_memberships bm
                        INNER JOIN branch_membership_permissions bmp
                            ON bmp.branch_membership_id = bm.id
                        INNER JOIN permissions p
                            ON p.id = bmp.permission_id
                        WHERE bm.branch_id = b.id
                          AND bm.user_id = $2
                          AND bm.status = 'active'
                          AND p.key = $3
                    )
              )
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