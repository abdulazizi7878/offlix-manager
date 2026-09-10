// file: app/dashboard/money/transactions/page.jsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRightLeft, Plus, Search, ArrowUpRight, ArrowDownLeft, AlertCircle, ChevronLeft, ChevronRight, Calendar, Filter } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");
    const [accountFilter, setAccountFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [directionFilter, setDirectionFilter] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        money_account_id: "",
        type: "expense",
        direction: "out",
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0]
    });

    const loadData = async (currentPage = 1) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            params.append("page", currentPage.toString());
            params.append("limit", "10");
            if (search) params.append("search", search);
            if (accountFilter) params.append("moneyAccountId", accountFilter);
            if (typeFilter) params.append("type", typeFilter);
            if (directionFilter) params.append("direction", directionFilter);

            const [txRes, accRes] = await Promise.all([
                fetchApi(`/api/v1/dashboard/money/transactions?${params.toString()}`),
                fetchApi("/api/v1/dashboard/money/accounts")
            ]);

            const txData = txRes.data?.data ?? {};

            setTransactions(txData ?? []);
            setPagination(txData.pagination ?? { totalPages: 1, total: 0 });
            setAccounts(accRes.data?.data ?? []);

        } catch (err) {
            setError(err.message || "Failed to load transactions.");
            toast.error("Failed to load transactions");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadData(page);
        }, 300);
        return () => clearTimeout(timer);
    }, [page, search, accountFilter, typeFilter, directionFilter]);

    const handleCreateTransaction = async (e) => {
        e.preventDefault();
        if (!formData.money_account_id) {
            toast.error("Please select a money account");
            return;
        }
        if (!formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        // Validate max 2 decimal places
        const parts = formData.amount.split(".");
        if (parts[1] && parts[1].length > 2) {
            toast.error("Amounts can support a maximum of 2 decimal places");
            return;
        }

        setIsSubmitting(true);
        try {
            await fetchApi("/api/v1/dashboard/money/transactions", {
                method: "POST",
                body: JSON.stringify({
                    moneyAccountId: formData.money_account_id,
                    type: formData.type,
                    direction: formData.direction,
                    amount: Number(formData.amount),
                    description: formData.description
                })
            });
            toast.success("Transaction recorded successfully");
            setIsCreateModalOpen(false);
            setFormData({
                money_account_id: "",
                type: "expense",
                direction: "out",
                amount: "",
                description: "",
                date: new Date().toISOString().split("T")[0]
            });
            loadData(page);
        } catch (err) {
            toast.error(err.message || "Failed to record transaction");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-(--border)">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-(--primary)/10 text-(--primary) rounded-xl">
                        <ArrowRightLeft className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
                        <p className="text-sm text-(--muted-foreground) mt-0.5">
                            Track all incoming and outgoing financial movements.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 bg-(--primary) text-(--primary-foreground) px-4 py-2 rounded-lg font-medium text-sm hover:opacity-95 transition-opacity"
                >
                    <Plus className="w-4 h-4" />
                    <span>New Transaction</span>
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-(--card) border border-(--border) rounded-xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--muted-foreground)" />
                    <input
                        type="text"
                        placeholder="Search description..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-9 pr-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                    />
                </div>
                <select
                    value={accountFilter}
                    onChange={(e) => { setAccountFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                >
                    <option value="">All Accounts</option>
                    {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                </select>
                <select
                    value={typeFilter}
                    onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                >
                    <option value="">All Types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                    <option value="deposit">Deposit</option>
                    <option value="withdrawal">Withdrawal</option>
                    <option value="payment">Payment</option>
                    <option value="settlement">Settlement</option>
                    <option value="other">Other</option>
                </select>
                <select
                    value={directionFilter}
                    onChange={(e) => { setDirectionFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                >
                    <option value="">All Directions</option>
                    <option value="in">Money In</option>
                    <option value="out">Money Out</option>
                </select>
            </div>

            {error && (
                <div className="p-4 bg-(--destructive)/10 border border-(--destructive)/20 rounded-xl flex items-center justify-between text-(--destructive)">
                    <span className="text-sm font-medium">{error}</span>
                    <button onClick={() => loadData(page)} className="px-3 py-1.5 bg-(--background) border border-(--border) text-xs rounded-lg font-medium">Retry</button>
                </div>
            )}

            {isLoading && (
                <div className="space-y-4 animate-pulse">
                    <div className="h-64 bg-(--card) border border-(--border) rounded-xl" />
                </div>
            )}

            {!isLoading && !error && transactions.length === 0 && (
                <div className="p-12 text-center bg-(--card) border border-(--border) rounded-xl space-y-4">
                    <div className="mx-auto w-12 h-12 bg-(--muted) text-(--muted-foreground) rounded-full flex items-center justify-center">
                        <ArrowRightLeft className="w-6 h-6" />
                    </div>
                    <div className="max-w-sm mx-auto space-y-1">
                        <h2 className="text-lg font-semibold">No transactions found</h2>
                        <p className="text-xs text-(--muted-foreground)">Record your first transaction to start tracking cash flow.</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 bg-(--primary) text-(--primary-foreground) px-4 py-2 rounded-lg font-medium text-sm hover:opacity-95 transition-opacity"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New Transaction</span>
                    </button>
                </div>
            )}

            {!isLoading && !error && transactions.length > 0 && (
                <div className="space-y-4">
                    <div className="bg-(--card) border border-(--border) rounded-xl shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-(--muted)/50 border-b border-(--border) text-(--muted-foreground) text-xs font-semibold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3.5">Type / Description</th>
                                        <th className="px-6 py-3.5">Account</th>
                                        <th className="px-6 py-3.5">Direction</th>
                                        <th className="px-6 py-3.5">Amount</th>
                                        <th className="px-6 py-3.5">Date</th>
                                        <th className="px-6 py-3.5 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-(--border)">
                                    {transactions.map((tx) => {
                                        const isIn = tx.direction === "in" || tx.type === "income" || tx.type === "deposit";
                                        const txDate = tx.date || tx.created_at;
                                        return (
                                            <tr key={tx.id} className="hover:bg-(--muted)/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${isIn ? "bg-(--success)/10 text-(--success)" : "bg-(--destructive)/10 text-(--destructive)"}`}>
                                                            {isIn ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium capitalize">{tx.type}</p>
                                                            <p className="text-xs text-(--muted-foreground) truncate max-w-xs">{tx.description || "No description"}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-medium">
                                                    {tx.money_account_name || tx.money_account?.name || "Account"}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium uppercase ${isIn ? "bg-(--success)/10 text-(--success)" : "bg-(--destructive)/10 text-(--destructive)"}`}>
                                                        {tx.direction || (isIn ? "In" : "Out")}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-semibold">
                                                    <span className={isIn ? "text-(--success)" : "text-(--destructive)"}>
                                                        {isIn ? "+" : "-"}{Number(tx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-(--muted-foreground)">ETB</span>
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-(--muted-foreground)">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-(--foreground)" title={txDate}>
                                                            {dayjs(txDate).fromNow()}
                                                        </span>
                                                        <span className="text-[11px] text-(--muted-foreground)">
                                                            {new Date(txDate).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link
                                                        href={`/dashboard/money/transactions/${tx.id}`}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-(--border) rounded-lg text-xs font-medium hover:bg-(--muted) transition-colors"
                                                    >
                                                        Details
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Transaction Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-(--card) border border-(--border) rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-4 border-b border-(--border)">
                            <h2 className="text-lg font-bold">Record Transaction</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-(--muted-foreground) hover:text-(--foreground)">✕</button>
                        </div>
                        <form onSubmit={handleCreateTransaction} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => {
                                            const t = e.target.value;
                                            const isInc = ["income", "deposit"].includes(t);
                                            setFormData({
                                                ...formData,
                                                type: t,
                                                direction: isInc ? "in" : "out"
                                            });
                                        }}
                                        className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                                    >
                                        <option value="expense">Expense</option>
                                        <option value="income">Income</option>
                                        <option value="deposit">Deposit</option>
                                        <option value="withdrawal">Withdrawal</option>
                                        <option value="payment">Payment</option>
                                        <option value="settlement">Settlement</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Direction</label>
                                    <select
                                        value={formData.direction}
                                        onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                                        className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                                    >
                                        <option value="in">Money In (Inflow)</option>
                                        <option value="out">Money Out (Outflow)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Money Account</label>
                                <select
                                    value={formData.money_account_id}
                                    onChange={(e) => setFormData({ ...formData, money_account_id: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                                >
                                    <option value="">Select Money Account</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Amount (ETB)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Date</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Description / Notes</label>
                                <textarea
                                    rows="2"
                                    placeholder="Add notes or description..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-(--border)">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 border border-(--border) rounded-lg text-sm font-medium hover:bg-(--muted) transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-sm font-medium hover:opacity-95 transition-opacity disabled:opacity-50"
                                >
                                    {isSubmitting ? "Recording..." : "Record Transaction"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}