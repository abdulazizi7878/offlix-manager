"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { TrendingDown, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";

export default function PayablesPage() {
    const t = useTranslations("dashboard.payablesPage");

    const [payables, setPayables] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    // Pagination states
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ totalPages: 1, total: 0, page: 1 });

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        supplier_name: "",
        amount: "",
        due_date: "",
        notes: ""
    });

    const loadData = async (currentPage = 1) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            params.append("page", currentPage.toString());
            params.append("limit", "10");
            if (search) params.append("search", search);
            if (statusFilter) params.append("status", statusFilter);

            const [payRes, accRes] = await Promise.all([
                fetchApi(`/api/v1/dashboard/money/payables?${params.toString()}`),
                fetchApi("/api/v1/dashboard/money/accounts")
            ]);

            // Handle pagination and nested data structure: { success: true, data: { data: [], pagination: {} } }
            const payResponseData = payRes.data?.data ?? payRes.data ?? {};
            const payList = Array.isArray(payResponseData)
                ? payResponseData
                : (payResponseData.data ?? payResponseData.items ?? payRes.data?.payables ?? []);

            const pageInfo = payResponseData.pagination ?? payRes.data?.pagination ?? { totalPages: 1, total: payList.length, page: currentPage };

            const accResponseData = accRes.data?.data ?? accRes.data ?? {};
            const accList = Array.isArray(accResponseData)
                ? accResponseData
                : (accResponseData.data ?? accRes.data?.accounts ?? []);

            setPayables(payList);
            setPagination(pageInfo);
            setAccounts(accList);
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
    }, [page, search, statusFilter]);

    const handleCreatePayable = async (e) => {
        e.preventDefault();
        if (!formData.supplier_name.trim()) {
            toast.error(t("messages.supplierRequired"));
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
            await fetchApi("/api/v1/dashboard/money/payables", {
                method: "POST",
                body: JSON.stringify({
                    name: formData.supplier_name,
                    description: formData.notes || null,
                    amount: Number(formData.amount),
                    dueDate: formData.due_date || null
                })
            });
            toast.success(t("messages.createSuccess"));
            setIsCreateModalOpen(false);
            setFormData({ supplier_name: "", amount: "", due_date: "", notes: "" });
            loadData(page);
        } catch (err) {
            toast.error(err.message || t("messages.createFailed"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-(--border)">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-(--primary)/10 text-(--primary) rounded-xl">
                        <TrendingDown className="w-6 h-6" />
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
                    <span>{t("createPayable")}</span>
                </button>
            </div>

            <div className="bg-(--card) border border-(--border) rounded-xl p-4 shadow-xs flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
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
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="w-full sm:w-48 px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                >
                    <option value="">{t("allStatuses")}</option>
                    <option value="pending">{t("statusPending")}</option>
                    <option value="partial">{t("statusPartial")}</option>
                    <option value="paid">{t("statusPaid")}</option>
                    <option value="cancelled">{t("statusCancelled")}</option>
                </select>
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
                <div className="space-y-4 animate-pulse"><div className="h-64 bg-(--card) rounded-xl" /></div>
            )}

            {!isLoading && !error && payables.length === 0 && (
                <div className="p-12 text-center bg-(--card) border border-(--border) rounded-xl space-y-4">
                    <div className="mx-auto w-12 h-12 bg-(--muted) text-(--muted-foreground) rounded-full flex items-center justify-center">
                        <TrendingDown className="w-6 h-6" />
                    </div>
                    <div className="max-w-sm mx-auto space-y-1">
                        <h2 className="text-lg font-semibold">{t("noPayablesTitle")}</h2>
                        <p className="text-xs text-(--muted-foreground)">{t("noPayablesSubtitle")}</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 bg-(--primary) text-(--primary-foreground) px-4 py-2 rounded-lg font-medium text-sm hover:opacity-95 transition-opacity cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{t("createPayable")}</span>
                    </button>
                </div>
            )}

            {!isLoading && !error && payables.length > 0 && (
                <div className="space-y-4">
                    <div className="bg-(--card) border border-(--border) rounded-xl shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-(--muted)/50 border-b border-(--border) text-(--muted-foreground) text-xs font-semibold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3.5">{t("table.supplier")}</th>
                                        <th className="px-6 py-3.5">{t("table.original")}</th>
                                        <th className="px-6 py-3.5">{t("table.remaining")}</th>
                                        <th className="px-6 py-3.5">{t("table.status")}</th>
                                        <th className="px-6 py-3.5">{t("table.dueDate")}</th>
                                        <th className="px-6 py-3.5 text-right">{t("table.action")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-(--border)">
                                    {payables.map((p) => {
                                        const orig = Number(p.amount || 0);
                                        const rem = Number(p.remaining_amount ?? orig);
                                        return (
                                            <tr key={p.id} className="hover:bg-(--muted)/30 transition-colors">
                                                <td className="px-6 py-4 font-medium">{p.supplier_name || p.name}</td>
                                                <td className="px-6 py-4 font-semibold">{orig.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-(--muted-foreground)">{t("table.etb")}</span></td>
                                                <td className="px-6 py-4 font-semibold text-(--destructive)">{rem.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal">{t("table.etb")}</span></td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium uppercase bg-(--primary)/10 text-(--primary)">
                                                        {p.status || t("table.pending")}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-(--muted-foreground)">{p.due_date ? new Date(p.due_date).toLocaleDateString() : t("table.noDueDate")}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link href={`/dashboard/money/payables/${p.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 border border-(--border) rounded-lg text-xs font-medium hover:bg-(--muted) transition-colors">
                                                        {t("table.viewPay")}
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
                                <span className="font-semibold text-(--foreground)">{pagination.totalPages}</span> ({pagination.total || payables.length} items)
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

            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-(--card) border border-(--border) rounded-2xl w-full max-w-md p-6 space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-4 border-b border-(--border)">
                            <h2 className="text-lg font-bold">{t("modal.title")}</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-(--muted-foreground) hover:text-(--foreground) cursor-pointer">✕</button>
                        </div>
                        <form onSubmit={handleCreatePayable} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("modal.supplierName")}</label>
                                <input
                                    type="text"
                                    placeholder={t("modal.supplierPlaceholder")}
                                    value={formData.supplier_name}
                                    onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                                />
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
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("modal.dueDate")}</label>
                                <input
                                    type="date"
                                    value={formData.due_date}
                                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
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
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 border border-(--border) rounded-lg text-sm font-medium cursor-pointer">
                                    {t("modal.cancel")}
                                </button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-sm font-medium hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer">
                                    {isSubmitting ? t("modal.creating") : t("modal.create")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}