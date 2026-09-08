import pool from "@/lib/database";

import AppError from "@/lib/errors/AppError";

import SaleRepository from "@/repositories/sale.repository";

import FinanceRepository from "@/repositories/finance.repository";

import AuthorizationService from "@/services/authorization.service";

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

const SaleService = {
    async createSale(userId, accountId, data) {
        const client = await pool.connect();

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
                data.items.map((item) => item.productId)
            );

            if (productIds.size !== data.items.length) {
                throw new AppError(
                    "A product cannot appear more than once in a sale.",
                    400,
                    "DUPLICATE_SALE_PRODUCTS"
                );
            }

            const paidAmount = Number(data.paidAmount || 0);

            if (!Number.isFinite(paidAmount) || paidAmount < 0) {
                throw new AppError(
                    "Paid amount must be zero or greater.",
                    400,
                    "INVALID_PAID_AMOUNT"
                );
            }

            if (data.paymentType === "credit" && paidAmount !== 0) {
                throw new AppError(
                    "A credit sale cannot have a paid amount.",
                    400,
                    "INVALID_CREDIT_PAYMENT"
                );
            }

            await client.query("BEGIN");

            const validatedItems = [];
            let subtotal = 0;

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

                if (product.stock < item.quantity) {
                    throw new AppError(
                        `Insufficient stock for "${product.name}".`,
                        400,
                        "INSUFFICIENT_STOCK"
                    );
                }

                const price = Number(product.selling_price);

                const total = price * item.quantity;

                subtotal += total;

                validatedItems.push({
                    productId: product.id,
                    productName: product.name,
                    quantity: item.quantity,
                    pricePerItem: price,
                    totalAmount: total,
                });
            }

            const totalAmount = subtotal;

            if (paidAmount > totalAmount) {
                throw new AppError(
                    "Paid amount cannot exceed the sale total.",
                    400,
                    "PAYMENT_EXCEEDS_TOTAL"
                );
            }

            let paymentStatus;

            if (data.paymentType === "credit") {
                paymentStatus = "credit";
            } else if (paidAmount === totalAmount) {
                paymentStatus = "paid";
            } else {
                paymentStatus = "partial";
            }

            /*
             * Keep paymentType and the actual calculated payment status
             * consistent.
             *
             * A "paid" payment type must actually pay the full amount.
             * A "partial" payment type must pay something, but less
             * than the total.
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
                (paidAmount <= 0 || paidAmount >= totalAmount)
            ) {
                throw new AppError(
                    "A partial sale must have a payment greater than zero and less than the sale total.",
                    400,
                    "INVALID_PARTIAL_SALE"
                );
            }

            const sale =
                await SaleRepository.createSale(
                    client,
                    {
                        accountId,
                        branchId: data.branchId,
                        customerName: data.customerName,
                        notes: data.notes,
                        subtotal,
                        totalAmount,
                        paymentStatus,
                        createdByUserId: userId,
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
             * Only paid and partial sales move money immediately.
             *
             * Credit sales create a receivable but do not create
             * a payment or money transaction.
             */
            if (
                data.paymentType === "paid" ||
                data.paymentType === "partial"
            ) {
                if (!data.financialAccountId) {
                    throw new AppError(
                        "Financial account is required for a paid or partial sale.",
                        400,
                        "FINANCIAL_ACCOUNT_REQUIRED"
                    );
                }

                if (!data.paymentMethod) {
                    throw new AppError(
                        "Payment method is required for a paid or partial sale.",
                        400,
                        "PAYMENT_METHOD_REQUIRED"
                    );
                }

                const financialAccount =
                    await FinanceRepository.getFinancialAccountById(
                        client,
                        data.financialAccountId,
                        accountId
                    );

                if (!financialAccount) {
                    throw new AppError(
                        "Financial account not found.",
                        404,
                        "FINANCIAL_ACCOUNT_NOT_FOUND"
                    );
                }

                if (financialAccount.status !== "active") {
                    throw new AppError(
                        "Financial account is inactive.",
                        400,
                        "FINANCIAL_ACCOUNT_INACTIVE"
                    );
                }

                if (
                    data.paymentMethod === "cash" &&
                    financialAccount.type !== "cash"
                ) {
                    throw new AppError(
                        "A cash payment must use a cash account.",
                        400,
                        "INVALID_PAYMENT_ACCOUNT"
                    );
                }

                if (
                    data.paymentMethod === "bank" &&
                    financialAccount.type !== "bank"
                ) {
                    throw new AppError(
                        "A bank payment must use a bank account.",
                        400,
                        "INVALID_PAYMENT_ACCOUNT"
                    );
                }

                const transaction =
                    await FinanceRepository.createMoneyTransaction(
                        client,
                        {
                            accountId,
                            branchId: data.branchId,
                            type: "sale_payment",
                            amount: paidAmount,
                            fromFinancialAccountId: null,
                            toFinancialAccountId:
                                financialAccount.id,
                            description:
                                `Payment for sale ${ sale.id }`,
                            referenceType: "sale",
                            referenceId: sale.id,
                            createdByUserId: userId,
                        }
                    );

                await FinanceRepository.createPayment(
                    client,
                    {
                        accountId,
                        branchId: data.branchId,
                        paymentType: "sale_payment",
                        saleId: sale.id,
                        amount: paidAmount,
                        paymentMethod: data.paymentMethod,
                        financialAccountId:
                            financialAccount.id,
                        moneyTransactionId:
                            transaction.id,
                        createdByUserId: userId,
                    }
                );
            }

            const unpaidAmount =
                totalAmount - paidAmount;

            if (unpaidAmount > 0) {
                await FinanceRepository.createReceivable(
                    client,
                    {
                        accountId,
                        branchId: data.branchId,
                        saleId: sale.id,
                        customerName: data.customerName,
                        originalAmount: unpaidAmount,
                        dueAt: data.dueAt,
                        notes: data.notes,
                        createdByUserId: userId,
                    }
                );
            }

            await client.query("COMMIT");

            return await SaleRepository.getSaleById(
                client,
                sale.id,
                accountId
            );
        } catch (error) {
            await client.query("ROLLBACK");

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

    async getSale(userId, accountId, saleId) {
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
