"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRightLeft, Plus, Search, ArrowUpRight, ArrowDownLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function TransactionsPage() {
    const t = useTranslations("dashboard.transactionsPage");
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");
    const [accountFilter, setAccountFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [directionFilter, setDirectionFilter] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ totalPages: 1, total: 0, page: 1 });

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

            // Safely parse nested structure: { success: true, data: { data: [...], pagination: {...} } }
            const responseObj = txRes.data?.data ?? txRes.data ?? {};
            const list = Array.isArray(responseObj)
                ? responseObj
                : (responseObj.data ?? responseObj.items ?? []);

            const pageInfo = responseObj.pagination ?? txRes.data?.pagination ?? { totalPages: 1, total: list.length, page: currentPage };

            setTransactions(list);
            setPagination(pageInfo);
            setAccounts(accRes.data?.data ?? accRes.data ?? []);

        } catch (err) {
            setError(err.message || t("messages.loadError"));
            toast.error(t("messages.loadError"));
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
            toast.error(t("messages.selectAccount"));
            return;
        }
        if (!formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0) {
            toast.error(t("messages.invalidAmount"));
            return;
        }

        // Validate max 2 decimal places
        const parts = formData.amount.split(".");
        if (parts[1] && parts[1].length > 2) {
            toast.error(t("messages.maxDecimals"));
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
            toast.success(t("messages.createSuccess"));
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
            toast.error(err.message || t("messages.createError"));
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
                        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
                        <p className="text-sm text-(--muted-foreground) mt-0.5">
                            {t("subtitle")}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 bg-(--primary) text-(--primary-foreground) px-4 py-2 rounded-lg font-medium text-sm hover:opacity-95 transition-opacity cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    <span>{t("newTransaction")}</span>
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-(--card) border border-(--border) rounded-xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--muted-foreground)" />
                    <input
                        type="text"
                        placeholder={t("searchPlaceholder")}
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
                    <option value="">{t("allAccounts")}</option>
                    {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                </select>
                <select
                    value={typeFilter}
                    onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                >
                    <option value="">{t("allTypes")}</option>
                    <option value="income">{t("types.income")}</option>
                    <option value="expense">{t("types.expense")}</option>
                    <option value="deposit">{t("types.deposit")}</option>
                    <option value="withdrawal">{t("types.withdrawal")}</option>
                    <option value="payment">{t("types.payment")}</option>
                    <option value="settlement">{t("types.settlement")}</option>
                    <option value="other">{t("types.other")}</option>
                </select>
                <select
                    value={directionFilter}
                    onChange={(e) => { setDirectionFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                >
                    <option value="">{t("allDirections")}</option>
                    <option value="in">{t("moneyIn")}</option>
                    <option value="out">{t("moneyOut")}</option>
                </select>
            </div>

            {error && (
                <div className="p-4 bg-(--destructive)/10 border border-(--destructive)/20 rounded-xl flex items-center justify-between text-(--destructive)">
                    <span className="text-sm font-medium">{error}</span>
                    <button onClick={() => loadData(page)} className="px-3 py-1.5 bg-(--background) border border-(--border) text-xs rounded-lg font-medium cursor-pointer">{t("retry")}</button>
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
                        <h2 className="text-lg font-semibold">{t("emptyState.title")}</h2>
                        <p className="text-xs text-(--muted-foreground)">{t("emptyState.subtitle")}</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 bg-(--primary) text-(--primary-foreground) px-4 py-2 rounded-lg font-medium text-sm hover:opacity-95 transition-opacity cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{t("newTransaction")}</span>
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
                                        <th className="px-6 py-3.5">{t("table.typeDescription")}</th>
                                        <th className="px-6 py-3.5">{t("table.account")}</th>
                                        <th className="px-6 py-3.5">{t("table.direction")}</th>
                                        <th className="px-6 py-3.5">{t("table.amount")}</th>
                                        <th className="px-6 py-3.5">{t("table.date")}</th>
                                        <th className="px-6 py-3.5 text-right">{t("table.action")}</th>
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
                                                            <p className="font-medium capitalize">{t(`types.${tx.type}`, { defaultValue: tx.type })}</p>
                                                            <p className="text-xs text-(--muted-foreground) truncate max-w-xs">{tx.description || t("noDescription")}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-medium">
                                                    {tx.money_account_name || tx.money_account?.name || t("accountFallback")}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium uppercase ${isIn ? "bg-(--success)/10 text-(--success)" : "bg-(--destructive)/10 text-(--destructive)"}`}>
                                                        {tx.direction ? (tx.direction === "in" ? t("moneyIn") : t("moneyOut")) : (isIn ? t("moneyIn") : t("moneyOut"))}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-semibold">
                                                    <span className={isIn ? "text-(--success)" : "text-(--destructive)"}>
                                                        {isIn ? "+" : "-"}{Number(tx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-(--muted-foreground)">{t("etb")}</span>
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
                                                        {t("details")}
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination Bar */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-2 py-2">
                            <p className="text-xs text-(--muted-foreground)">
                                Page <span className="font-semibold text-(--foreground)">{page}</span> of{" "}
                                <span className="font-semibold text-(--foreground)">{pagination.totalPages}</span> ({pagination.total || transactions.length} items)
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={page <= 1 || isLoading}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-(--border) rounded-lg text-xs font-medium hover:bg-(--muted) disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    <span>Previous</span>
                                </button>
                                <button
                                    onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages))}
                                    disabled={page >= pagination.totalPages || isLoading}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-(--border) rounded-lg text-xs font-medium hover:bg-(--muted) disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                >
                                    <span>Next</span>
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Create Transaction Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-(--card) border border-(--border) rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-4 border-b border-(--border)">
                            <h2 className="text-lg font-bold">{t("modal.title")}</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-(--muted-foreground) hover:text-(--foreground) cursor-pointer">✕</button>
                        </div>
                        <form onSubmit={handleCreateTransaction} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("modal.type")}</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => {
                                            const tVal = e.target.value;
                                            const isInc = ["income", "deposit"].includes(tVal);
                                            setFormData({
                                                ...formData,
                                                type: tVal,
                                                direction: isInc ? "in" : "out"
                                            });
                                        }}
                                        className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                                    >
                                        <option value="expense">{t("types.expense")}</option>
                                        <option value="income">{t("types.income")}</option>
                                        <option value="deposit">{t("types.deposit")}</option>
                                        <option value="withdrawal">{t("types.withdrawal")}</option>
                                        <option value="payment">{t("types.payment")}</option>
                                        <option value="settlement">{t("types.settlement")}</option>
                                        <option value="other">{t("types.other")}</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("modal.direction")}</label>
                                    <select
                                        value={formData.direction}
                                        onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                                        className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                                    >
                                        <option value="in">{t("moneyInInflow")}</option>
                                        <option value="out">{t("moneyOutOutflow")}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("modal.moneyAccount")}</label>
                                <select
                                    value={formData.money_account_id}
                                    onChange={(e) => setFormData({ ...formData, money_account_id: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                                >
                                    <option value="">{t("selectMoneyAccount")}</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("modal.amount")}</label>
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
                                    <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("modal.date")}</label>
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
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("modal.description")}</label>
                                <textarea
                                    rows="2"
                                    placeholder={t("modal.descriptionPlaceholder")}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-(--border)">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 border border-(--border) rounded-lg text-sm font-medium hover:bg-(--muted) transition-colors cursor-pointer"
                                >
                                    {t("modal.cancel")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-sm font-medium hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer"
                                >
                                    {isSubmitting ? t("modal.submitting") : t("newTransaction")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}