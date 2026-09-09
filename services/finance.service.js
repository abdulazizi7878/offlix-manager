
// file: services/finance.service.js

import pool from "@/lib/database";
import AppError from "@/lib/errors/AppError";
import FinanceRepository from "@/repositories/finance.repository";
import AuthorizationService from "@/services/authorization.service";

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

const FinanceService = {
    async createFinancialAccount(userId, accountId, data) {
        const client = await pool.connect();

        try {
            await AuthorizationService.assertAccountMember(
                client,
                userId,
                accountId
            );

            if (data.branchId) {
                const branch =
                    await FinanceRepository.getBranchForAccount?.(
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
                    "finance.accounts.create"
                );
            } else {
                await AuthorizationService.assertPermission(
                    client,
                    userId,
                    accountId,
                    "finance.accounts.create"
                );
            }

            await client.query("BEGIN");

            const financialAccount =
                await FinanceRepository.createFinancialAccount(
                    client,
                    {
                        accountId,
                        ...data,
                    }
                );

            await client.query("COMMIT");

            return financialAccount;
        } catch (error) {
            await client.query("ROLLBACK");

            if (error instanceof AppError) {
                throw error;
            }

            if (error?.code === "23505") {
                throw new AppError(
                    "Financial account already exists.",
                    409,
                    "FINANCIAL_ACCOUNT_ALREADY_EXISTS"
                );
            }

            console.error(
                "FinanceService.createFinancialAccount:",
                error
            );

            throw new AppError(
                "Failed to create financial account.",
                500,
                "FINANCIAL_ACCOUNT_CREATE_FAILED"
            );
        } finally {
            client.release();
        }
    },

    async getFinancialAccounts(userId, accountId, options = {}) {
        const client = await pool.connect();

        try {
            await AuthorizationService.assertAccountMember(
                client,
                userId,
                accountId
            );

            if (options.branchId) {
                await AuthorizationService.assertBranchPermission(
                    client,
                    userId,
                    accountId,
                    options.branchId,
                    "finance.accounts.view"
                );
            } else {
                await AuthorizationService.assertPermission(
                    client,
                    userId,
                    accountId,
                    "finance.accounts.view"
                );
            }

            return await FinanceRepository.getFinancialAccounts(
                client,
                accountId,
                options.branchId
            );
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "FinanceService.getFinancialAccounts:",
                error
            );

            throw new AppError(
                "Failed to fetch financial accounts.",
                500,
                "FINANCIAL_ACCOUNTS_FETCH_FAILED"
            );
        } finally {
            client.release();
        }
    },
    async getReceivables(userId, accountId, options = {}) {
        const client = await pool.connect();

        try {
            await AuthorizationService.assertAccountMember(
                client,
                userId,
                accountId
            );

            if (options.branchId) {
                await AuthorizationService.assertBranchPermission(
                    client,
                    userId,
                    accountId,
                    options.branchId,
                    "finance.receivables.view"
                );
            } else {
                await AuthorizationService.assertPermission(
                    client,
                    userId,
                    accountId,
                    "finance.receivables.view"
                );
            }

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

            const [receivables, total] =
                await Promise.all([
                    FinanceRepository.getReceivables(
                        client,
                        {
                            ...options,
                            accountId,
                            page,
                            limit,
                        }
                    ),
                    FinanceRepository.countReceivables(
                        client,
                        {
                            ...options,
                            accountId,
                        }
                    ),
                ]);

            return {
                receivables,
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
            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "FinanceService.getReceivables:",
                error
            );

            throw new AppError(
                "Failed to fetch receivables.",
                500,
                "RECEIVABLES_FETCH_FAILED"
            );
        } finally {
            client.release();
        }
    },

    async payReceivable(
        userId,
        accountId,
        receivableId,
        data
    ) {
        const client = await pool.connect();

        try {
            await AuthorizationService.assertAccountMember(
                client,
                userId,
                accountId
            );

            await client.query("BEGIN");

            const receivable =
                await FinanceRepository.getReceivableById(
                    client,
                    receivableId,
                    accountId
                );

            if (!receivable) {
                throw new AppError(
                    "Receivable not found.",
                    404,
                    "RECEIVABLE_NOT_FOUND"
                );
            }

            await AuthorizationService.assertBranchPermission(
                client,
                userId,
                accountId,
                receivable.branch_id,
                "finance.payments.create"
            );

            const remaining = Number(
                receivable.remaining_amount
            );

            if (data.amount > remaining) {
                throw new AppError(
                    "Payment cannot exceed the remaining receivable.",
                    400,
                    "PAYMENT_EXCEEDS_RECEIVABLE"
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

            if (
                financialAccount.branch_id !==
                receivable.branch_id
            ) {
                throw new AppError(
                    "Financial account does not belong to this branch.",
                    403,
                    "FINANCIAL_ACCOUNT_BRANCH_MISMATCH"
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
                        branchId: receivable.branch_id,
                        type: "receivable_payment",
                        amount: data.amount,
                        fromFinancialAccountId: null,
                        toFinancialAccountId:
                            financialAccount.id,
                        description:
                            `Receivable payment ${receivable.id}`,
                        referenceType: "receivable",
                        referenceId: receivable.id,
                        createdByUserId: userId,
                    }
                );

            await FinanceRepository.createPayment(
                client,
                {
                    accountId,
                    branchId: receivable.branch_id,
                    paymentType: "receivable_payment",
                    receivableId: receivable.id,
                    amount: data.amount,
                    paymentMethod: data.paymentMethod,
                    financialAccountId:
                        financialAccount.id,
                    moneyTransactionId:
                        transaction.id,
                    createdByUserId: userId,
                }
            );

            const newRemaining =
                remaining - data.amount;

            await FinanceRepository.updateReceivableStatus(
                client,
                receivable.id,
                newRemaining === 0
                    ? "paid"
                    : "partial"
            );

            await client.query("COMMIT");

            return await FinanceRepository.getReceivableById(
                client,
                receivable.id,
                accountId
            );
        } catch (error) {
            await client.query("ROLLBACK");

            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "FinanceService.payReceivable:",
                error
            );

            throw new AppError(
                "Failed to record receivable payment.",
                500,
                "RECEIVABLE_PAYMENT_FAILED"
            );
        } finally {
            client.release();
        }
    },

    async createPayable(userId, accountId, data) {
        const client = await pool.connect();

        try {
            await AuthorizationService.assertAccountMember(
                client,
                userId,
                accountId
            );

            if (data.branchId) {
                await AuthorizationService.assertBranchPermission(
                    client,
                    userId,
                    accountId,
                    data.branchId,
                    "finance.payables.create"
                );
            } else {
                await AuthorizationService.assertPermission(
                    client,
                    userId,
                    accountId,
                    "finance.payables.create"
                );
            }

            await client.query("BEGIN");

            const payable =
                await FinanceRepository.createPayable(
                    client,
                    {
                        accountId,
                        ...data,
                        createdByUserId: userId,
                    }
                );

            await client.query("COMMIT");

            return payable;
        } catch (error) {
            await client.query("ROLLBACK");

            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "FinanceService.createPayable:",
                error
            );

            throw new AppError(
                "Failed to create payable.",
                500,
                "PAYABLE_CREATE_FAILED"
            );
        } finally {
            client.release();
        }
    },

    async payPayable(
        userId,
        accountId,
        payableId,
        data
    ) {
        const client = await pool.connect();

        try {
            await AuthorizationService.assertAccountMember(
                client,
                userId,
                accountId
            );

            await client.query("BEGIN");

            const payable =
                await FinanceRepository.getPayableById(
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

            if (payable.branch_id) {
                await AuthorizationService.assertBranchPermission(
                    client,
                    userId,
                    accountId,
                    payable.branch_id,
                    "finance.payments.create"
                );
            } else {
                await AuthorizationService.assertPermission(
                    client,
                    userId,
                    accountId,
                    "finance.payments.create"
                );
            }

            if (
                data.amount >
                Number(payable.remaining_amount)
            ) {
                throw new AppError(
                    "Payment cannot exceed the remaining payable.",
                    400,
                    "PAYMENT_EXCEEDS_PAYABLE"
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

            if (
                payable.branch_id &&
                financialAccount.branch_id !==
                payable.branch_id
            ) {
                throw new AppError(
                    "Financial account does not belong to this branch.",
                    403,
                    "FINANCIAL_ACCOUNT_BRANCH_MISMATCH"
                );
            }

            const transaction =
                await FinanceRepository.createMoneyTransaction(
                    client,
                    {
                        accountId,
                        branchId: payable.branch_id,
                        type: "payable_payment",
                        amount: data.amount,
                        fromFinancialAccountId:
                            financialAccount.id,
                        toFinancialAccountId: null,
                        description:
                            `Payable payment ${payable.id}`,
                        referenceType: "payable",
                        referenceId: payable.id,
                        createdByUserId: userId,
                    }
                );

            await FinanceRepository.createPayablePayment(
                client,
                {
                    payableId: payable.id,
                    amount: data.amount,
                    moneyTransactionId:
                        transaction.id,
                    createdByUserId: userId,
                }
            );

            const remaining =
                Number(payable.remaining_amount) -
                data.amount;

            await FinanceRepository.updatePayableStatus(
                client,
                payable.id,
                remaining === 0
                    ? "paid"
                    : "partial"
            );

            await client.query("COMMIT");

            return await FinanceRepository.getPayableById(
                client,
                payable.id,
                accountId
            );
        } catch (error) {
            await client.query("ROLLBACK");

            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "FinanceService.payPayable:",
                error
            );

            throw new AppError(
                "Failed to record payable payment.",
                500,
                "PAYABLE_PAYMENT_FAILED"
            );
        } finally {
            client.release();
        }
    },
    async createSettlement(
        userId,
        accountId,
        data
    ) {
        const client = await pool.connect();

        try {
            await AuthorizationService.assertAccountMember(
                client,
                userId,
                accountId
            );

            await AuthorizationService.assertBranchPermission(
                client,
                userId,
                accountId,
                data.branchId,
                "finance.settlements.create"
            );

            await client.query("BEGIN");

            const settlement =
                await FinanceRepository.createSettlement(
                    client,
                    {
                        accountId,
                        ...data,
                        requestedByUserId: userId,
                    }
                );

            await client.query("COMMIT");

            return settlement;
        } catch (error) {
            await client.query("ROLLBACK");

            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "FinanceService.createSettlement:",
                error
            );

            throw new AppError(
                "Failed to create settlement.",
                500,
                "SETTLEMENT_CREATE_FAILED"
            );
        } finally {
            client.release();
        }
    },
    async receiveSettlement(
        userId,
        accountId,
        settlementId,
        data
    ) {
        const client = await pool.connect();

        try {
            await AuthorizationService.assertAccountMember(
                client,
                userId,
                accountId
            );

            await client.query("BEGIN");

            const settlement =
                await FinanceRepository.getSettlementById(
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

            await AuthorizationService.assertPermission(
                client,
                userId,
                accountId,
                "finance.settlements.receive"
            );

            if (settlement.status === "received") {
                throw new AppError(
                    "Settlement has already been received.",
                    400,
                    "SETTLEMENT_ALREADY_RECEIVED"
                );
            }

            const source =
                await FinanceRepository.getFinancialAccountById(
                    client,
                    data.sourceFinancialAccountId,
                    accountId
                );

            const destination =
                await FinanceRepository.getFinancialAccountById(
                    client,
                    data.receivingFinancialAccountId,
                    accountId
                );

            if (!source) {
                throw new AppError(
                    "Source financial account not found.",
                    404,
                    "SOURCE_ACCOUNT_NOT_FOUND"
                );
            }

            if (!destination) {
                throw new AppError(
                    "Receiving financial account not found.",
                    404,
                    "RECEIVING_ACCOUNT_NOT_FOUND"
                );
            }

            if (
                source.branch_id !==
                settlement.branch_id
            ) {
                throw new AppError(
                    "Source account does not belong to the settlement branch.",
                    403,
                    "INVALID_SETTLEMENT_SOURCE"
                );
            }

            if (destination.branch_id !== null) {
                throw new AppError(
                    "Settlement must be received into an owner financial account.",
                    400,
                    "INVALID_SETTLEMENT_DESTINATION"
                );
            }

            const transaction =
                await FinanceRepository.createMoneyTransaction(
                    client,
                    {
                        accountId,
                        branchId:
                            settlement.branch_id,
                        type: "settlement",
                        amount: settlement.amount,
                        fromFinancialAccountId:
                            source.id,
                        toFinancialAccountId:
                            destination.id,
                        description:
                            `Branch settlement ${settlement.id}`,
                        referenceType:
                            "branch_settlement",
                        referenceId:
                            settlement.id,
                        createdByUserId: userId,
                    }
                );

            const result = await client.query(
                `
            UPDATE branch_settlements
            SET
                status = 'received',
                received_by_user_id = $2,
                received_at = NOW(),
                source_financial_account_id = $3,
                receiving_financial_account_id = $4,
                money_transaction_id = $5,
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
            `,
                [
                    settlement.id,
                    userId,
                    source.id,
                    destination.id,
                    transaction.id,
                ]
            );

            await client.query("COMMIT");

            return result.rows[0];
        } catch (error) {
            await client.query("ROLLBACK");

            if (error instanceof AppError) {
                throw error;
            }

            console.error(
                "FinanceService.receiveSettlement:",
                error
            );

            throw new AppError(
                "Failed to receive settlement.",
                500,
                "SETTLEMENT_RECEIVE_FAILED"
            );
        } finally {
            client.release();
        }
    },
};

export default FinanceService;