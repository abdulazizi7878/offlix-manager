import { beforeEach, describe, expect, it, vi } from "vitest";

const {
    mockGetCurrentUser,
    mockCreateProduct,
    mockGetProducts,
} = vi.hoisted(() => ({
    mockGetCurrentUser: vi.fn(),
    mockCreateProduct: vi.fn(),
    mockGetProducts: vi.fn(),
}));

vi.mock("@/lib/auth/get-current-user", () => ({
    getCurrentUser: mockGetCurrentUser,
}));

vi.mock("@/services/product.service", () => ({
    default: {
        createProduct: mockCreateProduct,
        getProducts: mockGetProducts,
    },
}));

import { POST, GET } from "@/app/api/v1/dashboard/products/route";
import AppError from "@/lib/errors/AppError";

const branchId = "550e8400-e29b-41d4-a716-446655440000";
const categoryId = "6ba7b810-9dad-41d1-80b4-00c04fd430c8";

describe("Dashboard Products API Route", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockGetCurrentUser.mockResolvedValue({
            user: {
                id: "user-1",
                accountId: "account-1",
            },
        });
    });

    describe("POST /api/v1/dashboard/products", () => {
        it("returns 401 when the user is not authenticated", async () => {
            mockGetCurrentUser.mockResolvedValue(null);

            const request = new Request(
                "http://localhost/api/v1/dashboard/products",
                {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                    },
                    body: JSON.stringify({}),
                }
            );

            const response = await POST(request);
            const body = await response.json();

            expect(response.status).toBe(401);

            expect(body).toEqual({
                success: false,
                error: {
                    code: "UNAUTHORIZED",
                    message: "Authentication required.",
                },
            });

            expect(mockCreateProduct).not.toHaveBeenCalled();
        });

        it("creates a product and returns 201 for valid data", async () => {
            const productData = {
                branchId,
                categoryId,
                name: "Laptop",
                slug: "laptop",
                description: "A laptop",
                type: "private",
                costPrice: 500,
                sellingPrice: 700,
                status: "active",
                photos: [],
            };

            const createdProduct = {
                id: "product-1",
                ...productData,
            };

            mockCreateProduct.mockResolvedValue(createdProduct);

            const request = new Request(
                "http://localhost/api/v1/dashboard/products",
                {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                    },
                    body: JSON.stringify(productData),
                }
            );

            const response = await POST(request);
            const body = await response.json();

            expect(response.status).toBe(201);

            expect(body).toEqual({
                success: true,
                data: createdProduct,
            });

            expect(mockCreateProduct).toHaveBeenCalledOnce();

            expect(mockCreateProduct).toHaveBeenCalledWith(
                "user-1",
                "account-1",
                productData
            );
        });

        it("returns 400 for invalid product data", async () => {
            const invalidData = {
                branchId: "not-a-uuid",
                categoryId: "not-a-uuid",
                name: "",
                slug: "INVALID SLUG",
            };

            const request = new Request(
                "http://localhost/api/v1/dashboard/products",
                {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                    },
                    body: JSON.stringify(invalidData),
                }
            );

            const response = await POST(request);
            const body = await response.json();

            expect(response.status).toBe(400);

            expect(body.success).toBe(false);

            expect(body.error.code).toBe(
                "VALIDATION_ERROR"
            );

            expect(body.error.message).toBe(
                "Invalid request data."
            );

            expect(body.error.details).toBeDefined();

            expect(mockCreateProduct).not.toHaveBeenCalled();
        });

        it("passes the authenticated user's account and user IDs to the service", async () => {
            const productData = {
                branchId,
                categoryId,
                name: "Phone",
                slug: "phone",
            };

            mockCreateProduct.mockResolvedValue({
                id: "product-1",
                ...productData,
            });

            const request = new Request(
                "http://localhost/api/v1/dashboard/products",
                {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                    },
                    body: JSON.stringify(productData),
                }
            );

            await POST(request);

            expect(mockCreateProduct).toHaveBeenCalledWith(
                "user-1",
                "account-1",
                expect.objectContaining({
                    branchId,
                    categoryId,
                    name: "Phone",
                    slug: "phone",
                })
            );
        });

        it("returns the AppError status and error when the service throws", async () => {
            mockCreateProduct.mockRejectedValue(
                new AppError(
                    "Product already exists.",
                    409,
                    "PRODUCT_ALREADY_EXISTS"
                )
            );

            const productData = {
                branchId,
                categoryId,
                name: "Laptop",
                slug: "laptop",
            };

            const request = new Request(
                "http://localhost/api/v1/dashboard/products",
                {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                    },
                    body: JSON.stringify(productData),
                }
            );

            const response = await POST(request);
            const body = await response.json();

            expect(response.status).toBe(409);

            expect(body).toEqual({
                success: false,
                error: {
                    code: "PRODUCT_ALREADY_EXISTS",
                    message: "Product already exists.",
                },
            });
        });
    });

    describe("GET /api/v1/dashboard/products", () => {
        it("returns 401 when the user is not authenticated", async () => {
            mockGetCurrentUser.mockResolvedValue(null);

            const request = new Request(
                "http://localhost/api/v1/dashboard/products"
            );

            const response = await GET(request);
            const body = await response.json();

            expect(response.status).toBe(401);

            expect(body).toEqual({
                success: false,
                error: {
                    code: "UNAUTHORIZED",
                    message: "Authentication required.",
                },
            });

            expect(mockGetProducts).not.toHaveBeenCalled();
        });

        it("gets products and returns 200 for a valid request", async () => {
            const result = {
                products: [
                    {
                        id: "product-1",
                        name: "Laptop",
                    },
                ],
                pagination: {
                    page: 1,
                    limit: 20,
                    total: 1,
                    totalPages: 1,
                },
            };

            mockGetProducts.mockResolvedValue(result);

            const request = new Request(
                "http://localhost/api/v1/dashboard/products"
            );

            const response = await GET(request);
            const body = await response.json();

            expect(response.status).toBe(200);

            expect(body).toEqual({
                success: true,
                data: result,
            });

            expect(mockGetProducts).toHaveBeenCalledOnce();

            expect(mockGetProducts).toHaveBeenCalledWith(
                "user-1",
                "account-1",
                {
                    page: 1,
                    limit: 20,
                }
            );
        });

        it("parses query parameters before calling the service", async () => {
            mockGetProducts.mockResolvedValue({
                products: [],
                pagination: {},
            });

            const request = new Request(
                `http://localhost/api/v1/dashboard/products?page=2&limit=50&search=laptop&branchId=${branchId}&categoryId=${categoryId}&status=active&type=public`
            );

            const response = await GET(request);

            expect(response.status).toBe(200);

            expect(mockGetProducts).toHaveBeenCalledWith(
                "user-1",
                "account-1",
                {
                    page: 2,
                    limit: 50,
                    search: "laptop",
                    branchId,
                    categoryId,
                    status: "active",
                    type: "public",
                }
            );
        });

        it("returns 400 for invalid query parameters", async () => {
            const request = new Request(
                "http://localhost/api/v1/dashboard/products?page=0&limit=999&type=public"
            );

            const response = await GET(request);
            const body = await response.json();

            expect(response.status).toBe(400);

            expect(body).toEqual(
                expect.objectContaining({
                    success: false,
                    error: expect.objectContaining({
                        code: "VALIDATION_ERROR",
                        message: "Invalid request data.",
                    }),
                })
            );

            expect(mockGetProducts).not.toHaveBeenCalled();
        });

        it("returns the AppError status and error when the service throws", async () => {
            mockGetProducts.mockRejectedValue(
                new AppError(
                    "You do not have access to this account.",
                    403,
                    "ACCOUNT_ACCESS_DENIED"
                )
            );

            const request = new Request(
                "http://localhost/api/v1/dashboard/products"
            );

            const response = await GET(request);
            const body = await response.json();

            expect(response.status).toBe(403);

            expect(body).toEqual({
                success: false,
                error: {
                    code: "ACCOUNT_ACCESS_DENIED",
                    message:
                        "You do not have access to this account.",
                },
            });
        });
    });
});