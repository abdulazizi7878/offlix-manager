// file: services/product.service.js

import pool from "@/lib/database";
import AppError from "@/lib/errors/AppError";
import BranchRepository from "@/repositories/branch.repository";
import ProductRepository from "@/repositories/product.repository";
import AuthorizationService from "@/services/authorization.service";
import Storage from "@/lib/storage";

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PRODUCT_PHOTOS = 6;

const ProductService = {

    async generateUniqueSlug(
        client,
        name,
        excludeProductId = null
    ) {
        const baseSlug =
            name
                .trim()
                .normalize("NFKD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "") || "product";

        let slug = baseSlug;
        let counter = 2;

        while (
            await ProductRepository.slugExists(
                client,
                slug,
                excludeProductId
            )
        ) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        return slug;
    },

    async createProduct(userId, accountId, data) {
        let client;
        const uploadedPhotosForCleanup = [];

        try {
            /*
             * 1. Get database client
             */
            client = await pool.connect();

            /*
             * 2. Validate branch
             */
            const branch =
                await BranchRepository.getBranchById(
                    client,
                    data.branchId,
                    accountId
                );

            if (!branch) {
                throw new AppError(
                    "Branch not found.",
                    404,
                    "BRANCH_NOT_FOUND"
                );
            }

            /*
             * 3. Validate category
             */
            const category =
                await ProductRepository.getCategoryById(
                    client,
                    data.categoryId,
                    accountId
                );

            if (!category) {
                throw new AppError(
                    "Category not found.",
                    404,
                    "CATEGORY_NOT_FOUND"
                );
            }

            /*
             * 4. Validate photos
             */
            if (
                data.photos &&
                data.photos.length > MAX_PRODUCT_PHOTOS
            ) {
                throw new AppError(
                    `A product can have a maximum of ${MAX_PRODUCT_PHOTOS} photos.`,
                    400,
                    "TOO_MANY_PRODUCT_PHOTOS"
                );
            }

            /*
             * 5. Upload photos before transaction
             */
            const uploadedPhotos = [];

            if (data.photos?.length) {
                for (
                    let index = 0;
                    index < data.photos.length;
                    index++
                ) {
                    const photo = data.photos[index];

                    const uploaded =
                        await Storage.upload(photo);

                    uploadedPhotos.push({
                        provider: uploaded.provider,
                        objectKey: uploaded.objectKey,
                        url: uploaded.url,
                        position: index + 1,
                    });

                    uploadedPhotosForCleanup.push({
                        provider: uploaded.provider,
                        objectKey: uploaded.objectKey,
                    });
                }
            }

            /*
             * 6. Start transaction
             */
            await client.query("BEGIN");

            /*
             * 7. Create product with
             *    concurrency-safe slug generation
             */
            let product = null;

            for (let attempt = 0; attempt < 20; attempt++) {
                const slug =
                    await this.generateUniqueSlug(
                        client,
                        data.name
                    );

                await client.query(
                    "SAVEPOINT product_slug_attempt"
                );

                try {
                    product =
                        await ProductRepository.createProduct(
                            client,
                            {
                                accountId,
                                branchId: data.branchId,
                                categoryId: data.categoryId,
                                name: data.name,
                                slug,
                                description: data.description,
                                type: data.type,
                                costPrice: data.costPrice,
                                sellingPrice: data.sellingPrice,
                                stock: data.stock,
                                lowStockThreshold:
                                    data.lowStockThreshold,
                                status: data.status,
                            }
                        );

                    await client.query(
                        "RELEASE SAVEPOINT product_slug_attempt"
                    );

                    break;
                } catch (error) {
                    if (
                        error.code !== "23505" ||
                        error.constraint !==
                        "products_slug_key"
                    ) {
                        throw error;
                    }

                    await client.query(
                        "ROLLBACK TO SAVEPOINT product_slug_attempt"
                    );
                }
            }

            if (!product) {
                throw new AppError(
                    "Could not generate a unique product slug. Please try again.",
                    409,
                    "PRODUCT_SLUG_GENERATION_FAILED"
                );
            }

            /*
             * 8. Create branch purchase
             */
            if (data.purchase) {
                await ProductRepository.createBranchPurchase(
                    client,
                    {
                        accountId,
                        branchId: data.branchId,
                        createdByUserId: userId,
                        productId: product.id,
                        productName: product.name,
                        quantity: data.stock,
                        costPrice: data.costPrice,
                        paymentSource:
                            data.purchase.paymentSource,
                        notes: data.purchase.notes ?? null,
                    }
                );
            }

            /*
             * 9. Create product photos
             */
            for (const photo of uploadedPhotos) {
                await ProductRepository.createProductPhoto(
                    client,
                    {
                        productId: product.id,
                        provider: photo.provider,
                        objectKey: photo.objectKey,
                        url: photo.url,
                        position: photo.position,
                    }
                );
            }

            /*
             * 10. Commit
             */
            await client.query("COMMIT");

            return product;
        } catch (error) {
            if (client) {
                try {
                    await client.query("ROLLBACK");
                } catch (rollbackError) {
                    console.error(
                        "ProductService.createProduct rollback:",
                        rollbackError
                    );
                }
            }

            /*
             * Delete uploaded photos if database operation failed
             */
            for (
                const uploadedPhoto
                of uploadedPhotosForCleanup
            ) {
                try {
                    await Storage.delete(
                        uploadedPhoto
                    );
                } catch (cleanupError) {
                    console.error(
                        "Failed to delete uploaded product photo:",
                        cleanupError
                    );
                }
            }

            if (error instanceof AppError) {
                throw error;
            }

            if (
                error.code === "23505" &&
                error.constraint ===
                "products_slug_key"
            ) {
                throw new AppError(
                    "Could not generate a unique product slug. Please try again.",
                    409,
                    "PRODUCT_SLUG_GENERATION_FAILED"
                );
            }

            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    }, 

    async getProducts(
        userId,
        accountId,
        options = {}
    ) {
        const client = await pool.connect();

        try {
            await AuthorizationService.assertAccountMember(
                client,
                userId,
                accountId
            );

            const page = Math.max(
                Number(options.page) || 1,
                1
            );

            const limit = Math.min(
                Math.max(
                    Number(options.limit) ||
                    DEFAULT_PAGE_SIZE,
                    1
                ),
                MAX_PAGE_SIZE
            );

            const branchId =
                options.branchId ?? null;

            /*
             * -------------------------------------------------------
             * Branch filter authorization
             * -------------------------------------------------------
             */

            if (branchId) {
                const branch =
                    await ProductRepository.getBranchForAccount(
                        client,
                        branchId,
                        accountId
                    );

                if (!branch) {
                    throw new AppError(
                        "Branch not found.",
                        404,
                        "BRANCH_NOT_FOUND"
                    );
                }

                await AuthorizationService.assertBranchPermission(
                    client,
                    userId,
                    accountId,
                    branchId,
                    "products.view"
                );
            }

            /*
             * -------------------------------------------------------
             * Category validation
             * -------------------------------------------------------
             */

            if (options.categoryId) {
                const category =
                    await ProductRepository.getCategoryForAccount(
                        client,
                        options.categoryId,
                        accountId
                    );

                if (!category) {
                    throw new AppError(
                        "Category not found.",
                        404,
                        "CATEGORY_NOT_FOUND"
                    );
                }
            }

            const isCreator =
                await AuthorizationService.isAccountCreator(
                    client,
                    userId,
                    accountId
                );

            const repositoryOptions = {
                ...options,
                page,
                limit,
            };

            const [
                products,
                total,
            ] = await Promise.all([
                ProductRepository.getProductsByAccountId(
                    client,
                    accountId,
                    userId,
                    isCreator,
                    repositoryOptions
                ),

                ProductRepository.countProductsByAccountId(
                    client,
                    accountId,
                    userId,
                    isCreator,
                    repositoryOptions
                ),
            ]);

            const totalPages =
                Math.ceil(total / limit);

            return {
                products,

                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,

                    hasNextPage:
                        page < totalPages,

                    hasPreviousPage:
                        page > 1,
                },
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "ProductService.getProducts:",
                error
            );

            throw new AppError(
                "Failed to retrieve products.",
                500,
                "PRODUCTS_FETCH_FAILED"
            );
        } finally {
            client.release();
        }
    },

    async getProduct(
        userId,
        accountId,
        productId
    ) {
        const client = await pool.connect();

        try {
            const product =
                await ProductRepository.getProductByIdForAccount(
                    client,
                    productId,
                    accountId
                );

            if (!product) {
                throw new AppError(
                    "Product not found.",
                    404,
                    "PRODUCT_NOT_FOUND"
                );
            }

            await AuthorizationService.assertBranchPermission(
                client,
                userId,
                accountId,
                product.branch_id,
                "products.view"
            );

            const photos =
                await ProductRepository.getProductPhotos(
                    client,
                    product.id
                );

            return {
                ...product,
                photos,
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "ProductService.getProduct:",
                error
            );

            throw new AppError(
                "Failed to get product.",
                500,
                "PRODUCT_FETCH_FAILED"
            );
        } finally {
            client.release();
        }
    },

    async updateProduct(
        userId,
        accountId,
        productId,
        data
    ) {
        let client;

        try {
            client = await pool.connect();

            /*
             * 1. Get existing product
             */
            const product =
                await ProductRepository.getProductByIdForAccount(
                    client,
                    productId,
                    accountId
                );

            if (!product) {
                throw new AppError(
                    "Product not found.",
                    404,
                    "PRODUCT_NOT_FOUND"
                );
            }

            /*
             * 2. Build update data
             *
             * Slug must NEVER come from the client.
             */
            const updateData = {
                ...data,
            };

            delete updateData.slug;

            /*
             * 3. Determine whether product name changed
             */
            const nameChanged =
                data.name !== undefined &&
                data.name.trim() !== product.name;

            /*
             * 4. Start transaction
             */
            await client.query("BEGIN");

            /*
             * 5. Update product
             *
             * If the name changed:
             *     generate a new unique slug.
             *
             * If the name did not change:
             *     keep the existing slug.
             */
            let updatedProduct = null;

            for (let attempt = 0; attempt < 20; attempt++) {
                const currentUpdateData = {
                    ...updateData,
                };

                if (nameChanged) {
                    currentUpdateData.slug =
                        await this.generateUniqueSlug(
                            client,
                            data.name,
                            product.id
                        );
                }

                await client.query(
                    "SAVEPOINT product_slug_attempt"
                );

                try {
                    updatedProduct =
                        await ProductRepository.updateProduct(
                            client,
                            product.id,
                            currentUpdateData
                        );

                    await client.query(
                        "RELEASE SAVEPOINT product_slug_attempt"
                    );

                    break;
                } catch (error) {
                    if (
                        error.code !== "23505" ||
                        error.constraint !==
                        "products_slug_key"
                    ) {
                        throw error;
                    }

                    await client.query(
                        "ROLLBACK TO SAVEPOINT product_slug_attempt"
                    );
                }
            }

            if (!updatedProduct) {
                throw new AppError(
                    "Could not generate a unique product slug. Please try again.",
                    409,
                    "PRODUCT_SLUG_GENERATION_FAILED"
                );
            }

            /*
             * 6. Commit
             */
            await client.query("COMMIT");

            return updatedProduct;
        } catch (error) {
            if (client) {
                try {
                    await client.query("ROLLBACK");
                } catch (rollbackError) {
                    console.error(
                        "ProductService.updateProduct rollback:",
                        rollbackError
                    );
                }
            }

            if (error instanceof AppError) {
                throw error;
            }

            if (
                error.code === "23505" &&
                error.constraint ===
                "products_slug_key"
            ) {
                throw new AppError(
                    "Could not generate a unique product slug. Please try again.",
                    409,
                    "PRODUCT_SLUG_GENERATION_FAILED"
                );
            }

            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }
    },

    async updateProductStatus(
        userId,
        accountId,
        productId,
        status
    ) {
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            const product =
                await ProductRepository.getProductByIdForAccount(
                    client,
                    productId,
                    accountId
                );

            if (!product) {
                throw new AppError(
                    "Product not found.",
                    404,
                    "PRODUCT_NOT_FOUND"
                );
            }

            await AuthorizationService.assertBranchPermission(
                client,
                userId,
                accountId,
                product.branch_id,
                "products.update"
            );

            const updatedProduct =
                await ProductRepository.updateProductStatus(
                    client,
                    product.id,
                    status
                );

            await client.query("COMMIT");

            return updatedProduct;
        } catch (error) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error(
                    "ProductService.updateProductStatus rollback:",
                    rollbackError
                );
            }

            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "ProductService.updateProductStatus:",
                error
            );

            throw new AppError(
                "Failed to update product status.",
                500,
                "PRODUCT_STATUS_UPDATE_FAILED"
            );
        } finally {
            client.release();
        }
    },

    async deleteProduct(
        userId,
        accountId,
        productId
    ) {
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            const product =
                await ProductRepository.getProductByIdForAccount(
                    client,
                    productId,
                    accountId
                );

            if (!product) {
                throw new AppError(
                    "Product not found.",
                    404,
                    "PRODUCT_NOT_FOUND"
                );
            }

            await AuthorizationService.assertBranchPermission(
                client,
                userId,
                accountId,
                product.branch_id,
                "products.delete"
            );

            /*
             * Capture product photos before deleting the product.
             *
             * product_photos rows are deleted automatically by
             * ON DELETE CASCADE, so we need their storage metadata
             * before the database deletion.
             */
            const photos =
                await ProductRepository.getProductPhotos(
                    client,
                    product.id
                );

            const deletedProduct =
                await ProductRepository.deleteProduct(
                    client,
                    product.id
                );

            if (!deletedProduct) {
                throw new AppError(
                    "Product could not be deleted.",
                    400,
                    "PRODUCT_DELETE_FAILED"
                );
            }

            await client.query("COMMIT");

            /*
             * Database deletion succeeded.
             *
             * Now remove the actual image objects from storage.
             */
            for (const photo of photos) {
                try {
                    await Storage.delete({
                        provider: photo.provider,
                        objectKey: photo.object_key,
                    });
                } catch (storageError) {
                    console.error(
                        "ProductService.deleteProduct storage cleanup:",
                        {
                            productId: product.id,
                            photoId: photo.id,
                            provider: photo.provider,
                            objectKey: photo.object_key,
                            error: storageError,
                        }
                    );
                }
            }

            return deletedProduct;
        } catch (error) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error(
                    "ProductService.deleteProduct rollback:",
                    rollbackError
                );
            }

            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "ProductService.deleteProduct:",
                error
            );

            throw new AppError(
                "Failed to delete product.",
                500,
                "PRODUCT_DELETE_FAILED"
            );
        } finally {
            client.release();
        }
    },
    /*
     * ===============================================================
     * PRODUCT PHOTOS
     * ===============================================================
     */

    async addProductPhotos(
        userId,
        accountId,
        productId,
        files
    ) {
        if (!files || files.length === 0) {
            throw new AppError(
                "At least one photo is required.",
                400,
                "PHOTOS_REQUIRED"
            );
        }

        if (files.length > MAX_PRODUCT_PHOTOS) {
            throw new AppError(
                `You can upload a maximum of ${MAX_PRODUCT_PHOTOS} photos at once.`,
                400,
                "PRODUCT_PHOTO_LIMIT_EXCEEDED"
            );
        }

        const client = await pool.connect();
        const uploadedPhotos = [];

        try {
            const product =
                await ProductRepository.getProductByIdForAccount(
                    client,
                    productId,
                    accountId
                );

            if (!product) {
                throw new AppError(
                    "Product not found.",
                    404,
                    "PRODUCT_NOT_FOUND"
                );
            }

            await AuthorizationService.assertBranchPermission(
                client,
                userId,
                accountId,
                product.branch_id,
                "products.update"
            );

            const currentPhotoCount =
                await ProductRepository.getProductPhotoCount(
                    client,
                    productId
                );

            if (
                currentPhotoCount + files.length >
                MAX_PRODUCT_PHOTOS
            ) {
                throw new AppError(
                    `A product can have a maximum of ${MAX_PRODUCT_PHOTOS} photos.`,
                    400,
                    "PRODUCT_PHOTO_LIMIT_EXCEEDED"
                );
            }

            /*
             * Upload files first.
             */

            for (const file of files) {
                const uploaded =
                    await Storage.upload(file);

                uploadedPhotos.push(uploaded);
            }

            await client.query("BEGIN");

            let position =
                currentPhotoCount + 1;

            for (const photo of uploadedPhotos) {
                await ProductRepository.createProductPhoto(
                    client,
                    {
                        productId,
                        provider:
                            photo.provider,
                        objectKey:
                            photo.objectKey,
                        url: photo.url,
                        position,
                    }
                );

                position++;
            }

            const photos =
                await ProductRepository.getProductPhotos(
                    client,
                    productId
                );

            await client.query("COMMIT");

            return {
                product,
                photos,
            };
        } catch (error) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error(
                    "ProductService.addProductPhotos rollback:",
                    rollbackError
                );
            }

            /*
             * Remove uploaded files if DB insertion failed.
             */

            await Promise.allSettled(
                uploadedPhotos.map((photo) =>
                    Storage.delete({
                        provider:
                            photo.provider,
                        objectKey:
                            photo.objectKey,
                    })
                )
            );

            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "ProductService.addProductPhotos:",
                error
            );

            throw new AppError(
                "Failed to add product photos.",
                500,
                "PRODUCT_PHOTOS_ADD_FAILED"
            );
        } finally {
            client.release();
        }
    },

    async deleteProductPhoto(
        userId,
        accountId,
        productId,
        photoId
    ) {
        const client = await pool.connect();

        try {
            const product =
                await ProductRepository.getProductByIdForAccount(
                    client,
                    productId,
                    accountId
                );

            if (!product) {
                throw new AppError(
                    "Product not found.",
                    404,
                    "PRODUCT_NOT_FOUND"
                );
            }

            await AuthorizationService.assertBranchPermission(
                client,
                userId,
                accountId,
                product.branch_id,
                "products.update"
            );

            const photo =
                await ProductRepository.getProductPhotoById(
                    client,
                    productId,
                    photoId
                );

            if (!photo) {
                throw new AppError(
                    "Product photo not found.",
                    404,
                    "PRODUCT_PHOTO_NOT_FOUND"
                );
            }

            const photoCount =
                await ProductRepository.getProductPhotoCount(
                    client,
                    productId
                );

            /*
             * Public products cannot lose their final photo.
             */

            if (
                product.type === "public" &&
                photoCount <= 1
            ) {
                throw new AppError(
                    "A public product must have at least one photo.",
                    400,
                    "PUBLIC_PRODUCT_PHOTO_REQUIRED"
                );
            }

            await client.query("BEGIN");

            const deletedPhoto =
                await ProductRepository.deleteProductPhoto(
                    client,
                    photoId,
                    productId
                );

            if (!deletedPhoto) {
                throw new AppError(
                    "Product photo not found.",
                    404,
                    "PRODUCT_PHOTO_NOT_FOUND"
                );
            }

            /*
             * Close the position gap.
             *
             * Example:
             *
             * 1, 2, 3, 4
             *
             * delete 2
             *
             * 1, 2, 3
             */

            await client.query(
                `
                UPDATE product_photos
                SET
                    position = position - 1,
                    updated_at = NOW()
                WHERE product_id = $1
                    AND position > $2
                `,
                [
                    productId,
                    deletedPhoto.position,
                ]
            );

            const photos =
                await ProductRepository.getProductPhotos(
                    client,
                    productId
                );

            await client.query("COMMIT");

            /*
             * Delete the actual object from the correct
             * storage provider.
             */

            try {
                await Storage.delete({
                    provider:
                        deletedPhoto.provider,
                    objectKey:
                        deletedPhoto.object_key,
                });
            } catch (storageError) {
                console.error(
                    "ProductService.deleteProductPhoto storage cleanup:",
                    storageError
                );
            }

            return {
                product,
                photos,
            };
        } catch (error) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error(
                    "ProductService.deleteProductPhoto rollback:",
                    rollbackError
                );
            }

            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "ProductService.deleteProductPhoto:",
                error
            );

            throw new AppError(
                "Failed to delete product photo.",
                500,
                "PRODUCT_PHOTO_DELETE_FAILED"
            );
        } finally {
            client.release();
        }
    },

    async reorderProductPhotos(
        userId,
        accountId,
        productId,
        photoIds
    ) {
        if (
            !Array.isArray(photoIds) ||
            photoIds.length === 0
        ) {
            throw new AppError(
                "Photo order is required.",
                400,
                "PHOTO_ORDER_REQUIRED"
            );
        }

        const client = await pool.connect();

        try {
            const product =
                await ProductRepository.getProductByIdForAccount(
                    client,
                    productId,
                    accountId
                );

            if (!product) {
                throw new AppError(
                    "Product not found.",
                    404,
                    "PRODUCT_NOT_FOUND"
                );
            }

            await AuthorizationService.assertBranchPermission(
                client,
                userId,
                accountId,
                product.branch_id,
                "products.update"
            );

            const photos =
                await ProductRepository.getProductPhotos(
                    client,
                    productId
                );

            /*
             * Every existing photo must be included.
             */

            if (
                photos.length !==
                photoIds.length
            ) {
                throw new AppError(
                    "You must provide every product photo when reordering.",
                    400,
                    "INVALID_PHOTO_ORDER"
                );
            }

            /*
             * Prevent duplicate IDs.
             */

            const uniqueIds =
                new Set(photoIds);

            if (
                uniqueIds.size !==
                photoIds.length
            ) {
                throw new AppError(
                    "Duplicate photo IDs are not allowed.",
                    400,
                    "DUPLICATE_PHOTO_IDS"
                );
            }

            /*
             * Verify every ID belongs to this product.
             */

            const existingIds =
                new Set(
                    photos.map(
                        (photo) => photo.id
                    )
                );

            for (const photoId of photoIds) {
                if (
                    !existingIds.has(
                        photoId
                    )
                ) {
                    throw new AppError(
                        "One or more photo IDs do not belong to this product.",
                        400,
                        "INVALID_PHOTO_ORDER"
                    );
                }
            }

            await client.query("BEGIN");

            const reorderedPhotos =
                await ProductRepository.reorderProductPhotos(
                    client,
                    productId,
                    photoIds
                );

            await client.query("COMMIT");

            return {
                product,
                photos: reorderedPhotos,
            };
        } catch (error) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error(
                    "ProductService.reorderProductPhotos rollback:",
                    rollbackError
                );
            }

            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "ProductService.reorderProductPhotos:",
                error
            );

            throw new AppError(
                "Failed to reorder product photos.",
                500,
                "PRODUCT_PHOTOS_REORDER_FAILED"
            );
        } finally {
            client.release();
        }
    },

    /*
     * ===============================================================
     * CATEGORIES
     * ===============================================================
     */

    async getCategories(
        userId,
        accountId
    ) {
        const client = await pool.connect();

        try {
            await AuthorizationService.assertAccountMember(
                client,
                userId,
                accountId
            );

            return await ProductRepository.getCategories(
                client,
                accountId
            );
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "ProductService.getCategories:",
                error
            );

            throw new AppError(
                "Failed to get categories.",
                500,
                "CATEGORIES_FETCH_FAILED"
            );
        } finally {
            client.release();
        }
    },

    async createCategory(
        userId,
        accountId,
        data
    ) {
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            await AuthorizationService.assertAccountMember(
                client,
                userId,
                accountId
            );

            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "products.create"
            );

            const category =
                await ProductRepository.createCategory(
                    client,
                    {
                        accountId,
                        name: data.name,
                    }
                );

            await client.query("COMMIT");

            return category;
        } catch (error) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error(
                    "ProductService.createCategory rollback:",
                    rollbackError
                );
            }

            if (error instanceof AppError) {
                throw error;
            }

            if (error.code === "23505") {
                throw new AppError(
                    "A category with this name already exists.",
                    409,
                    "CATEGORY_ALREADY_EXISTS"
                );
            }

            console.error(
                "ProductService.createCategory:",
                error
            );

            throw new AppError(
                "Failed to create category.",
                500,
                "CATEGORY_CREATE_FAILED"
            );
        } finally {
            client.release();
        }
    },

    async updateCategory(
        userId,
        accountId,
        categoryId,
        data
    ) {
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            await AuthorizationService.assertAccountMember(
                client,
                userId,
                accountId
            );

            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "products.update"
            );

            const category =
                await ProductRepository.getCategoryById(
                    client,
                    categoryId
                );

            if (
                !category ||
                category.scope !== "account" ||
                category.account_id !== accountId
            ) {
                throw new AppError(
                    "Category not found.",
                    404,
                    "CATEGORY_NOT_FOUND"
                );
            }

            const updatedCategory =
                await ProductRepository.updateCategory(
                    client,
                    categoryId,
                    data
                );

            await client.query("COMMIT");

            return updatedCategory;
        } catch (error) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error(
                    "ProductService.updateCategory rollback:",
                    rollbackError
                );
            }

            if (error instanceof AppError) {
                throw error;
            }

            if (error.code === "23505") {
                throw new AppError(
                    "A category with this name already exists.",
                    409,
                    "CATEGORY_ALREADY_EXISTS"
                );
            }

            console.error(
                "ProductService.updateCategory:",
                error
            );

            throw new AppError(
                "Failed to update category.",
                500,
                "CATEGORY_UPDATE_FAILED"
            );
        } finally {
            client.release();
        }
    },

    async deleteCategory(
        userId,
        accountId,
        categoryId
    ) {
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            await AuthorizationService.assertAccountMember(
                client,
                userId,
                accountId
            );

            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "products.update"
            );

            const category =
                await ProductRepository.getCategoryById(
                    client,
                    categoryId
                );

            if (
                !category ||
                category.scope !== "account" ||
                category.account_id !== accountId
            ) {
                throw new AppError(
                    "Category not found.",
                    404,
                    "CATEGORY_NOT_FOUND"
                );
            }

            const deletedCategory =
                await ProductRepository.deleteCategory(
                    client,
                    categoryId
                );

            await client.query("COMMIT");

            return deletedCategory;
        } catch (error) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error(
                    "ProductService.deleteCategory rollback:",
                    rollbackError
                );
            }

            if (error instanceof AppError) {
                throw error;
            }

            if (error.code === "23503") {
                throw new AppError(
                    "This category cannot be deleted because it is being used by products.",
                    409,
                    "CATEGORY_IN_USE"
                );
            }

            console.error(
                "ProductService.deleteCategory:",
                error
            );

            throw new AppError(
                "Failed to delete category.",
                500,
                "CATEGORY_DELETE_FAILED"
            );
        } finally {
            client.release();
        }
    },
};

export default ProductService;