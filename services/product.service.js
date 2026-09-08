// file: services/product.service.js

import pool from "@/lib/database";
import AppError from "@/lib/errors/AppError";
import ProductRepository from "@/repositories/product.repository";
import AuthorizationService from "@/services/authorization.service";
import Storage from "@/lib/storage";

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PRODUCT_PHOTOS = 6;

const ProductService = {
    async createProduct(userId, accountId, data) {
        const client = await pool.connect();
        const uploadedPhotos = [];

        try {
            /*
             * -------------------------------------------------------
             * 1. Authorization
             * -------------------------------------------------------
             */

            await AuthorizationService.assertAccountMember(
                client,
                userId,
                accountId
            );

            const branch =
                await ProductRepository.getBranchForAccount(
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

            await AuthorizationService.assertBranchPermission(
                client,
                userId,
                accountId,
                data.branchId,
                "products.create"
            );

            /*
             * -------------------------------------------------------
             * 2. Category validation
             * -------------------------------------------------------
             */

            const category =
                await ProductRepository.getCategoryForAccount(
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
             * -------------------------------------------------------
             * 3. Slug validation
             * -------------------------------------------------------
             */

            const existingProduct =
                await ProductRepository.getProductBySlug(
                    client,
                    data.slug
                );

            if (existingProduct) {
                throw new AppError(
                    "A product with this slug already exists.",
                    409,
                    "PRODUCT_SLUG_ALREADY_EXISTS"
                );
            }

            /*
             * -------------------------------------------------------
             * 4. Photo validation
             * -------------------------------------------------------
             */

            const photos = data.photos ?? [];

            if (photos.length > MAX_PRODUCT_PHOTOS) {
                throw new AppError(
                    `A product can have a maximum of ${MAX_PRODUCT_PHOTOS} photos.`,
                    400,
                    "PRODUCT_PHOTO_LIMIT_EXCEEDED"
                );
            }

            if (
                data.type === "public" &&
                photos.length < 1
            ) {
                throw new AppError(
                    "Public products must have at least one photo.",
                    400,
                    "PUBLIC_PRODUCT_PHOTO_REQUIRED"
                );
            }

            /*
             * -------------------------------------------------------
             * 5. Upload photos
             *
             * Storage decides whether the configured provider
             * is Cloudinary or Cloudflare R2.
             * -------------------------------------------------------
             */

            for (const file of photos) {
                const uploadedPhoto =
                    await Storage.upload(file);

                uploadedPhotos.push(uploadedPhoto);
            }

            /*
             * -------------------------------------------------------
             * 6. Database transaction
             * -------------------------------------------------------
             */

            await client.query("BEGIN");

            const product =
                await ProductRepository.createProduct(
                    client,
                    {
                        accountId,
                        branchId: data.branchId,
                        categoryId: data.categoryId,
                        name: data.name,
                        slug: data.slug,
                        description: data.description,
                        type: data.type,
                        costPrice: data.costPrice,
                        sellingPrice: data.sellingPrice,

                        // Stock
                        stock: data.stock,
                        lowStockThreshold:
                            data.lowStockThreshold,

                        status: data.status,
                    }
                );

            for (
                let index = 0;
                index < uploadedPhotos.length;
                index++
            ) {
                const photo =
                    uploadedPhotos[index];

                await ProductRepository.createProductPhoto(
                    client,
                    {
                        productId: product.id,
                        provider: photo.provider,
                        objectKey: photo.objectKey,
                        url: photo.url,
                        position: index + 1,
                    }
                );
            }

            const productPhotos =
                await ProductRepository.getProductPhotos(
                    client,
                    product.id
                );

            await client.query("COMMIT");

            return {
                ...product,
                photos: productPhotos,
            };
        } catch (error) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error(
                    "ProductService.createProduct rollback:",
                    rollbackError
                );
            }

            /*
             * Storage is outside PostgreSQL transactions.
             *
             * If database creation fails after uploading files,
             * clean those files from their actual providers.
             */

            await Promise.allSettled(
                uploadedPhotos.map((photo) =>
                    Storage.delete({
                        provider: photo.provider,
                        objectKey: photo.objectKey,
                    })
                )
            );

            if (error instanceof AppError) {
                throw error;
            }

            if (error.code === "23505") {
                throw new AppError(
                    "A product with this information already exists.",
                    409,
                    "PRODUCT_ALREADY_EXISTS"
                );
            }

            console.error(
                "ProductService.createProduct:",
                error
            );

            throw new AppError(
                "Failed to create product.",
                500,
                "PRODUCT_CREATE_FAILED"
            );
        } finally {
            client.release();
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
        const client = await pool.connect();
        const uploadedPhotos = [];

        try {
            /*
             * -------------------------------------------------------
             * 1. Get current product
             * -------------------------------------------------------
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

            await AuthorizationService.assertBranchPermission(
                client,
                userId,
                accountId,
                product.branch_id,
                "products.update"
            );

            /*
             * -------------------------------------------------------
             * 2. Validate branch change
             * -------------------------------------------------------
             */

            if (data.branchId) {
                const branch =
                    await ProductRepository.getBranchForAccount(
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

                await AuthorizationService.assertBranchPermission(
                    client,
                    userId,
                    accountId,
                    data.branchId,
                    "products.update"
                );
            }

            /*
             * -------------------------------------------------------
             * 3. Validate category change
             * -------------------------------------------------------
             */

            if (data.categoryId) {
                const category =
                    await ProductRepository.getCategoryForAccount(
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
            }

            /*
             * -------------------------------------------------------
             * 4. Validate slug change
             * -------------------------------------------------------
             */

            if (
                data.slug &&
                data.slug !== product.slug
            ) {
                const existingProduct =
                    await ProductRepository.getProductBySlug(
                        client,
                        data.slug
                    );

                if (
                    existingProduct &&
                    existingProduct.id !== product.id
                ) {
                    throw new AppError(
                        "A product with this slug already exists.",
                        409,
                        "PRODUCT_SLUG_ALREADY_EXISTS"
                    );
                }
            }

            /*
             * -------------------------------------------------------
             * 5. Validate photo replacement
             * -------------------------------------------------------
             */

            if (data.photos) {
                if (
                    data.photos.length >
                    MAX_PRODUCT_PHOTOS
                ) {
                    throw new AppError(
                        `A product can have a maximum of ${MAX_PRODUCT_PHOTOS} photos.`,
                        400,
                        "PRODUCT_PHOTO_LIMIT_EXCEEDED"
                    );
                }

                const resultingType =
                    data.type ?? product.type;

                if (
                    resultingType === "public" &&
                    data.photos.length < 1
                ) {
                    throw new AppError(
                        "Public products must have at least one photo.",
                        400,
                        "PUBLIC_PRODUCT_PHOTO_REQUIRED"
                    );
                }
            } else if (
                data.type === "public" &&
                product.type !== "public"
            ) {
                const photoCount =
                    await ProductRepository.getProductPhotoCount(
                        client,
                        product.id
                    );

                if (photoCount < 1) {
                    throw new AppError(
                        "Public products must have at least one photo.",
                        400,
                        "PUBLIC_PRODUCT_PHOTO_REQUIRED"
                    );
                }
            }

            /*
             * -------------------------------------------------------
             * 6. Upload replacement photos
             * -------------------------------------------------------
             */

            if (data.photos) {
                for (const file of data.photos) {
                    const uploadedPhoto =
                        await Storage.upload(file);

                    uploadedPhotos.push(
                        uploadedPhoto
                    );
                }
            }

            /*
             * -------------------------------------------------------
             * 7. Database transaction
             * -------------------------------------------------------
             */

            await client.query("BEGIN");

            const updatedProduct =
                await ProductRepository.updateProduct(
                    client,
                    product.id,
                    data
                );

            if (!updatedProduct) {
                throw new AppError(
                    "Product could not be updated.",
                    404,
                    "PRODUCT_UPDATE_FAILED"
                );
            }

            let photos;

            if (data.photos) {
                /*
                 * Capture old photos before removing DB rows.
                 */

                const oldPhotos =
                    await ProductRepository.getProductPhotos(
                        client,
                        product.id
                    );

                await ProductRepository.deleteProductPhotos(
                    client,
                    product.id
                );

                for (
                    let index = 0;
                    index < uploadedPhotos.length;
                    index++
                ) {
                    const photo =
                        uploadedPhotos[index];

                    await ProductRepository.createProductPhoto(
                        client,
                        {
                            productId:
                                product.id,
                            provider:
                                photo.provider,
                            objectKey:
                                photo.objectKey,
                            url: photo.url,
                            position:
                                index + 1,
                        }
                    );
                }

                photos =
                    await ProductRepository.getProductPhotos(
                        client,
                        product.id
                    );

                await client.query("COMMIT");

                /*
                 * Delete old objects only after DB commit.
                 */

                await Promise.allSettled(
                    oldPhotos.map((oldPhoto) =>
                        Storage.delete({
                            provider:
                                oldPhoto.provider,
                            objectKey:
                                oldPhoto.object_key,
                        })
                    )
                );

                return {
                    ...updatedProduct,
                    photos,
                };
            }

            /*
             * No photo replacement.
             */

            photos =
                await ProductRepository.getProductPhotos(
                    client,
                    product.id
                );

            await client.query("COMMIT");

            return {
                ...updatedProduct,
                photos,
            };
        } catch (error) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error(
                    "ProductService.updateProduct rollback:",
                    rollbackError
                );
            }

            /*
             * Clean up newly uploaded files when
             * the database operation fails.
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

            if (error.code === "23505") {
                throw new AppError(
                    "A product with this information already exists.",
                    409,
                    "PRODUCT_ALREADY_EXISTS"
                );
            }

            console.error(
                "ProductService.updateProduct:",
                error
            );

            throw new AppError(
                "Failed to update product.",
                500,
                "PRODUCT_UPDATE_FAILED"
            );
        } finally {
            client.release();
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
             * This is intentionally a soft delete.
             */

            const deletedProduct =
                await ProductRepository.updateProductStatus(
                    client,
                    product.id,
                    "inactive"
                );

            await client.query("COMMIT");

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