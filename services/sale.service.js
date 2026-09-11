// file: services/sale.service.js

import pool from "@/lib/database";

import AppError from "@/lib/errors/AppError";

import SaleRepository from "@/repositories/sale.repository";

import AuthorizationService from "@/services/authorization.service";

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

const SaleService = {
    async createSale(userId, accountId, data) {
        const client = await pool.connect();

        let transactionStarted = false;

        try {
            await AuthorizationService.assertAccountMember(
                client,
                userId,
                accountId
            );

            const branch =
                await SaleRepository.getBranchForAccount(
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
                "sales.create"
            );

            const productIds = new Set(
                data.items.map(
                    (item) => item.productId
                )
            );

            if (
                productIds.size !==
                data.items.length
            ) {
                throw new AppError(
                    "A product cannot appear more than once in a sale.",
                    400,
                    "DUPLICATE_SALE_PRODUCTS"
                );
            }

            const paidAmount = Number(
                data.paidAmount || 0
            );

            if (
                !Number.isFinite(paidAmount) ||
                paidAmount < 0
            ) {
                throw new AppError(
                    "Paid amount must be zero or greater.",
                    400,
                    "INVALID_PAID_AMOUNT"
                );
            }

            if (
                data.paymentType === "credit" &&
                paidAmount !== 0
            ) {
                throw new AppError(
                    "A credit sale cannot have a paid amount.",
                    400,
                    "INVALID_CREDIT_PAYMENT"
                );
            }

            await client.query("BEGIN");
            transactionStarted = true;

            const validatedItems = [];

            let subtotalCents = 0;

            for (const item of data.items) {
                const product =
                    await SaleRepository.getProductForSale(
                        client,
                        item.productId,
                        accountId,
                        data.branchId
                    );

                if (!product) {
                    throw new AppError(
                        "Product not found.",
                        404,
                        "PRODUCT_NOT_FOUND"
                    );
                }

                if (product.status !== "active") {
                    throw new AppError(
                        `Product "${product.name}" is inactive.`,
                        400,
                        "PRODUCT_INACTIVE"
                    );
                }

                if (
                    product.stock <
                    item.quantity
                ) {
                    throw new AppError(
                        `Insufficient stock for "${product.name}".`,
                        400,
                        "INSUFFICIENT_STOCK"
                    );
                }

                /*
                 * The employee can sell at the actual
                 * price entered for this sale.
                 *
                 * product.selling_price is only the
                 * default/reference product price.
                 */

                const priceCents = Math.round(
                    Number(item.pricePerItem) * 100
                );

                const totalCents =
                    priceCents *
                    item.quantity;

                subtotalCents += totalCents;

                validatedItems.push({
                    productId: product.id,
                    productName: product.name,
                    quantity: item.quantity,
                    pricePerItem:
                        priceCents / 100,
                    totalAmount:
                        totalCents / 100,
                });
            }

            const subtotal =
                subtotalCents / 100;

            const totalAmount = subtotal;

            if (paidAmount > totalAmount) {
                throw new AppError(
                    "Paid amount cannot exceed the sale total.",
                    400,
                    "PAYMENT_EXCEEDS_TOTAL"
                );
            }

            /*
             * The requested payment type must match
             * the actual amount being paid.
             */

            if (
                data.paymentType === "paid" &&
                paidAmount !== totalAmount
            ) {
                throw new AppError(
                    "A paid sale must have the full sale amount paid.",
                    400,
                    "INVALID_PAID_SALE"
                );
            }

            if (
                data.paymentType === "partial" &&
                (
                    paidAmount <= 0 ||
                    paidAmount >= totalAmount
                )
            ) {
                throw new AppError(
                    "A partial sale must have a payment greater than zero and less than the sale total.",
                    400,
                    "INVALID_PARTIAL_SALE"
                );
            }

            let paymentStatus;

            if (
                data.paymentType === "credit"
            ) {
                paymentStatus = "credit";
            } else if (
                paidAmount === totalAmount
            ) {
                paymentStatus = "paid";
            } else {
                paymentStatus = "partial";
            }

            const sale =
                await SaleRepository.createSale(
                    client,
                    {
                        accountId,
                        branchId:
                            data.branchId,
                        customerName:
                            data.customerName,
                        notes: data.notes,
                        subtotal,
                        totalAmount,
                        paymentStatus,
                        createdByUserId:
                            userId,
                    }
                );

            for (const item of validatedItems) {
                const stockResult =
                    await SaleRepository.decreaseProductStock(
                        client,
                        item.productId,
                        item.quantity
                    );

                if (!stockResult) {
                    throw new AppError(
                        `Insufficient stock for "${item.productName}".`,
                        400,
                        "INSUFFICIENT_STOCK"
                    );
                }

                await SaleRepository.createSaleItem(
                    client,
                    {
                        saleId: sale.id,
                        ...item,
                    }
                );
            }

            /*
             * Sales only records the customer's payment.
             *
             * It does NOT decide:
             * - which financial account receives money
             * - which money transaction is created
             * - which receivable is created
             *
             * Those belong to the Financial feature.
             */

            if (
                data.paymentType === "paid" ||
                data.paymentType === "partial"
            ) {
                if (!data.paymentMethod) {
                    throw new AppError(
                        "Payment method is required for a paid or partial sale.",
                        400,
                        "PAYMENT_METHOD_REQUIRED"
                    );
                }

                await SaleRepository.createSalePayment(
                    client,
                    {
                        saleId: sale.id,
                        amount: paidAmount,
                        paymentMethod:
                            data.paymentMethod,
                        createdByUserId:
                            userId,
                    }
                );

                // Automatically make the actual received revenue
                // available for settlement. The employee does not
                // need to request a settlement manually.
                if (paidAmount > 0) {
                    await SaleRepository.createSettlement(
                        client,
                        {
                            accountId,
                            branchId: data.branchId,
                            amount: paidAmount,
                            notes: `Automatically generated from sale ${sale.id}.`,
                            requestedByUserId: userId,
                        }
                    );
                }
            }

            await client.query("COMMIT");
            transactionStarted = false;

            /*
             * Fetch the complete sale after commit.
             */
            return await SaleRepository.getSaleById(
                client,
                sale.id,
                accountId
            );
        } catch (error) {
            if (transactionStarted) {
                await client.query("ROLLBACK");
            }

            if (error instanceof AppError) {
                throw error;
            }

            if (error?.code === "23505") {
                throw new AppError(
                    "Sale already exists.",
                    409,
                    "SALE_ALREADY_EXISTS"
                );
            }

            console.error(
                "SaleService.createSale:",
                error
            );

            throw new AppError(
                "Failed to create sale.",
                500,
                "SALE_CREATE_FAILED"
            );
        } finally {
            client.release();
        }
    },

    async getSale(
        userId,
        accountId,
        saleId
    ) {
        const client = await pool.connect();

        try {
            await AuthorizationService.assertAccountMember(
                client,
                userId,
                accountId
            );

            const sale =
                await SaleRepository.getSaleById(
                    client,
                    saleId,
                    accountId
                );

            if (!sale) {
                throw new AppError(
                    "Sale not found.",
                    404,
                    "SALE_NOT_FOUND"
                );
            }

            await AuthorizationService.assertBranchPermission(
                client,
                userId,
                accountId,
                sale.branch_id,
                "sales.view"
            );

            return sale;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "SaleService.getSale:",
                error
            );

            throw new AppError(
                "Failed to fetch sale.",
                500,
                "SALE_FETCH_FAILED"
            );
        } finally {
            client.release();
        }
    },

    async getSales(
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
                1,
                Number(options.page) || 1
            );

            const limit = Math.min(
                MAX_PAGE_SIZE,
                Math.max(
                    1,
                    Number(options.limit) ||
                    DEFAULT_PAGE_SIZE
                )
            );

            if (options.branchId) {
                const branch =
                    await SaleRepository.getBranchForAccount(
                        client,
                        options.branchId,
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
                    options.branchId,
                    "sales.view"
                );
            }

            const isCreator =
                await AuthorizationService.isAccountCreator(
                    client,
                    userId,
                    accountId
                );

            const [sales, total] =
                await Promise.all([
                    SaleRepository.getSales(
                        client,
                        {
                            ...options,
                            accountId,
                            userId,
                            isCreator,
                            page,
                            limit,
                        }
                    ),

                    SaleRepository.countSales(
                        client,
                        {
                            ...options,
                            accountId,
                            userId,
                            isCreator,
                        }
                    ),
                ]);

            return {
                sales,

                pagination: {
                    page,
                    limit,
                    total,
                    totalPages:
                        Math.ceil(
                            total / limit
                        ),
                },
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "SaleService.getSales:",
                error
            );

            throw new AppError(
                "Failed to fetch sales.",
                500,
                "SALES_FETCH_FAILED"
            );
        } finally {
            client.release();
        }
    },
};

export default SaleService;