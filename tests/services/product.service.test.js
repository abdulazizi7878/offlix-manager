import { beforeEach, describe, expect, it, vi } from "vitest";

const {
    mockClient,
    mockPool,
    mockRepository,
    mockAuthorization,
} = vi.hoisted(() => ({
    mockClient: {
        query: vi.fn(),
        release: vi.fn(),
    },

    mockPool: {
        connect: vi.fn(),
    },

    mockRepository: {
        getBranchForAccount: vi.fn(),
        getCategoryForAccount: vi.fn(),
        getProductBySlug: vi.fn(),
        createProduct: vi.fn(),
        createProductPhoto: vi.fn(),
        getProductPhotos: vi.fn(),
        getProductsByAccountId: vi.fn(),
        countProductsByAccountId: vi.fn(),
        getProductByIdForAccount: vi.fn(),
        getProductPhotoCount: vi.fn(),
        updateProduct: vi.fn(),
        deleteProductPhotos: vi.fn(),
        updateProductStatus: vi.fn(),
        getCategories: vi.fn(),
        createCategory: vi.fn(),
        getCategoryById: vi.fn(),
        updateCategory: vi.fn(),
        deleteCategory: vi.fn(),
    },

    mockAuthorization: {
        assertAccountMember: vi.fn(),
        assertBranchPermission: vi.fn(),
        assertPermission: vi.fn(),
        isAccountCreator: vi.fn(),
    },
}));

vi.mock("@/lib/database", () => ({
    default: mockPool,
}));

vi.mock("@/repositories/product.repository", () => ({
    default: mockRepository,
}));

vi.mock("@/services/authorization.service", () => ({
    default: mockAuthorization,
}));

import ProductService from "@/services/product.service";
import AppError from "@/lib/errors/AppError";

describe("ProductService", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockPool.connect.mockResolvedValue(mockClient);

        mockClient.query.mockResolvedValue({
            rows: [],
        });

        mockAuthorization.assertAccountMember.mockResolvedValue(
            true
        );

        mockAuthorization.assertBranchPermission.mockResolvedValue(
            true
        );

        mockAuthorization.assertPermission.mockResolvedValue(
            true
        );

        mockAuthorization.isAccountCreator.mockResolvedValue(
            false
        );

        mockRepository.getBranchForAccount.mockResolvedValue({
            id: "branch-1",
            account_id: "account-1",
        });

        mockRepository.getCategoryForAccount.mockResolvedValue({
            id: "category-1",
            account_id: "account-1",
            scope: "account",
        });

        mockRepository.getProductBySlug.mockResolvedValue(null);

        mockRepository.getProductPhotos.mockResolvedValue([]);

        mockRepository.getProductPhotoCount.mockResolvedValue(0);
    });

    describe("createProduct", () => {
        it("creates a product successfully", async () => {
            const product = {
                id: "product-1",
                account_id: "account-1",
                branch_id: "branch-1",
                category_id: "category-1",
                name: "Test Product",
                slug: "test-product",
                type: "private",
                cost_price: "50.00",
                selling_price: "75.00",
                status: "active",
            };

            mockRepository.createProduct.mockResolvedValue(
                product
            );

            const result =
                await ProductService.createProduct(
                    "user-1",
                    "account-1",
                    {
                        branchId: "branch-1",
                        categoryId: "category-1",
                        name: "Test Product",
                        slug: "test-product",
                        description: "Test description",
                        type: "private",
                        costPrice: 50,
                        sellingPrice: 75,
                        status: "active",
                        photos: [],
                    }
                );

            expect(result).toEqual({
                ...product,
                photos: [],
            });

            expect(
                mockAuthorization.assertAccountMember
            ).toHaveBeenCalled();

            expect(
                mockAuthorization.assertBranchPermission
            ).toHaveBeenCalledWith(
                mockClient,
                "user-1",
                "account-1",
                "branch-1",
                "products.create"
            );

            expect(
                mockRepository.createProduct
            ).toHaveBeenCalled();

            expect(mockClient.query).toHaveBeenCalledWith(
                "BEGIN"
            );

            expect(mockClient.query).toHaveBeenCalledWith(
                "COMMIT"
            );

            expect(mockClient.release).toHaveBeenCalled();
        });

        it("rejects a product when the branch does not exist", async () => {
            mockRepository.getBranchForAccount.mockResolvedValue(
                null
            );

            await expect(
                ProductService.createProduct(
                    "user-1",
                    "account-1",
                    {
                        branchId: "missing-branch",
                        categoryId: "category-1",
                        name: "Test Product",
                        slug: "test-product",
                        type: "private",
                        costPrice: 50,
                        sellingPrice: 75,
                        status: "active",
                        photos: [],
                    }
                )
            ).rejects.toMatchObject({
                statusCode: 404,
                code: "BRANCH_NOT_FOUND",
            });

            expect(
                mockRepository.createProduct
            ).not.toHaveBeenCalled();

            expect(mockClient.release).toHaveBeenCalled();
        });

        it("rejects a product when the category does not exist", async () => {
            mockRepository.getCategoryForAccount.mockResolvedValue(
                null
            );

            await expect(
                ProductService.createProduct(
                    "user-1",
                    "account-1",
                    {
                        branchId: "branch-1",
                        categoryId: "missing-category",
                        name: "Test Product",
                        slug: "test-product",
                        type: "private",
                        costPrice: 50,
                        sellingPrice: 75,
                        status: "active",
                        photos: [],
                    }
                )
            ).rejects.toMatchObject({
                statusCode: 404,
                code: "CATEGORY_NOT_FOUND",
            });
        });

        it("rejects a duplicate slug", async () => {
            mockRepository.getProductBySlug.mockResolvedValue({
                id: "existing-product",
            });

            await expect(
                ProductService.createProduct(
                    "user-1",
                    "account-1",
                    {
                        branchId: "branch-1",
                        categoryId: "category-1",
                        name: "Test Product",
                        slug: "existing-product",
                        type: "private",
                        costPrice: 50,
                        sellingPrice: 75,
                        status: "active",
                        photos: [],
                    }
                )
            ).rejects.toMatchObject({
                statusCode: 409,
                code: "PRODUCT_SLUG_ALREADY_EXISTS",
            });

            expect(
                mockRepository.createProduct
            ).not.toHaveBeenCalled();
        });

        it("rejects a public product without photos", async () => {
            await expect(
                ProductService.createProduct(
                    "user-1",
                    "account-1",
                    {
                        branchId: "branch-1",
                        categoryId: "category-1",
                        name: "Public Product",
                        slug: "public-product",
                        type: "public",
                        costPrice: 50,
                        sellingPrice: 75,
                        status: "active",
                        photos: [],
                    }
                )
            ).rejects.toMatchObject({
                statusCode: 400,
                code: "PUBLIC_PRODUCT_PHOTO_REQUIRED",
            });

            expect(
                mockRepository.createProduct
            ).not.toHaveBeenCalled();
        });

        it("rejects more than 6 photos", async () => {
            const photos = Array.from(
                { length: 7 },
                (_, index) => ({
                    provider: "cloudinary",
                    objectKey: `photo-${index}`,
                    url: `https://example.com/photo-${index}.jpg`,
                })
            );

            await expect(
                ProductService.createProduct(
                    "user-1",
                    "account-1",
                    {
                        branchId: "branch-1",
                        categoryId: "category-1",
                        name: "Test Product",
                        slug: "test-product",
                        type: "private",
                        costPrice: 50,
                        sellingPrice: 75,
                        status: "active",
                        photos,
                    }
                )
            ).rejects.toMatchObject({
                statusCode: 400,
                code: "PRODUCT_PHOTO_LIMIT_EXCEEDED",
            });
        });

        it("creates product photos in the correct positions", async () => {
            const product = {
                id: "product-1",
                account_id: "account-1",
                branch_id: "branch-1",
                category_id: "category-1",
                name: "Public Product",
                slug: "public-product",
                type: "public",
                status: "active",
            };

            const photos = [
                {
                    provider: "cloudinary",
                    objectKey: "photo-1",
                    url: "https://example.com/photo-1.jpg",
                },
                {
                    provider: "r2",
                    objectKey: "photo-2",
                    url: "https://example.com/photo-2.jpg",
                },
            ];

            mockRepository.createProduct.mockResolvedValue(
                product
            );

            await ProductService.createProduct(
                "user-1",
                "account-1",
                {
                    branchId: "branch-1",
                    categoryId: "category-1",
                    name: "Public Product",
                    slug: "public-product",
                    type: "public",
                    costPrice: 50,
                    sellingPrice: 75,
                    status: "active",
                    photos,
                }
            );

            expect(
                mockRepository.createProductPhoto
            ).toHaveBeenNthCalledWith(
                1,
                mockClient,
                {
                    productId: "product-1",
                    provider: "cloudinary",
                    objectKey: "photo-1",
                    url: "https://example.com/photo-1.jpg",
                    position: 1,
                }
            );

            expect(
                mockRepository.createProductPhoto
            ).toHaveBeenNthCalledWith(
                2,
                mockClient,
                {
                    productId: "product-1",
                    provider: "r2",
                    objectKey: "photo-2",
                    url: "https://example.com/photo-2.jpg",
                    position: 2,
                }
            );
        });
    });

    describe("getProducts", () => {
        it("returns paginated products", async () => {
            const products = [
                {
                    id: "product-1",
                    name: "Product One",
                },
                {
                    id: "product-2",
                    name: "Product Two",
                },
            ];

            mockRepository.getProductsByAccountId.mockResolvedValue(
                products
            );

            mockRepository.countProductsByAccountId.mockResolvedValue(
                25
            );

            mockAuthorization.isAccountCreator.mockResolvedValue(
                true
            );

            const result =
                await ProductService.getProducts(
                    "user-1",
                    "account-1",
                    {
                        page: 2,
                        limit: 10,
                    }
                );

            expect(result).toEqual({
                products,
                pagination: {
                    page: 2,
                    limit: 10,
                    total: 25,
                    totalPages: 3,
                    hasNextPage: true,
                    hasPreviousPage: true,
                },
            });
        });

        it("caps the page size at 100", async () => {
            mockRepository.getProductsByAccountId.mockResolvedValue(
                []
            );

            mockRepository.countProductsByAccountId.mockResolvedValue(
                0
            );

            await ProductService.getProducts(
                "user-1",
                "account-1",
                {
                    page: 1,
                    limit: 500,
                }
            );

            expect(
                mockRepository.getProductsByAccountId
            ).toHaveBeenCalledWith(
                mockClient,
                "account-1",
                "user-1",
                false,
                expect.objectContaining({
                    page: 1,
                    limit: 100,
                })
            );
        });
    });

    describe("getProduct", () => {
        it("returns a product with its photos", async () => {
            const product = {
                id: "product-1",
                account_id: "account-1",
                branch_id: "branch-1",
                name: "Test Product",
            };

            const photos = [
                {
                    id: "photo-1",
                    position: 1,
                },
            ];

            mockRepository.getProductByIdForAccount.mockResolvedValue(
                product
            );

            mockRepository.getProductPhotos.mockResolvedValue(
                photos
            );

            const result =
                await ProductService.getProduct(
                    "user-1",
                    "account-1",
                    "product-1"
                );

            expect(result).toEqual({
                ...product,
                photos,
            });
        });

        it("rejects when the product does not exist", async () => {
            mockRepository.getProductByIdForAccount.mockResolvedValue(
                null
            );

            await expect(
                ProductService.getProduct(
                    "user-1",
                    "account-1",
                    "missing-product"
                )
            ).rejects.toMatchObject({
                statusCode: 404,
                code: "PRODUCT_NOT_FOUND",
            });
        });
    });

    describe("updateProduct", () => {
        it("updates a product successfully", async () => {
            const product = {
                id: "product-1",
                account_id: "account-1",
                branch_id: "branch-1",
                category_id: "category-1",
                slug: "old-product",
                type: "private",
            };

            const updatedProduct = {
                ...product,
                name: "Updated Product",
                slug: "updated-product",
            };

            mockRepository.getProductByIdForAccount.mockResolvedValue(
                product
            );

            mockRepository.updateProduct.mockResolvedValue(
                updatedProduct
            );

            const result =
                await ProductService.updateProduct(
                    "user-1",
                    "account-1",
                    "product-1",
                    {
                        name: "Updated Product",
                        slug: "updated-product",
                    }
                );

            expect(result).toEqual({
                ...updatedProduct,
                photos: [],
            });

            expect(
                mockRepository.updateProduct
            ).toHaveBeenCalledWith(
                mockClient,
                "product-1",
                {
                    name: "Updated Product",
                    slug: "updated-product",
                }
            );

            expect(mockClient.query).toHaveBeenCalledWith(
                "COMMIT"
            );
        });

        it("rejects a duplicate new slug", async () => {
            mockRepository.getProductByIdForAccount.mockResolvedValue(
                {
                    id: "product-1",
                    branch_id: "branch-1",
                    slug: "old-product",
                }
            );

            mockRepository.getProductBySlug.mockResolvedValue({
                id: "product-2",
            });

            await expect(
                ProductService.updateProduct(
                    "user-1",
                    "account-1",
                    "product-1",
                    {
                        slug: "taken-slug",
                    }
                )
            ).rejects.toMatchObject({
                statusCode: 409,
                code: "PRODUCT_SLUG_ALREADY_EXISTS",
            });
        });
    });

    describe("updateProductStatus", () => {
        it("updates product status", async () => {
            const product = {
                id: "product-1",
                branch_id: "branch-1",
            };

            const updatedProduct = {
                ...product,
                status: "inactive",
            };

            mockRepository.getProductByIdForAccount.mockResolvedValue(
                product
            );

            mockRepository.updateProductStatus.mockResolvedValue(
                updatedProduct
            );

            const result =
                await ProductService.updateProductStatus(
                    "user-1",
                    "account-1",
                    "product-1",
                    "inactive"
                );

            expect(result).toEqual(updatedProduct);

            expect(
                mockRepository.updateProductStatus
            ).toHaveBeenCalledWith(
                mockClient,
                "product-1",
                "inactive"
            );
        });
    });

    describe("deleteProduct", () => {
        it("soft deletes a product by making it inactive", async () => {
            const product = {
                id: "product-1",
                branch_id: "branch-1",
            };

            const deletedProduct = {
                ...product,
                status: "inactive",
            };

            mockRepository.getProductByIdForAccount.mockResolvedValue(
                product
            );

            mockRepository.updateProductStatus.mockResolvedValue(
                deletedProduct
            );

            const result =
                await ProductService.deleteProduct(
                    "user-1",
                    "account-1",
                    "product-1"
                );

            expect(result).toEqual(deletedProduct);

            expect(
                mockRepository.updateProductStatus
            ).toHaveBeenCalledWith(
                mockClient,
                "product-1",
                "inactive"
            );
        });
    });

    describe("categories", () => {
        it("gets categories for an account", async () => {
            const categories = [
                {
                    id: "category-1",
                    name: "Electronics",
                },
            ];

            mockRepository.getCategories.mockResolvedValue(
                categories
            );

            const result =
                await ProductService.getCategories(
                    "user-1",
                    "account-1"
                );

            expect(result).toEqual(categories);
        });

        it("creates a category", async () => {
            const category = {
                id: "category-1",
                account_id: "account-1",
                name: "Electronics",
                scope: "account",
            };

            mockRepository.createCategory.mockResolvedValue(
                category
            );

            const result =
                await ProductService.createCategory(
                    "user-1",
                    "account-1",
                    {
                        name: "Electronics",
                    }
                );

            expect(result).toEqual(category);

            expect(
                mockAuthorization.assertPermission
            ).toHaveBeenCalledWith(
                mockClient,
                "user-1",
                "account-1",
                "products.create"
            );
        });

        it("updates an account category", async () => {
            const category = {
                id: "category-1",
                account_id: "account-1",
                scope: "account",
            };

            const updatedCategory = {
                ...category,
                name: "Updated",
            };

            mockRepository.getCategoryById.mockResolvedValue(
                category
            );

            mockRepository.updateCategory.mockResolvedValue(
                updatedCategory
            );

            const result =
                await ProductService.updateCategory(
                    "user-1",
                    "account-1",
                    "category-1",
                    {
                        name: "Updated",
                    }
                );

            expect(result).toEqual(updatedCategory);
        });

        it("rejects updating a global category", async () => {
            mockRepository.getCategoryById.mockResolvedValue({
                id: "category-1",
                account_id: null,
                scope: "global",
            });

            await expect(
                ProductService.updateCategory(
                    "user-1",
                    "account-1",
                    "category-1",
                    {
                        name: "Updated",
                    }
                )
            ).rejects.toMatchObject({
                statusCode: 404,
                code: "CATEGORY_NOT_FOUND",
            });
        });

        it("deletes an account category", async () => {
            const category = {
                id: "category-1",
                account_id: "account-1",
                scope: "account",
            };

            mockRepository.getCategoryById.mockResolvedValue(
                category
            );

            mockRepository.deleteCategory.mockResolvedValue(
                category
            );

            const result =
                await ProductService.deleteCategory(
                    "user-1",
                    "account-1",
                    "category-1"
                );

            expect(result).toEqual(category);
        });

        it("converts a foreign-key error into CATEGORY_IN_USE", async () => {
            const category = {
                id: "category-1",
                account_id: "account-1",
                scope: "account",
            };

            mockRepository.getCategoryById.mockResolvedValue(
                category
            );

            mockRepository.deleteCategory.mockRejectedValue({
                code: "23503",
            });

            await expect(
                ProductService.deleteCategory(
                    "user-1",
                    "account-1",
                    "category-1"
                )
            ).rejects.toMatchObject({
                statusCode: 409,
                code: "CATEGORY_IN_USE",
            });
        });
    });
});