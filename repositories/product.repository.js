// file: repositories/product.repository.js

const ProductRepository = {
    async createProduct(client, data) {
        const result = await client.query(
            `
            WITH inserted AS (
                INSERT INTO products (
                    account_id,
                    branch_id,
                    category_id,
                    name,
                    slug,
                    description,
                    type,
                    cost_price,
                    selling_price,
                    stock,
                    low_stock_threshold,
                    status
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6,
                    $7, $8, $9, $10, $11, $12
                )
                RETURNING *
            )
            SELECT
                p.*,
                b.name AS branch_name,
                c.name AS category_name
            FROM inserted p
            INNER JOIN branches b
                ON b.id = p.branch_id
            INNER JOIN categories c
                ON c.id = p.category_id
            `,
            [
                data.accountId,
                data.branchId,
                data.categoryId,
                data.name,
                data.slug,
                data.description ?? null,
                data.type ?? "private",
                data.costPrice ?? 0,
                data.sellingPrice ?? 0,
                data.stock ?? 0,
                data.lowStockThreshold ?? 5,
                data.status ?? "active",
            ]
        );

        return result.rows[0];
    },

    async createBranchPurchase(client, data) {
        const result = await client.query(
            `
        INSERT INTO branch_purchases (
            account_id,
            branch_id,
            created_by_user_id,
            product_id,
            product_name,
            quantity,
            cost_price,
            payment_source,
            notes
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9
        )
        RETURNING *
        `,
            [
                data.accountId,
                data.branchId,
                data.createdByUserId,
                data.productId,
                data.productName,
                data.quantity,
                data.costPrice,
                data.paymentSource,
                data.notes ?? null,
            ]
        );

        return result.rows[0];
    },
    
    async slugExists(client, slug, excludeProductId = null) {
        const result = await client.query(
            `
        SELECT 1
        FROM products
        WHERE slug = $1
          AND (
              $2::UUID IS NULL
              OR id <> $2
          )
        LIMIT 1
        `,
            [slug, excludeProductId]
        );

        return result.rowCount > 0;
    },

    async getProductById(client, productId) {
        const result = await client.query(
            `
            SELECT
                p.*,
                b.name AS branch_name,
                c.name AS category_name
            FROM products p
            INNER JOIN branches b
                ON b.id = p.branch_id
            INNER JOIN categories c
                ON c.id = p.category_id
            WHERE p.id = $1
            LIMIT 1
            `,
            [productId]
        );

        return result.rows[0] ?? null;
    },

    async getProductByIdForAccount(
        client,
        productId,
        accountId
    ) {
        const result = await client.query(
            `
            SELECT
                p.*,
                b.name AS branch_name,
                c.name AS category_name
            FROM products p
            INNER JOIN branches b
                ON b.id = p.branch_id
            INNER JOIN categories c
                ON c.id = p.category_id
            WHERE p.id = $1
                AND p.account_id = $2
            LIMIT 1
            `,
            [productId, accountId]
        );

        return result.rows[0] ?? null;
    },

    async getProductBySlug(client, slug) {
        const result = await client.query(
            `
            SELECT
                p.*,
                b.name AS branch_name,
                c.name AS category_name
            FROM products p
            INNER JOIN branches b
                ON b.id = p.branch_id
            INNER JOIN categories c
                ON c.id = p.category_id
            WHERE p.slug = $1
            LIMIT 1
            `,
            [slug]
        );

        return result.rows[0] ?? null;
    },

    async getProductBySlugForAccount(
        client,
        slug,
        accountId
    ) {
        const result = await client.query(
            `
            SELECT
                p.*,
                b.name AS branch_name,
                c.name AS category_name
            FROM products p
            INNER JOIN branches b
                ON b.id = p.branch_id
            INNER JOIN categories c
                ON c.id = p.category_id
            WHERE p.slug = $1
                AND p.account_id = $2
            LIMIT 1
            `,
            [slug, accountId]
        );

        return result.rows[0] ?? null;
    },

    async getProductsByAccountId(
        client,
        accountId,
        userId,
        isCreator,
        options = {}
    ) {
        const {
            page = 1,
            limit = 20,
            search = null,
            branchId = null,
            categoryId = null,
            status = null,
            type = null,
        } = options;

        const values = [accountId];

        const conditions = [
            "p.account_id = $1",
        ];

        let parameterIndex = 2;

        /*
         * Non-creators can only see products belonging
         * to branches where they have products.view.
         */
        if (!isCreator) {
            conditions.push(
                `
                EXISTS (
                    SELECT 1
                    FROM branch_memberships bm
                    INNER JOIN branch_membership_permissions bmp
                        ON bmp.branch_membership_id = bm.id
                    INNER JOIN permissions permission
                        ON permission.id = bmp.permission_id
                    WHERE bm.user_id = $${parameterIndex}
                        AND bm.branch_id = p.branch_id
                        AND bm.status = 'active'
                        AND permission.key = 'products.view'
                )
                `
            );

            values.push(userId);
            parameterIndex++;
        }

        if (branchId) {
            conditions.push(
                `p.branch_id = $${parameterIndex}`
            );

            values.push(branchId);
            parameterIndex++;
        }

        if (categoryId) {
            conditions.push(
                `p.category_id = $${parameterIndex}`
            );

            values.push(categoryId);
            parameterIndex++;
        }

        if (status) {
            conditions.push(
                `p.status = $${parameterIndex}`
            );

            values.push(status);
            parameterIndex++;
        }

        if (type) {
            conditions.push(
                `p.type = $${parameterIndex}`
            );

            values.push(type);
            parameterIndex++;
        }

        if (search) {
            conditions.push(
                `
                (
                    p.name ILIKE $${parameterIndex}
                    OR p.slug ILIKE $${parameterIndex}
                    OR COALESCE(
                        p.description,
                        ''
                    ) ILIKE $${parameterIndex}
                )
                `
            );

            values.push(`%${search}%`);
            parameterIndex++;
        }

        const offset = (page - 1) * limit;

        const limitIndex = parameterIndex;

        values.push(limit);
        parameterIndex++;

        const offsetIndex = parameterIndex;

        values.push(offset);

        const result = await client.query(
            `
            SELECT
                p.*,
                b.name AS branch_name,
                c.name AS category_name
            FROM products p
            INNER JOIN branches b
                ON b.id = p.branch_id
            INNER JOIN categories c
                ON c.id = p.category_id
            WHERE ${conditions.join(" AND ")}
            ORDER BY
                p.created_at DESC,
                p.id DESC
            LIMIT $${limitIndex}
            OFFSET $${offsetIndex}
            `,
            values
        );

        return result.rows;
    },

    async countProductsByAccountId(
        client,
        accountId,
        userId,
        isCreator,
        options = {}
    ) {
        const {
            search,
            branchId,
            categoryId,
            status,
            type,
        } = options;

        const values = [accountId];

        const conditions = [
            "p.account_id = $1",
        ];

        let parameterIndex = 2;

        /*
         * Non-creators can only count products from
         * branches where they have products.view.
         */
        if (!isCreator) {
            conditions.push(
                `
                EXISTS (
                    SELECT 1
                    FROM branch_memberships bm
                    INNER JOIN branch_membership_permissions bmp
                        ON bmp.branch_membership_id =
                            bm.id
                    INNER JOIN permissions permission
                        ON permission.id =
                            bmp.permission_id
                    WHERE bm.user_id = $${parameterIndex}
                        AND bm.branch_id = p.branch_id
                        AND bm.status = 'active'
                        AND permission.key = 'products.view'
                )
                `
            );

            values.push(userId);
            parameterIndex++;
        }

        if (branchId) {
            conditions.push(
                `p.branch_id = $${parameterIndex}`
            );

            values.push(branchId);
            parameterIndex++;
        }

        if (categoryId) {
            conditions.push(
                `p.category_id = $${parameterIndex}`
            );

            values.push(categoryId);
            parameterIndex++;
        }

        if (status) {
            conditions.push(
                `p.status = $${parameterIndex}`
            );

            values.push(status);
            parameterIndex++;
        }

        if (type) {
            conditions.push(
                `p.type = $${parameterIndex}`
            );

            values.push(type);
            parameterIndex++;
        }

        if (search) {
            conditions.push(
                `
                (
                    p.name ILIKE $${parameterIndex}
                    OR p.slug ILIKE $${parameterIndex}
                    OR COALESCE(
                        p.description,
                        ''
                    ) ILIKE $${parameterIndex}
                )
                `
            );

            values.push(`%${search}%`);
            parameterIndex++;
        }

        const result = await client.query(
            `
            SELECT COUNT(*)::integer AS count
            FROM products p
            WHERE ${conditions.join(" AND ")}
            `,
            values
        );

        return result.rows[0].count;
    },

    async updateProduct(
        client,
        productId,
        data
    ) {
        const result = await client.query(
            `
            WITH updated AS (
                UPDATE products
                SET
                    branch_id = COALESCE(
                        $2,
                        branch_id
                    ),
                    category_id = COALESCE(
                        $3,
                        category_id
                    ),
                    name = COALESCE(
                        $4,
                        name
                    ),
                    slug = COALESCE(
                        $5,
                        slug
                    ),
                    description = COALESCE(
                        $6,
                        description
                    ),
                    type = COALESCE(
                        $7,
                        type
                    ),
                    cost_price = COALESCE(
                        $8,
                        cost_price
                    ),
                    selling_price = COALESCE(
                        $9,
                        selling_price
                    ),
                    stock = COALESCE(
                        $10,
                        stock
                    ),
                    low_stock_threshold = COALESCE(
                        $11,
                        low_stock_threshold
                    ),
                    updated_at = NOW()
                WHERE id = $1
                RETURNING *
            )
            SELECT
                p.*,
                b.name AS branch_name,
                c.name AS category_name
            FROM updated p
            INNER JOIN branches b
                ON b.id = p.branch_id
            INNER JOIN categories c
                ON c.id = p.category_id
            `,
            [
                productId,
                data.branchId ?? null,
                data.categoryId ?? null,
                data.name ?? null,
                data.slug ?? null,
                data.description ?? null,
                data.type ?? null,
                data.costPrice ?? null,
                data.sellingPrice ?? null,
                data.stock ?? null,
                data.lowStockThreshold ?? null,
            ]
        );

        return result.rows[0] ?? null;
    },

    async updateProductStatus(
        client,
        productId,
        status
    ) {
        const result = await client.query(
            `
            WITH updated AS (
                UPDATE products
                SET
                    status = $2,
                    updated_at = NOW()
                WHERE id = $1
                RETURNING *
            )
            SELECT
                p.*,
                b.name AS branch_name,
                c.name AS category_name
            FROM updated p
            INNER JOIN branches b
                ON b.id = p.branch_id
            INNER JOIN categories c
                ON c.id = p.category_id
            `,
            [productId, status]
        );

        return result.rows[0] ?? null;
    },

    async deleteProduct(
        client,
        productId
    ) {
        const result = await client.query(
            `
            DELETE FROM products
            WHERE id = $1
            RETURNING *
            `,
            [productId]
        );

        return result.rows[0] ?? null;
    },

    async getBranchForAccount(
        client,
        branchId,
        accountId
    ) {
        const result = await client.query(
            `
            SELECT
                id,
                account_id,
                name,
                status
            FROM branches
            WHERE id = $1
                AND account_id = $2
            LIMIT 1
            `,
            [branchId, accountId]
        );

        return result.rows[0] ?? null;
    },

    async getCategoryForAccount(
        client,
        categoryId,
        accountId
    ) {
        const result = await client.query(
            `
            SELECT
                id,
                account_id,
                name,
                scope
            FROM categories
            WHERE id = $1
                AND (
                    scope = 'global'
                    OR (
                        scope = 'account'
                        AND account_id = $2
                    )
                )
            LIMIT 1
            `,
            [categoryId, accountId]
        );

        return result.rows[0] ?? null;
    },

    async getCategories(
        client,
        accountId
    ) {
        const result = await client.query(
            `
            SELECT
                id,
                account_id,
                name,
                scope,
                created_at,
                updated_at
            FROM categories
            WHERE scope = 'global'
                OR (
                    scope = 'account'
                    AND account_id = $1
                )
            ORDER BY
                scope ASC,
                name ASC,
                id ASC
            `,
            [accountId]
        );

        return result.rows;
    },

    async getCategoryById(
        client,
        categoryId
    ) {
        const result = await client.query(
            `
            SELECT
                id,
                account_id,
                name,
                scope,
                created_at,
                updated_at
            FROM categories
            WHERE id = $1
            LIMIT 1
            `,
            [categoryId]
        );

        return result.rows[0] ?? null;
    },

    async createCategory(
        client,
        data
    ) {
        const result = await client.query(
            `
            INSERT INTO categories (
                account_id,
                name,
                scope
            )
            VALUES ($1, $2, 'account')
            RETURNING
                id,
                account_id,
                name,
                scope,
                created_at,
                updated_at
            `,
            [
                data.accountId,
                data.name,
            ]
        );

        return result.rows[0];
    },

    async updateCategory(
        client,
        categoryId,
        data
    ) {
        const result = await client.query(
            `
            UPDATE categories
            SET
                name = COALESCE(
                    $2,
                    name
                ),
                updated_at = NOW()
            WHERE id = $1
                AND scope = 'account'
            RETURNING
                id,
                account_id,
                name,
                scope,
                created_at,
                updated_at
            `,
            [
                categoryId,
                data.name ?? null,
            ]
        );

        return result.rows[0] ?? null;
    },

    async deleteCategory(
        client,
        categoryId
    ) {
        const result = await client.query(
            `
            DELETE FROM categories
            WHERE id = $1
                AND scope = 'account'
            RETURNING
                id,
                account_id,
                name,
                scope,
                created_at,
                updated_at
            `,
            [categoryId]
        );

        return result.rows[0] ?? null;
    },

    async getProductPhotos(
        client,
        productId
    ) {
        const result = await client.query(
            `
            SELECT
                id,
                product_id,
                provider,
                object_key,
                url,
                position,
                created_at,
                updated_at
            FROM product_photos
            WHERE product_id = $1
            ORDER BY position ASC
            `,
            [productId]
        );

        return result.rows;
    },

    async createProductPhoto(client, data) {
        const result = await client.query(
            `
            INSERT INTO product_photos (
                product_id,
                provider,
                object_key,
                url,
                position
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING
                id,
                product_id,
                provider,
                object_key,
                url,
                position,
                created_at,
                updated_at
            `,
            [
                data.productId,
                data.provider,
                data.objectKey,
                data.url,
                data.position,
            ]
        );

        return result.rows[0];
    },

    async deleteProductPhoto(
        client,
        photoId,
        productId
    ) {
        const result = await client.query(
            `
            DELETE FROM product_photos
            WHERE id = $1
                AND product_id = $2
            RETURNING
                id,
                product_id,
                provider,
                object_key,
                url,
                position
            `,
            [photoId, productId]
        );

        return result.rows[0] || null;
    },

    async deleteProductPhotos(
        client,
        productId
    ) {
        await client.query(
            `
            DELETE FROM product_photos
            WHERE product_id = $1
            `,
            [productId]
        );
    },

    async getProductPhotoByPosition(
        client,
        productId,
        position
    ) {
        const result = await client.query(
            `
            SELECT
                id,
                product_id,
                provider,
                object_key,
                url,
                position,
                created_at,
                updated_at
            FROM product_photos
            WHERE product_id = $1
                AND position = $2
            LIMIT 1
            `,
            [productId, position]
        );

        return result.rows[0] ?? null;
    },

    async getProductPhotoCount(
        client,
        productId
    ) {
        const result = await client.query(
            `
            SELECT COUNT(*)::INTEGER AS count
            FROM product_photos
            WHERE product_id = $1
            `,
            [productId]
        );

        return result.rows[0].count;
    },

    async updateProductPhotoPosition(
        client,
        photoId,
        position
    ) {
        const result = await client.query(
            `
            UPDATE product_photos
            SET
                position = $2,
                updated_at = NOW()
            WHERE id = $1
            RETURNING
                id,
                product_id,
                provider,
                object_key,
                url,
                position,
                created_at,
                updated_at
            `,
            [photoId, position]
        );

        return result.rows[0] ?? null;
    },

    async updateProductPhoto(
        client,
        photoId,
        data
    ) {
        const result = await client.query(
            `
            UPDATE product_photos
            SET
                provider = COALESCE(
                    $2,
                    provider
                ),
                object_key = COALESCE(
                    $3,
                    object_key
                ),
                url = COALESCE(
                    $4,
                    url
                ),
                position = COALESCE(
                    $5,
                    position
                ),
                updated_at = NOW()
            WHERE id = $1
            RETURNING
                id,
                product_id,
                provider,
                object_key,
                url,
                position,
                created_at,
                updated_at
            `,
            [
                photoId,
                data.provider ?? null,
                data.objectKey ?? null,
                data.url ?? null,
                data.position ?? null,
            ]
        );

        return result.rows[0] ?? null;
    },

    async getProductPhotoById(
        client,
        productId,
        photoId
    ) {
        const result = await client.query(
            `
            SELECT
                id,
                product_id,
                provider,
                object_key,
                url,
                position,
                created_at,
                updated_at
            FROM product_photos
            WHERE id = $1
                AND product_id = $2
            LIMIT 1
            `,
            [photoId, productId]
        );

        return result.rows[0] || null;
    },

    async reorderProductPhotos(
        client,
        productId,
        photoIds
    ) {
        await client.query(
            `
            UPDATE product_photos
            SET position = position + 100
            WHERE product_id = $1
            `,
            [productId]
        );

        for (
            let index = 0;
            index < photoIds.length;
            index++
        ) {
            await client.query(
                `
                UPDATE product_photos
                SET
                    position = $1,
                    updated_at = NOW()
                WHERE id = $2
                    AND product_id = $3
                `,
                [
                    index + 1,
                    photoIds[index],
                    productId,
                ]
            );
        }

        const result = await client.query(
            `
            SELECT
                id,
                product_id,
                provider,
                object_key,
                url,
                position,
                created_at,
                updated_at
            FROM product_photos
            WHERE product_id = $1
            ORDER BY position ASC
            `,
            [productId]
        );

        return result.rows;
    },
};

export default ProductRepository;