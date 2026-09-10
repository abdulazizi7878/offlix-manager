// services/money.service.js

import pool from "@/lib/database";
import AppError from "@/lib/errors/AppError";
import MoneyRepository from "@/repositories/money.repository";
import AuthorizationService from "@/services/authorization.service";

const withClient = async (callback) => {
    const client = await pool.connect();

    try {
        return await callback(client);
    } finally {
        client.release();
    }
};

const withTransaction = async (callback) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const result = await callback(client);

        await client.query("COMMIT");

        return result;
    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch { }

        throw error;
    } finally {
        client.release();
    }
};

const MoneyService = {
    // ============================================================
    // MONEY ACCOUNTS
    // ============================================================

    async createMoneyAccount(userId, accountId, data) {
        return withTransaction(async (client) => {
            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.create"
            );

            const name = data.name?.trim();
            const type = data.type;

            if (!name) {
                throw new AppError(
                    "Money account name is required.",
                    400,
                    "INVALID_MONEY_ACCOUNT_NAME"
                );
            }

            if (!["cash", "bank", "mobile_money"].includes(type)) {
                throw new AppError(
                    "Invalid money account type.",
                    400,
                    "INVALID_MONEY_ACCOUNT_TYPE"
                );
            }

            return MoneyRepository.createMoneyAccount(client, {
                accountId,
                name,
                type,
            });
        });
    },

    async getMoneyAccount(userId, accountId, moneyAccountId) {
        return withClient(async (client) => {
            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.view"
            );

            const moneyAccount =
                await MoneyRepository.getMoneyAccountById(
                    client,
                    moneyAccountId,
                    accountId
                );

            if (!moneyAccount) {
                throw new AppError(
                    "Money account not found.",
                    404,
                    "MONEY_ACCOUNT_NOT_FOUND"
                );
            }

            return moneyAccount;
        });
    },

    async getMoneyAccounts(userId, accountId, filters = {}) {
        return withClient(async (client) => {
            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.view"
            );

            const page = Number(filters.page) || 1;
            const limit = Number(filters.limit) || 20;

            if (page < 1 || limit < 1 || limit > 100) {
                throw new AppError(
                    "Invalid pagination values.",
                    400,
                    "INVALID_PAGINATION"
                );
            }

            const query = {
                accountId,
                type: filters.type ?? null,
                status: filters.status ?? null,
                search: filters.search?.trim() || null,
                page,
                limit,
            };

            const countQuery = {
                accountId,
                type: filters.type ?? null,
                status: filters.status ?? null,
                search: filters.search?.trim() || null,
            };

            const [rows, total] = await Promise.all([
                MoneyRepository.getMoneyAccounts(client, query),
                MoneyRepository.countMoneyAccounts(client, countQuery),
            ]);

            return {
                data: rows,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        });
    },

    async updateMoneyAccount(
        userId,
        accountId,
        moneyAccountId,
        data
    ) {
        return withTransaction(async (client) => {
            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.create"
            );

            const existing =
                await MoneyRepository.getMoneyAccountById(
                    client,
                    moneyAccountId,
                    accountId
                );

            if (!existing) {
                throw new AppError(
                    "Money account not found.",
                    404,
                    "MONEY_ACCOUNT_NOT_FOUND"
                );
            }

            const name =
                data.name !== undefined
                    ? data.name.trim()
                    : existing.name;

            const type = data.type ?? existing.type;
            const status = data.status ?? existing.status;

            if (!name) {
                throw new AppError(
                    "Money account name is required.",
                    400,
                    "INVALID_MONEY_ACCOUNT_NAME"
                );
            }

            if (!["cash", "bank", "mobile_money"].includes(type)) {
                throw new AppError(
                    "Invalid money account type.",
                    400,
                    "INVALID_MONEY_ACCOUNT_TYPE"
                );
            }

            if (!["active", "inactive"].includes(status)) {
                throw new AppError(
                    "Invalid money account status.",
                    400,
                    "INVALID_MONEY_ACCOUNT_STATUS"
                );
            }

            return MoneyRepository.updateMoneyAccount(client, {
                moneyAccountId,
                accountId,
                name,
                type,
                status,
            });
        });
    },

    // ============================================================
    // TRANSACTIONS
    // ============================================================

    async createTransaction(userId, accountId, data) {
        return withTransaction(async (client) => {
            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.create"
            );

            const moneyAccount =
                await MoneyRepository.getMoneyAccountForUpdate(
                    client,
                    data.moneyAccountId,
                    accountId
                );

            if (!moneyAccount) {
                throw new AppError(
                    "Active money account not found.",
                    404,
                    "MONEY_ACCOUNT_NOT_FOUND"
                );
            }

            const amount = Number(data.amount);

            if (!Number.isFinite(amount) || amount <= 0) {
                throw new AppError(
                    "Amount must be greater than zero.",
                    400,
                    "INVALID_AMOUNT"
                );
            }

            const validTypes = [
                "income",
                "expense",
                "deposit",
                "withdrawal",
                "payment",
                "settlement",
                "other",
            ];

            if (!validTypes.includes(data.type)) {
                throw new AppError(
                    "Invalid transaction type.",
                    400,
                    "INVALID_TRANSACTION_TYPE"
                );
            }

            if (!["in", "out"].includes(data.direction)) {
                throw new AppError(
                    "Invalid transaction direction.",
                    400,
                    "INVALID_TRANSACTION_DIRECTION"
                );
            }

            if (data.direction === "out") {
                const balance = Number(
                    await MoneyRepository.getMoneyAccountBalance(
                        client,
                        data.moneyAccountId,
                        accountId
                    )
                );

                if (balance < amount) {
                    throw new AppError(
                        "Insufficient money account balance.",
                        400,
                        "INSUFFICIENT_BALANCE"
                    );
                }
            }

            return MoneyRepository.createTransaction(client, {
                accountId,
                moneyAccountId: data.moneyAccountId,
                type: data.type,
                direction: data.direction,
                amount,
                description: data.description?.trim() || null,
                createdByUserId: userId,
            });
        });
    },

    async getTransaction(userId, accountId, transactionId) {
        return withClient(async (client) => {
            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.view"
            );

            const transaction =
                await MoneyRepository.getTransactionById(
                    client,
                    transactionId,
                    accountId
                );

            if (!transaction) {
                throw new AppError(
                    "Transaction not found.",
                    404,
                    "TRANSACTION_NOT_FOUND"
                );
            }

            return transaction;
        });
    },

    async getTransactions(userId, accountId, filters = {}) {
        return withClient(async (client) => {
            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.view"
            );

            const page = Number(filters.page) || 1;
            const limit = Number(filters.limit) || 20;

            if (page < 1 || limit < 1 || limit > 100) {
                throw new AppError(
                    "Invalid pagination values.",
                    400,
                    "INVALID_PAGINATION"
                );
            }

            const query = {
                accountId,
                moneyAccountId: filters.moneyAccountId ?? null,
                type: filters.type ?? null,
                direction: filters.direction ?? null,
                search: filters.search?.trim() || null,
                dateFrom: filters.dateFrom ?? null,
                dateTo: filters.dateTo ?? null,
                page,
                limit,
            };

            const countQuery = {
                accountId,
                moneyAccountId: filters.moneyAccountId ?? null,
                type: filters.type ?? null,
                direction: filters.direction ?? null,
                search: filters.search?.trim() || null,
                dateFrom: filters.dateFrom ?? null,
                dateTo: filters.dateTo ?? null,
            };

            const [rows, total] = await Promise.all([
                MoneyRepository.getTransactions(client, query),
                MoneyRepository.countTransactions(client, countQuery),
            ]);

            return {
                data: rows,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        });
    },

    // ============================================================
    // TRANSFERS
    // ============================================================

    async createTransfer(userId, accountId, data) {
        return withTransaction(async (client) => {
            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.create"
            );

            if (
                data.fromMoneyAccountId ===
                data.toMoneyAccountId
            ) {
                throw new AppError(
                    "Source and destination accounts must be different.",
                    400,
                    "INVALID_TRANSFER_ACCOUNTS"
                );
            }

            const amount = Number(data.amount);

            if (!Number.isFinite(amount) || amount <= 0) {
                throw new AppError(
                    "Transfer amount must be greater than zero.",
                    400,
                    "INVALID_AMOUNT"
                );
            }

            const accountIds = [
                data.fromMoneyAccountId,
                data.toMoneyAccountId,
            ].sort();

            const firstAccount =
                await MoneyRepository.getMoneyAccountForUpdate(
                    client,
                    accountIds[0],
                    accountId
                );

            const secondAccount =
                await MoneyRepository.getMoneyAccountForUpdate(
                    client,
                    accountIds[1],
                    accountId
                );

            if (!firstAccount || !secondAccount) {
                throw new AppError(
                    "One or both money accounts were not found or are inactive.",
                    404,
                    "MONEY_ACCOUNT_NOT_FOUND"
                );
            }

            const balance = Number(
                await MoneyRepository.getMoneyAccountBalance(
                    client,
                    data.fromMoneyAccountId,
                    accountId
                )
            );

            if (balance < amount) {
                throw new AppError(
                    "Insufficient money account balance.",
                    400,
                    "INSUFFICIENT_BALANCE"
                );
            }

            const transfer =
                await MoneyRepository.createTransfer(client, {
                    accountId,
                    fromMoneyAccountId:
                        data.fromMoneyAccountId,
                    toMoneyAccountId:
                        data.toMoneyAccountId,
                    amount,
                    notes: data.notes?.trim() || null,
                    createdByUserId: userId,
                });

            await MoneyRepository.createTransaction(client, {
                accountId,
                moneyAccountId:
                    data.fromMoneyAccountId,
                type: "withdrawal",
                direction: "out",
                amount,
                description:
                    data.notes?.trim() ||
                    "Transfer to another money account.",
                createdByUserId: userId,
            });

            await MoneyRepository.createTransaction(client, {
                accountId,
                moneyAccountId:
                    data.toMoneyAccountId,
                type: "deposit",
                direction: "in",
                amount,
                description:
                    data.notes?.trim() ||
                    "Transfer from another money account.",
                createdByUserId: userId,
            });

            return transfer;
        });
    },

    async getTransfer(userId, accountId, transferId) {
        return withClient(async (client) => {
            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.view"
            );

            const transfer =
                await MoneyRepository.getTransferById(
                    client,
                    transferId,
                    accountId
                );

            if (!transfer) {
                throw new AppError(
                    "Transfer not found.",
                    404,
                    "TRANSFER_NOT_FOUND"
                );
            }

            return transfer;
        });
    },

    async getTransfers(userId, accountId, filters = {}) {
        return withClient(async (client) => {
            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.view"
            );

            const page = Number(filters.page) || 1;
            const limit = Number(filters.limit) || 20;

            if (page < 1 || limit < 1 || limit > 100) {
                throw new AppError(
                    "Invalid pagination values.",
                    400,
                    "INVALID_PAGINATION"
                );
            }

            const query = {
                accountId,
                moneyAccountId:
                    filters.moneyAccountId ?? null,
                search: filters.search?.trim() || null,
                dateFrom: filters.dateFrom ?? null,
                dateTo: filters.dateTo ?? null,
                page,
                limit,
            };

            const countQuery = {
                accountId,
                moneyAccountId:
                    filters.moneyAccountId ?? null,
                search: filters.search?.trim() || null,
                dateFrom: filters.dateFrom ?? null,
                dateTo: filters.dateTo ?? null,
            };

            const [rows, total] = await Promise.all([
                MoneyRepository.getTransfers(client, query),
                MoneyRepository.countTransfers(client, countQuery),
            ]);

            return {
                data: rows,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        });
    },

    // ============================================================
    // SETTLEMENTS
    // ============================================================

    async getSettlement(userId, accountId, settlementId) {
        return withClient(async (client) => {
            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.view"
            );

            const settlement =
                await MoneyRepository.getSettlementById(
                    client,
                    settlementId,
                    accountId
                );

            if (!settlement) {
                throw new AppError(
                    "Settlement not found.",
                    404,
                    "SETTLEMENT_NOT_FOUND"
                );
            }

            return settlement;
        });
    },

    async getSettlements(userId, accountId, filters = {}) {
        return withClient(async (client) => {
            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.view"
            );

            const page = Number(filters.page) || 1;
            const limit = Number(filters.limit) || 20;

            if (page < 1 || limit < 1 || limit > 100) {
                throw new AppError(
                    "Invalid pagination values.",
                    400,
                    "INVALID_PAGINATION"
                );
            }

            const query = {
                accountId,
                branchId: filters.branchId ?? null,
                status: filters.status ?? null,
                page,
                limit,
            };

            const countQuery = {
                accountId,
                branchId: filters.branchId ?? null,
                status: filters.status ?? null,
            };

            const [rows, total] = await Promise.all([
                MoneyRepository.getSettlements(client, query),
                MoneyRepository.countSettlements(
                    client,
                    countQuery
                ),
            ]);

            return {
                data: rows,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        });
    },

    async acceptSettlement(
        userId,
        accountId,
        settlementId,
        data
    ) {
        return withTransaction(async (client) => {
            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.create"
            );

            const settlement =
                await MoneyRepository.getSettlementForUpdate(
                    client,
                    settlementId,
                    accountId
                );

            if (!settlement) {
                throw new AppError(
                    "Settlement not found or is no longer available.",
                    404,
                    "SETTLEMENT_NOT_FOUND"
                );
            }

            if (
                !["pending", "requested"].includes(
                    settlement.status
                )
            ) {
                throw new AppError(
                    "This settlement cannot be accepted.",
                    400,
                    "SETTLEMENT_NOT_ACCEPTABLE"
                );
            }

            const originalAmount = Number(settlement.amount);

            const acceptedAmount = Number(
                await MoneyRepository.getSettlementAcceptedAmount(
                    client,
                    settlementId,
                    accountId
                )
            );

            const remainingAmount =
                originalAmount - acceptedAmount;

            if (remainingAmount <= 0) {
                throw new AppError(
                    "This settlement has already been fully accepted.",
                    400,
                    "SETTLEMENT_ALREADY_COMPLETED"
                );
            }

            let amount;

            if (data.full === true) {
                amount = remainingAmount;
            } else {
                amount = Number(data.amount);

                if (!Number.isFinite(amount) || amount <= 0) {
                    throw new AppError(
                        "Acceptance amount must be greater than zero.",
                        400,
                        "INVALID_AMOUNT"
                    );
                }

                if (amount > remainingAmount) {
                    throw new AppError(
                        "Acceptance amount cannot exceed the remaining settlement amount.",
                        400,
                        "AMOUNT_EXCEEDS_REMAINING"
                    );
                }
            }

            const moneyAccount =
                await MoneyRepository.getMoneyAccountForUpdate(
                    client,
                    data.moneyAccountId,
                    accountId
                );

            if (!moneyAccount) {
                throw new AppError(
                    "Active destination money account not found.",
                    404,
                    "MONEY_ACCOUNT_NOT_FOUND"
                );
            }

            const acceptance =
                await MoneyRepository.createSettlementAcceptance(
                    client,
                    {
                        accountId,
                        saleSettlementId: settlementId,
                        moneyAccountId:
                            data.moneyAccountId,
                        amount,
                        acceptedByUserId: userId,
                        notes: data.notes?.trim() || null,
                    }
                );

            await MoneyRepository.createTransaction(client, {
                accountId,
                moneyAccountId:
                    data.moneyAccountId,
                type: "settlement",
                direction: "in",
                amount,
                description:
                    data.notes?.trim() ||
                    "Branch sales settlement received.",
                createdByUserId: userId,
            });

            const newRemainingAmount =
                remainingAmount - amount;

            if (newRemainingAmount === 0) {
                await MoneyRepository.updateSettlementStatus(
                    client,
                    {
                        settlementId,
                        accountId,
                        status: "received",
                        receivedByUserId: userId,
                    }
                );
            }

            return {
                acceptance,
                settlement: {
                    id: settlementId,
                    originalAmount,
                    acceptedAmount:
                        acceptedAmount + amount,
                    remainingAmount:
                        newRemainingAmount,
                    status:
                        newRemainingAmount === 0
                            ? "received"
                            : settlement.status,
                },
            };
        });
    },

    async getSettlementAcceptances(
        userId,
        accountId,
        settlementId
    ) {
        return withClient(async (client) => {
            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.view"
            );

            const settlement =
                await MoneyRepository.getSettlementById(
                    client,
                    settlementId,
                    accountId
                );

            if (!settlement) {
                throw new AppError(
                    "Settlement not found.",
                    404,
                    "SETTLEMENT_NOT_FOUND"
                );
            }

            return MoneyRepository.getSettlementAcceptances(
                client,
                settlementId,
                accountId
            );
        });
    },

    // ============================================================
    // PAYABLES
    // ============================================================

    async createPayable(userId, accountId, data) {
        return withTransaction(async (client) => {
            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.create"
            );

            const name = data.name?.trim();
            const amount = Number(data.amount);

            if (!name) {
                throw new AppError(
                    "Payable name is required.",
                    400,
                    "INVALID_PAYABLE_NAME"
                );
            }

            if (!Number.isFinite(amount) || amount <= 0) {
                throw new AppError(
                    "Payable amount must be greater than zero.",
                    400,
                    "INVALID_AMOUNT"
                );
            }

            return MoneyRepository.createPayable(client, {
                accountId,
                name,
                description:
                    data.description?.trim() || null,
                amount,
                dueDate: data.dueDate ?? null,
                createdByUserId: userId,
            });
        });
    },

    async getPayable(userId, accountId, payableId) {
        return withClient(async (client) => {
            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.view"
            );

            const payable =
                await MoneyRepository.getPayableById(
                    client,
                    payableId,
                    accountId
                );

            if (!payable) {
                throw new AppError(
                    "Payable not found.",
                    404,
                    "PAYABLE_NOT_FOUND"
                );
            }

            return payable;
        });
    },

    async getPayables(userId, accountId, filters = {}) {
        return withClient(async (client) => {
            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.view"
            );

            const page = Number(filters.page) || 1;
            const limit = Number(filters.limit) || 20;

            if (page < 1 || limit < 1 || limit > 100) {
                throw new AppError(
                    "Invalid pagination values.",
                    400,
                    "INVALID_PAGINATION"
                );
            }

            const query = {
                accountId,
                status: filters.status ?? null,
                search: filters.search?.trim() || null,
                dateFrom: filters.dateFrom ?? null,
                dateTo: filters.dateTo ?? null,
                page,
                limit,
            };

            const countQuery = {
                accountId,
                status: filters.status ?? null,
                search: filters.search?.trim() || null,
                dateFrom: filters.dateFrom ?? null,
                dateTo: filters.dateTo ?? null,
            };

            const [rows, total] = await Promise.all([
                MoneyRepository.getPayables(client, query),
                MoneyRepository.countPayables(
                    client,
                    countQuery
                ),
            ]);

            return {
                data: rows,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        });
    },

    async payPayable(
        userId,
        accountId,
        payableId,
        data
    ) {
        return withTransaction(async (client) => {
            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.create"
            );

            const payable =
                await MoneyRepository.getPayableForUpdate(
                    client,
                    payableId,
                    accountId
                );

            if (!payable) {
                throw new AppError(
                    "Payable not found or is already closed.",
                    404,
                    "PAYABLE_NOT_FOUND"
                );
            }

            const originalAmount = Number(payable.amount);

            const paidAmount = Number(
                await MoneyRepository.getPayablePaidAmount(
                    client,
                    payableId,
                    accountId
                )
            );

            const remainingAmount =
                originalAmount - paidAmount;

            if (remainingAmount <= 0) {
                throw new AppError(
                    "This payable has already been fully paid.",
                    400,
                    "PAYABLE_ALREADY_PAID"
                );
            }

            let amount;

            if (data.full === true) {
                amount = remainingAmount;
            } else {
                amount = Number(data.amount);

                if (!Number.isFinite(amount) || amount <= 0) {
                    throw new AppError(
                        "Payment amount must be greater than zero.",
                        400,
                        "INVALID_AMOUNT"
                    );
                }

                if (amount > remainingAmount) {
                    throw new AppError(
                        "Payment amount cannot exceed the remaining payable amount.",
                        400,
                        "AMOUNT_EXCEEDS_REMAINING"
                    );
                }
            }

            const moneyAccount =
                await MoneyRepository.getMoneyAccountForUpdate(
                    client,
                    data.moneyAccountId,
                    accountId
                );

            if (!moneyAccount) {
                throw new AppError(
                    "Active money account not found.",
                    404,
                    "MONEY_ACCOUNT_NOT_FOUND"
                );
            }

            const balance = Number(
                await MoneyRepository.getMoneyAccountBalance(
                    client,
                    data.moneyAccountId,
                    accountId
                )
            );

            if (balance < amount) {
                throw new AppError(
                    "Insufficient money account balance.",
                    400,
                    "INSUFFICIENT_BALANCE"
                );
            }

            const payment =
                await MoneyRepository.createPayablePayment(
                    client,
                    {
                        accountId,
                        payableId,
                        moneyAccountId:
                            data.moneyAccountId,
                        amount,
                        paidByUserId: userId,
                        notes:
                            data.notes?.trim() || null,
                    }
                );

            await MoneyRepository.createTransaction(client, {
                accountId,
                moneyAccountId:
                    data.moneyAccountId,
                type: "payment",
                direction: "out",
                amount,
                description:
                    data.notes?.trim() ||
                    `Payment for payable: ${payable.name}`,
                createdByUserId: userId,
            });

            const newRemainingAmount =
                remainingAmount - amount;

            const status =
                newRemainingAmount === 0
                    ? "paid"
                    : "partial";

            await MoneyRepository.updatePayableStatus(
                client,
                {
                    payableId,
                    accountId,
                    status,
                }
            );

            return {
                payment,
                payable: {
                    id: payableId,
                    originalAmount,
                    paidAmount:
                        paidAmount + amount,
                    remainingAmount:
                        newRemainingAmount,
                    status,
                },
            };
        });
    },

    async getPayablePayments(
        userId,
        accountId,
        payableId
    ) {
        return withClient(async (client) => {
            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.view"
            );

            const payable =
                await MoneyRepository.getPayableById(
                    client,
                    payableId,
                    accountId
                );

            if (!payable) {
                throw new AppError(
                    "Payable not found.",
                    404,
                    "PAYABLE_NOT_FOUND"
                );
            }

            return MoneyRepository.getPayablePayments(
                client,
                payableId,
                accountId
            );
        });
    },

    // ============================================================
    // CREDITS
    // ============================================================

    async createCredit(userId, accountId, data) {
        return withTransaction(async (client) => {
            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.create"
            );

            const name = data.name?.trim();
            const amount = Number(data.amount);

            if (!name) {
                throw new AppError(
                    "Credit name is required.",
                    400,
                    "INVALID_CREDIT_NAME"
                );
            }

            if (!Number.isFinite(amount) || amount <= 0) {
                throw new AppError(
                    "Credit amount must be greater than zero.",
                    400,
                    "INVALID_AMOUNT"
                );
            }

            return MoneyRepository.createCredit(client, {
                accountId,
                name,
                description:
                    data.description?.trim() || null,
                amount,
                dueDate: data.dueDate ?? null,
                createdByUserId: userId,
            });
        });
    },

    async getCredit(userId, accountId, creditId) {
        return withClient(async (client) => {
            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.view"
            );

            const credit =
                await MoneyRepository.getCreditById(
                    client,
                    creditId,
                    accountId
                );

            if (!credit) {
                throw new AppError(
                    "Credit not found.",
                    404,
                    "CREDIT_NOT_FOUND"
                );
            }

            return credit;
        });
    },

    async getCredits(userId, accountId, filters = {}) {
        return withClient(async (client) => {
            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.view"
            );

            const page = Number(filters.page) || 1;
            const limit = Number(filters.limit) || 20;

            if (page < 1 || limit < 1 || limit > 100) {
                throw new AppError(
                    "Invalid pagination values.",
                    400,
                    "INVALID_PAGINATION"
                );
            }

            const query = {
                accountId,
                status: filters.status ?? null,
                search: filters.search?.trim() || null,
                dateFrom: filters.dateFrom ?? null,
                dateTo: filters.dateTo ?? null,
                page,
                limit,
            };

            const countQuery = {
                accountId,
                status: filters.status ?? null,
                search: filters.search?.trim() || null,
                dateFrom: filters.dateFrom ?? null,
                dateTo: filters.dateTo ?? null,
            };

            const [rows, total] = await Promise.all([
                MoneyRepository.getCredits(client, query),
                MoneyRepository.countCredits(
                    client,
                    countQuery
                ),
            ]);

            return {
                data: rows,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        });
    },

    async receiveCreditPayment(
        userId,
        accountId,
        creditId,
        data
    ) {
        return withTransaction(async (client) => {
            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.create"
            );

            const credit =
                await MoneyRepository.getCreditForUpdate(
                    client,
                    creditId,
                    accountId
                );

            if (!credit) {
                throw new AppError(
                    "Credit not found or is already closed.",
                    404,
                    "CREDIT_NOT_FOUND"
                );
            }

            const originalAmount = Number(credit.amount);

            const receivedAmount = Number(
                await MoneyRepository.getCreditReceivedAmount(
                    client,
                    creditId,
                    accountId
                )
            );

            const remainingAmount =
                originalAmount - receivedAmount;

            if (remainingAmount <= 0) {
                throw new AppError(
                    "This credit has already been fully paid.",
                    400,
                    "CREDIT_ALREADY_PAID"
                );
            }

            let amount;

            if (data.full === true) {
                amount = remainingAmount;
            } else {
                amount = Number(data.amount);

                if (!Number.isFinite(amount) || amount <= 0) {
                    throw new AppError(
                        "Received amount must be greater than zero.",
                        400,
                        "INVALID_AMOUNT"
                    );
                }

                if (amount > remainingAmount) {
                    throw new AppError(
                        "Received amount cannot exceed the remaining credit amount.",
                        400,
                        "AMOUNT_EXCEEDS_REMAINING"
                    );
                }
            }

            const moneyAccount =
                await MoneyRepository.getMoneyAccountForUpdate(
                    client,
                    data.moneyAccountId,
                    accountId
                );

            if (!moneyAccount) {
                throw new AppError(
                    "Active destination money account not found.",
                    404,
                    "MONEY_ACCOUNT_NOT_FOUND"
                );
            }

            const payment =
                await MoneyRepository.createCreditPayment(
                    client,
                    {
                        accountId,
                        creditId,
                        moneyAccountId:
                            data.moneyAccountId,
                        amount,
                        receivedByUserId: userId,
                        notes:
                            data.notes?.trim() || null,
                    }
                );

            await MoneyRepository.createTransaction(client, {
                accountId,
                moneyAccountId:
                    data.moneyAccountId,
                type: "income",
                direction: "in",
                amount,
                description:
                    data.notes?.trim() ||
                    `Credit payment received: ${credit.name}`,
                createdByUserId: userId,
            });

            const newRemainingAmount =
                remainingAmount - amount;

            const status =
                newRemainingAmount === 0
                    ? "paid"
                    : "partial";

            await MoneyRepository.updateCreditStatus(
                client,
                {
                    creditId,
                    accountId,
                    status,
                }
            );

            return {
                payment,
                credit: {
                    id: creditId,
                    originalAmount,
                    receivedAmount:
                        receivedAmount + amount,
                    remainingAmount:
                        newRemainingAmount,
                    status,
                },
            };
        });
    },

    async getCreditPayments(
        userId,
        accountId,
        creditId
    ) {
        return withClient(async (client) => {
            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.view"
            );

            const credit =
                await MoneyRepository.getCreditById(
                    client,
                    creditId,
                    accountId
                );

            if (!credit) {
                throw new AppError(
                    "Credit not found.",
                    404,
                    "CREDIT_NOT_FOUND"
                );
            }

            return MoneyRepository.getCreditPayments(
                client,
                creditId,
                accountId
            );
        });
    },

    // ============================================================
    // TOTAL MONEY
    // ============================================================

    async getTotalMoney(userId, accountId) {
        return withClient(async (client) => {
            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.view"
            );

            return MoneyRepository.getTotalMoney(
                client,
                accountId
            );
        });
    },

    async getMoneyTotalsByType(userId, accountId) {
        return withClient(async (client) => {
            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.view"
            );

            return MoneyRepository.getMoneyTotalsByType(
                client,
                accountId
            );
        });
    },

    async getMoneyAccountTotals(userId, accountId) {
        return withClient(async (client) => {
            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.view"
            );

            return MoneyRepository.getMoneyAccountTotals(
                client,
                accountId
            );
        });
    },
};

export default MoneyService;