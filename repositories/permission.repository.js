const PermissionRepository = {
    async getAllPermissions(client) {
        const result = await client.query(
            `
      SELECT
        id,
        key,
        name,
        description
      FROM permissions
      ORDER BY key ASC
      `
        );

        return result.rows;
    },
};

export default PermissionRepository;