"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { RefreshCw, Plus, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function TransfersPage() {
    const t = useTranslations("dashboard.transfersPage");

    const [transfers, setTransfers] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ totalPages: 1, total: 0, page: 1 });

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        from_money_account_id: "",
        to_money_account_id: "",
        amount: "",
        notes: ""
    });

    const loadData = async (currentPage = 1) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            params.append("page", currentPage.toString());
            params.append("limit", "10");

            const [txRes, accRes] = await Promise.all([
                fetchApi(`/api/v1/dashboard/money/transfers?${params.toString()}`),
                fetchApi("/api/v1/dashboard/money/accounts")
            ]);

            const txResponseData = txRes.data?.data ?? txRes.data ?? {};
            const txList = Array.isArray(txResponseData)
                ? txResponseData
                : (txResponseData.data ?? txResponseData.items ?? txRes.data?.transfers ?? []);

            const pageInfo = txResponseData.pagination ?? txRes.data?.pagination ?? { totalPages: 1, total: txList.length, page: currentPage };

            setTransfers(txList);
            setPagination(pageInfo);
            setAccounts(accRes.data?.data ?? accRes.data?.accounts ?? []);
        } catch (err) {
            setError(err.message || t("messages.loadError"));
            toast.error(t("messages.loadError"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData(page);
    }, [page]);

    const handleCreateTransfer = async (e) => {
        e.preventDefault();
        if (!formData.from_money_account_id || !formData.to_money_account_id) {
            toast.error(t("messages.selectBoth"));
            return;
        }
        if (formData.from_money_account_id === formData.to_money_account_id) {
            toast.error(t("messages.sameAccount"));
            return;
        }
        if (!formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0) {
            toast.error(t("messages.invalidAmount"));
            return;
        }

        const parts = formData.amount.split(".");
        if (parts[1] && parts[1].length > 2) {
            toast.error(t("messages.decimalLimit"));
            return;
        }

        setIsSubmitting(true);
        try {
            await fetchApi("/api/v1/dashboard/money/transfers", {
                method: "POST",
                body: JSON.stringify({
                    fromMoneyAccountId: formData.from_money_account_id,
                    toMoneyAccountId: formData.to_money_account_id,
                    amount: Number(formData.amount),
                    notes: formData.notes
                })
            });
            toast.success(t("messages.success"));
            setIsCreateModalOpen(false);
            setFormData({
                from_money_account_id: "",
                to_money_account_id: "",
                amount: "",
                notes: ""
            });
            loadData(page);
        } catch (err) {
            toast.error(err.message || t("messages.failed"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-(--border)">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-(--primary)/10 text-(--primary) rounded-xl">
                        <RefreshCw className="w-6 h-6" />
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
                    <span>{t("newTransfer")}</span>
                </button>
            </div>

            {error && (
                <div className="p-4 bg-(--destructive)/10 border border-(--destructive)/20 rounded-xl flex items-center justify-between text-(--destructive)">
                    <span className="text-sm font-medium">{error}</span>
                    <button onClick={() => loadData(page)} className="px-3 py-1.5 bg-(--background) border border-(--border) text-xs rounded-lg font-medium cursor-pointer">
                        {t("retry")}
                    </button>
                </div>
            )}

            {isLoading && (
                <div className="space-y-4 animate-pulse">
                    <div className="h-64 bg-(--card) border border-(--border) rounded-xl" />
                </div>
            )}

            {!isLoading && !error && transfers.length === 0 && (
                <div className="p-12 text-center bg-(--card) border border-(--border) rounded-xl space-y-4">
                    <div className="mx-auto w-12 h-12 bg-(--muted) text-(--muted-foreground) rounded-full flex items-center justify-center">
                        <RefreshCw className="w-6 h-6" />
                    </div>
                    <div className="max-w-sm mx-auto space-y-1">
                        <h2 className="text-lg font-semibold">{t("noTransfersTitle")}</h2>
                        <p className="text-xs text-(--muted-foreground)">{t("noTransfersSubtitle")}</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 bg-(--primary) text-(--primary-foreground) px-4 py-2 rounded-lg font-medium text-sm hover:opacity-95 transition-opacity cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{t("newTransfer")}</span>
                    </button>
                </div>
            )}

            {!isLoading && !error && transfers.length > 0 && (
                <div className="space-y-4">
                    <div className="bg-(--card) border border-(--border) rounded-xl shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-(--muted)/50 border-b border-(--border) text-(--muted-foreground) text-xs font-semibold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3.5">{t("table.route")}</th>
                                        <th className="px-6 py-3.5">{t("table.amount")}</th>
                                        <th className="px-6 py-3.5">{t("table.notes")}</th>
                                        <th className="px-6 py-3.5">{t("table.date")}</th>
                                        <th className="px-6 py-3.5 text-right">{t("table.action")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-(--border)">
                                    {transfers.map((tr) => {
                                        const trDate = tr.created_at || tr.date;
                                        return (
                                            <tr key={tr.id} className="hover:bg-(--muted)/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 font-medium">
                                                        <span className="px-2 py-1 bg-(--muted) rounded-md text-xs">
                                                            {tr.from_money_account_name || tr.from_account?.name || tr.from_money_account?.name || t("table.source")}
                                                        </span>
                                                        <ArrowRight className="w-4 h-4 text-(--muted-foreground)" />
                                                        <span className="px-2 py-1 bg-(--primary)/10 text-(--primary) rounded-md text-xs">
                                                            {tr.to_money_account_name || tr.to_account?.name || tr.to_money_account?.name || t("table.destination")}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-semibold">
                                                    {Number(tr.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-(--muted-foreground)">{t("table.etb")}</span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-(--muted-foreground) truncate max-w-xs">
                                                    {tr.notes || t("table.noNotes")}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-(--muted-foreground)">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-(--foreground)" title={trDate}>
                                                            {dayjs(trDate).fromNow()}
                                                        </span>
                                                        <span className="text-[11px] text-(--muted-foreground)">
                                                            {new Date(trDate).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link
                                                        href={`/dashboard/money/transfers/${tr.id}`}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-(--border) rounded-lg text-xs font-medium hover:bg-(--muted) transition-colors"
                                                    >
                                                        {t("table.details")}
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
                                <span className="font-semibold text-(--foreground)">{pagination.totalPages}</span> ({pagination.total || transfers.length} items)
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

            {/* Create Transfer Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-(--card) border border-(--border) rounded-2xl w-full max-w-md p-6 space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-4 border-b border-(--border)">
                            <h2 className="text-lg font-bold">{t("modal.title")}</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-(--muted-foreground) hover:text-(--foreground) cursor-pointer">✕</button>
                        </div>
                        <form onSubmit={handleCreateTransfer} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("modal.fromAccount")}</label>
                                <select
                                    value={formData.from_money_account_id}
                                    onChange={(e) => setFormData({ ...formData, from_money_account_id: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                                >
                                    <option value="">{t("modal.selectSource")}</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("modal.toAccount")}</label>
                                <select
                                    value={formData.to_money_account_id}
                                    onChange={(e) => setFormData({ ...formData, to_money_account_id: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                                >
                                    <option value="">{t("modal.selectDestination")}</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("modal.amount")}</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder={t("modal.amountPlaceholder")}
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("modal.notes")}</label>
                                <textarea
                                    rows="2"
                                    placeholder={t("modal.notesPlaceholder")}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                                    {isSubmitting ? t("modal.transferring") : t("modal.execute")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}