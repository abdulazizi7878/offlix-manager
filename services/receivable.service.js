// file: services/receivable.service.js

import pool from "@/lib/database";

import AppError from "@/lib/errors/AppError";

import AuthorizationService from "@/services/authorization.service";

import ReceivableRepository from "@/repositories/receivable.repository";

const ReceivableService = {

    /*
     * ============================================================
     * CREATE RECEIVABLE
     * ============================================================
     */

    async createReceivable(
        userId,
        accountId,
        data
    ) {
        const client = await pool.connect();

        try {
            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.create"
            );

            if (
                !data.name ||
                !data.name.trim()
            ) {
                throw new AppError(
                    "Name is required.",
                    400,
                    "NAME_REQUIRED"
                );
            }

            if (
                data.amount === undefined ||
                Number(data.amount) <= 0
            ) {
                throw new AppError(
                    "Amount must be greater than zero.",
                    400,
                    "INVALID_AMOUNT"
                );
            }

            const receivable =
                await ReceivableRepository.createReceivable(
                    client,
                    {
                        accountId,
                        name: data.name.trim(),
                        description:
                            data.description?.trim() || null,
                        amount: Number(data.amount),
                        dueDate:
                            data.dueDate || null,
                        createdByUserId: userId,
                    }
                );

            return {
                id: receivable.id,
                accountId: receivable.account_id,
                name: receivable.name,
                description: receivable.description,
                amount: Number(
                    receivable.amount
                ),
                paidAmount: 0,
                outstandingAmount: Number(
                    receivable.amount
                ),
                dueDate: receivable.due_date,
                status: receivable.status,
                createdByUserId:
                    receivable.created_by_user_id,
                createdAt: receivable.created_at,
                updatedAt: receivable.updated_at,
            };
        } catch (error) {
            console.error(
                "ReceivableService.createReceivable:",
                error
            );

            if (error instanceof AppError) {
                throw error;
            }

            throw new AppError(
                "Failed to create receivable.",
                500,
                "RECEIVABLE_CREATE_FAILED"
            );
        } finally {
            client.release();
        }
    },

    /*
     * ============================================================
     * GET RECEIVABLES
     * ============================================================
     */

    async getReceivables(
        userId,
        accountId,
        options = {}
    ) {
        const client = await pool.connect();

        try {
            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.view"
            );

            const limit = Math.min(
                Math.max(
                    Number(options.limit) || 20,
                    1
                ),
                100
            );

            const page = Math.max(
                Number(options.page) || 1,
                1
            );

            const offset =
                (page - 1) * limit;

            const status =
                options.status || null;

            const search =
                options.search?.trim() || null;

            const [
                items,
                total,
            ] = await Promise.all([
                ReceivableRepository.getReceivables(
                    client,
                    {
                        accountId,
                        status,
                        search,
                        limit,
                        offset,
                    }
                ),

                ReceivableRepository.countReceivables(
                    client,
                    {
                        accountId,
                        status,
                        search,
                    }
                ),
            ]);

            return {
                items,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(
                        total / limit
                    ),
                },
            };
        } catch (error) {
            console.error(
                "ReceivableService.getReceivables:",
                error
            );

            if (error instanceof AppError) {
                throw error;
            }

            throw new AppError(
                "Failed to fetch receivables.",
                500,
                "RECEIVABLES_FETCH_FAILED"
            );
        } finally {
            client.release();
        }
    },

    /*
     * ============================================================
     * GET RECEIVABLE
     * ============================================================
     */

    async getReceivable(
        userId,
        accountId,
        receivableId
    ) {
        const client = await pool.connect();

        try {
            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.view"
            );

            const receivable =
                await ReceivableRepository.getReceivable(
                    client,
                    {
                        accountId,
                        receivableId,
                    }
                );

            if (!receivable) {
                throw new AppError(
                    "Receivable not found.",
                    404,
                    "RECEIVABLE_NOT_FOUND"
                );
            }

            const payments =
                await ReceivableRepository.getPayments(
                    client,
                    {
                        accountId,
                        receivableId,
                    }
                );

            return {
                ...receivable,
                payments,
            };
        } catch (error) {
            console.error(
                "ReceivableService.getReceivable:",
                error
            );

            if (error instanceof AppError) {
                throw error;
            }

            throw new AppError(
                "Failed to fetch receivable.",
                500,
                "RECEIVABLE_FETCH_FAILED"
            );
        } finally {
            client.release();
        }
    },

    /*
     * ============================================================
     * UPDATE RECEIVABLE
     * ============================================================
     */

    async updateReceivable(
        userId,
        accountId,
        receivableId,
        data
    ) {
        const client = await pool.connect();

        try {
            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.create"
            );

            const existing =
                await ReceivableRepository.getReceivable(
                    client,
                    {
                        accountId,
                        receivableId,
                    }
                );

            if (!existing) {
                throw new AppError(
                    "Receivable not found.",
                    404,
                    "RECEIVABLE_NOT_FOUND"
                );
            }

            if (existing.status === "paid") {
                throw new AppError(
                    "A paid receivable cannot be updated.",
                    400,
                    "RECEIVABLE_ALREADY_PAID"
                );
            }

            const paidAmount =
                existing.paidAmount;

            const amount =
                Number(data.amount);

            if (
                !Number.isFinite(amount) ||
                amount <= 0
            ) {
                throw new AppError(
                    "Amount must be greater than zero.",
                    400,
                    "INVALID_AMOUNT"
                );
            }

            if (amount < paidAmount) {
                throw new AppError(
                    "Amount cannot be less than the amount already received.",
                    400,
                    "AMOUNT_BELOW_PAID"
                );
            }

            const receivable =
                await ReceivableRepository.updateReceivable(
                    client,
                    {
                        accountId,
                        receivableId,
                        name:
                            data.name.trim(),
                        description:
                            data.description?.trim() ||
                            null,
                        amount,
                        dueDate:
                            data.dueDate || null,
                    }
                );

            return {
                ...receivable,
                amount: Number(
                    receivable.amount
                ),
                paidAmount,
                outstandingAmount:
                    Math.max(
                        amount - paidAmount,
                        0
                    ),
            };
        } catch (error) {
            console.error(
                "ReceivableService.updateReceivable:",
                error
            );

            if (error instanceof AppError) {
                throw error;
            }

            throw new AppError(
                "Failed to update receivable.",
                500,
                "RECEIVABLE_UPDATE_FAILED"
            );
        } finally {
            client.release();
        }
    },

    /*
     * ============================================================
     * DELETE RECEIVABLE
     * ============================================================
     */

    async deleteReceivable(
        userId,
        accountId,
        receivableId
    ) {
        const client = await pool.connect();

        try {
            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.create"
            );

            const existing =
                await ReceivableRepository.getReceivable(
                    client,
                    {
                        accountId,
                        receivableId,
                    }
                );

            if (!existing) {
                throw new AppError(
                    "Receivable not found.",
                    404,
                    "RECEIVABLE_NOT_FOUND"
                );
            }

            if (existing.paidAmount > 0) {
                throw new AppError(
                    "A receivable with payments cannot be deleted.",
                    400,
                    "RECEIVABLE_HAS_PAYMENTS"
                );
            }

            await ReceivableRepository.deleteReceivable(
                client,
                {
                    accountId,
                    receivableId,
                }
            );

            return {
                id: receivableId,
            };
        } catch (error) {
            console.error(
                "ReceivableService.deleteReceivable:",
                error
            );

            if (error instanceof AppError) {
                throw error;
            }

            throw new AppError(
                "Failed to delete receivable.",
                500,
                "RECEIVABLE_DELETE_FAILED"
            );
        } finally {
            client.release();
        }
    },

    /*
     * ============================================================
     * RECEIVE PAYMENT
     * ============================================================
     */

    async receivePayment(
        userId,
        accountId,
        receivableId,
        data
    ) {
        const client = await pool.connect();

        try {
            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.create"
            );

            await client.query("BEGIN");

            const receivable =
                await ReceivableRepository.getReceivable(
                    client,
                    {
                        accountId,
                        receivableId,
                    }
                );

            if (!receivable) {
                throw new AppError(
                    "Receivable not found.",
                    404,
                    "RECEIVABLE_NOT_FOUND"
                );
            }

            if (
                receivable.status === "paid"
            ) {
                throw new AppError(
                    "This receivable is already fully paid.",
                    400,
                    "RECEIVABLE_ALREADY_PAID"
                );
            }

            if (
                receivable.status === "cancelled"
            ) {
                throw new AppError(
                    "A cancelled receivable cannot receive payments.",
                    400,
                    "RECEIVABLE_CANCELLED"
                );
            }

            const amount =
                Number(data.amount);

            if (
                !Number.isFinite(amount) ||
                amount <= 0
            ) {
                throw new AppError(
                    "Payment amount must be greater than zero.",
                    400,
                    "INVALID_PAYMENT_AMOUNT"
                );
            }

            if (
                amount >
                receivable.outstandingAmount
            ) {
                throw new AppError(
                    "Payment cannot be greater than the outstanding amount.",
                    400,
                    "PAYMENT_EXCEEDS_OUTSTANDING"
                );
            }

            const moneyAccount =
                await ReceivableRepository.getMoneyAccount(
                    client,
                    {
                        accountId,
                        moneyAccountId:
                            data.moneyAccountId,
                    }
                );

            if (!moneyAccount) {
                throw new AppError(
                    "Money account not found.",
                    404,
                    "MONEY_ACCOUNT_NOT_FOUND"
                );
            }

            if (
                moneyAccount.status !== "active"
            ) {
                throw new AppError(
                    "Money account is inactive.",
                    400,
                    "MONEY_ACCOUNT_INACTIVE"
                );
            }

            const payment =
                await ReceivableRepository.createReceivablePayment(
                    client,
                    {
                        accountId,
                        receivableId,
                        moneyAccountId:
                            data.moneyAccountId,
                        amount,
                        receivedByUserId:
                            userId,
                        notes:
                            data.notes?.trim() ||
                            null,
                    }
                );

            await ReceivableRepository.createMoneyTransaction(
                client,
                {
                    accountId,
                    moneyAccountId:
                        data.moneyAccountId,
                    amount,
                    description:
                        `Receivable payment from ${receivable.name}`,
                    createdByUserId:
                        userId,
                }
            );

            const newOutstanding =
                receivable.outstandingAmount -
                amount;

            const newStatus =
                newOutstanding <= 0
                    ? "paid"
                    : "partial";

            await ReceivableRepository.updateStatus(
                client,
                {
                    accountId,
                    receivableId,
                    status: newStatus,
                }
            );

            await client.query("COMMIT");

            return {
                payment: {
                    id: payment.id,
                    receivableId:
                        payment.receivable_id,
                    moneyAccountId:
                        payment.money_account_id,
                    amount: Number(
                        payment.amount
                    ),
                    receivedAt:
                        payment.received_at,
                    notes: payment.notes,
                },

                receivable: {
                    id: receivable.id,
                    amount:
                        receivable.amount,
                    paidAmount:
                        receivable.paidAmount +
                        amount,
                    outstandingAmount:
                        Math.max(
                            newOutstanding,
                            0
                        ),
                    status: newStatus,
                },
            };
        } catch (error) {
            await client.query("ROLLBACK");

            console.error(
                "ReceivableService.receivePayment:",
                error
            );

            if (error instanceof AppError) {
                throw error;
            }

            throw new AppError(
                "Failed to receive receivable payment.",
                500,
                "RECEIVABLE_PAYMENT_FAILED"
            );
        } finally {
            client.release();
        }
    },
};

export default ReceivableService;