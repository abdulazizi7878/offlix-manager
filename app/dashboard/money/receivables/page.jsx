"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { TrendingUp, Plus, Search, AlertCircle } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function ReceivablesPage() {
    const t = useTranslations("dashboard.receivablesPage");

    const [receivables, setReceivables] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        amount: "",
        due_date: "",
        notes: ""
    });

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (statusFilter) params.append("status", statusFilter);

            const res = await fetchApi(`/api/v1/dashboard/money/receivables?${params.toString()}`);

            // Correctly parse based on your exact API response structure: { success: true, data: { items: [], pagination: {} } }
            const responseData = res.data?.data ?? res.data ?? {};
            const list = Array.isArray(responseData)
                ? responseData
                : (responseData.items ?? responseData.data ?? res.data?.receivables ?? []);

            setReceivables(list);
        } catch (err) {
            setError(err.message || t("messages.loadError"));
            toast.error(t("messages.loadError"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadData();
        }, 300);
        return () => clearTimeout(timer);
    }, [search, statusFilter]);

    const handleCreateReceivable = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error(t("messages.nameRequired"));
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
            await fetchApi("/api/v1/dashboard/money/receivables", {
                method: "POST",
                body: JSON.stringify({
                    name: formData.name.trim(),
                    description: formData.notes.trim() || null,
                    amount: Number(formData.amount),
                    dueDate: formData.due_date || null
                })
            });
            toast.success(t("messages.createSuccess"));
            setIsCreateModalOpen(false);
            setFormData({ name: "", amount: "", due_date: "", notes: "" });
            loadData();
        } catch (err) {
            toast.error(err.message || t("messages.createFailed"));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate Summary Metrics
    const totalReceivablesCount = receivables.length;
    const totalOutstandingAmount = receivables.reduce(
        (sum, r) => sum + Number(r.outstandingAmount ?? (Number(r.amount || 0) - Number(r.paidAmount || 0))),
        0
    );
    const partiallyPaidCount = receivables.filter((r) => r.status === "partial").length;
    const overdueCount = receivables.filter((r) => {
        if (!r.dueDate || r.status === "paid" || r.status === "cancelled") return false;
        return dayjs(r.dueDate).isBefore(dayjs(), "day");
    }).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-(--border)">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-(--primary)/10 text-(--primary) rounded-xl">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{t("title", { defaultValue: "Receivables" })}</h1>
                        <p className="text-sm text-(--muted-foreground) mt-0.5">
                            {t("subtitle", { defaultValue: "Money owed to the business." })}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 bg-(--primary) text-(--primary-foreground) px-4 py-2 rounded-lg font-medium text-sm hover:opacity-95 transition-opacity cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    <span>{t("createReceivable", { defaultValue: "Add Receivable" })}</span>
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-(--card) border border-(--border) rounded-xl p-4 shadow-xs space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("summary.totalReceivables", { defaultValue: "Total Receivables" })}</span>
                    <div className="text-xl font-bold">{totalReceivablesCount}</div>
                </div>
                <div className="bg-(--card) border border-(--border) rounded-xl p-4 shadow-xs space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("summary.outstandingAmount", { defaultValue: "Outstanding Amount" })}</span>
                    <div className="text-xl font-bold text-(--primary)">
                        {totalOutstandingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-(--muted-foreground)">ETB</span>
                    </div>
                </div>
                <div className="bg-(--card) border border-(--border) rounded-xl p-4 shadow-xs space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("summary.partiallyPaid", { defaultValue: "Partially Paid" })}</span>
                    <div className="text-xl font-bold text-amber-500">{partiallyPaidCount}</div>
                </div>
                <div className="bg-(--card) border border-(--border) rounded-xl p-4 shadow-xs space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("summary.overdue", { defaultValue: "Overdue" })}</span>
                    <div className="text-xl font-bold text-rose-500">{overdueCount}</div>
                </div>
            </div>

            {/* Search & Filters Bar */}
            <div className="bg-(--card) border border-(--border) rounded-xl p-4 shadow-xs flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--muted-foreground)" />
                    <input
                        type="text"
                        placeholder={t("searchPlaceholder", { defaultValue: "Search receivables by name or notes..." })}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full sm:w-48 px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                >
                    <option value="">{t("allStatuses", { defaultValue: "All Statuses" })}</option>
                    <option value="pending">{t("statusPending", { defaultValue: "Pending" })}</option>
                    <option value="partial">{t("statusPartial", { defaultValue: "Partial" })}</option>
                    <option value="paid">{t("statusPaid", { defaultValue: "Paid" })}</option>
                    <option value="cancelled">{t("statusCancelled", { defaultValue: "Cancelled" })}</option>
                </select>
            </div>

            {/* Error state */}
            {error && (
                <div className="p-4 bg-(--destructive)/10 border border-(--destructive)/20 rounded-xl flex items-center justify-between text-(--destructive)">
                    <span className="text-sm font-medium">{error}</span>
                    <button onClick={loadData} className="px-3 py-1.5 bg-(--background) border border-(--border) text-xs rounded-lg font-medium cursor-pointer">
                        {t("retry", { defaultValue: "Retry" })}
                    </button>
                </div>
            )}

            {/* Loading state */}
            {isLoading && (
                <div className="space-y-4 animate-pulse">
                    <div className="h-64 bg-(--card) border border-(--border) rounded-xl" />
                </div>
            )}

            {/* Empty state */}
            {!isLoading && !error && receivables.length === 0 && (
                <div className="p-12 text-center bg-(--card) border border-(--border) rounded-xl space-y-4">
                    <div className="mx-auto w-12 h-12 bg-(--muted) text-(--muted-foreground) rounded-full flex items-center justify-center">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div className="max-w-sm mx-auto space-y-1">
                        <h2 className="text-lg font-semibold">{t("noReceivablesTitle", { defaultValue: "No receivables yet." })}</h2>
                        <p className="text-xs text-(--muted-foreground)">{t("noReceivablesSubtitle", { defaultValue: "Track money owed to your business here." })}</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 bg-(--primary) text-(--primary-foreground) px-4 py-2 rounded-lg font-medium text-sm hover:opacity-95 transition-opacity cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{t("createReceivable", { defaultValue: "Add your first receivable" })}</span>
                    </button>
                </div>
            )}

            {/* Receivables Table */}
            {!isLoading && !error && receivables.length > 0 && (
                <div className="bg-(--card) border border-(--border) rounded-xl shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-(--muted)/50 border-b border-(--border) text-(--muted-foreground) text-xs font-semibold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-3.5">{t("table.name", { defaultValue: "Name" })}</th>
                                    <th className="px-6 py-3.5">{t("table.total", { defaultValue: "Total Amount" })}</th>
                                    <th className="px-6 py-3.5">{t("table.paid", { defaultValue: "Paid" })}</th>
                                    <th className="px-6 py-3.5">{t("table.outstanding", { defaultValue: "Outstanding" })}</th>
                                    <th className="px-6 py-3.5">{t("table.status", { defaultValue: "Status" })}</th>
                                    <th className="px-6 py-3.5">{t("table.dueDate", { defaultValue: "Due Date" })}</th>
                                    <th className="px-6 py-3.5 text-right">{t("table.action", { defaultValue: "Action" })}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border)">
                                {receivables.map((r) => {
                                    const orig = Number(r.amount || 0);
                                    const paid = Number(r.paidAmount || 0);
                                    const rem = Number(r.outstandingAmount ?? (orig - paid));
                                    const isOverdue = r.dueDate && r.status !== "paid" && r.status !== "cancelled" && dayjs(r.dueDate).isBefore(dayjs(), "day");

                                    return (
                                        <tr key={r.id} className="hover:bg-(--muted)/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-(--foreground)">{r.name}</div>
                                                {r.description && <div className="text-xs text-(--muted-foreground) truncate max-w-xs">{r.description}</div>}
                                            </td>
                                            <td className="px-6 py-4 font-semibold">
                                                {orig.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-(--muted-foreground)">ETB</span>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-emerald-600">
                                                {paid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal">ETB</span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-(--primary)">
                                                {rem.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-(--muted-foreground)">ETB</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium uppercase ${r.status === "paid" ? "bg-emerald-500/10 text-emerald-600" :
                                                        r.status === "partial" ? "bg-amber-500/10 text-amber-600" :
                                                            r.status === "cancelled" ? "bg-rose-500/10 text-rose-600" :
                                                                "bg-(--primary)/10 text-(--primary)"
                                                    }`}>
                                                    {r.status || "pending"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-(--muted-foreground)">
                                                {r.dueDate ? (
                                                    <div className="flex flex-col">
                                                        <span className={isOverdue ? "text-rose-500 font-semibold flex items-center gap-1" : ""}>
                                                            {isOverdue && <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                                                            {new Date(r.dueDate).toLocaleDateString()}
                                                        </span>
                                                        {isOverdue && <span className="text-[10px] text-rose-500">Overdue</span>}
                                                    </div>
                                                ) : t("table.noDueDate", { defaultValue: "No due date" })}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link href={`/dashboard/money/receivables/${r.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 border border-(--border) rounded-lg text-xs font-medium hover:bg-(--muted) transition-colors">
                                                    {t("table.viewManage", { defaultValue: "View & Receive" })}
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-(--card) border border-(--border) rounded-2xl w-full max-w-md p-6 space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-4 border-b border-(--border)">
                            <h2 className="text-lg font-bold">{t("modal.title", { defaultValue: "Add Receivable" })}</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-(--muted-foreground) hover:text-(--foreground) cursor-pointer">✕</button>
                        </div>
                        <form onSubmit={handleCreateReceivable} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("modal.name", { defaultValue: "Name" })}</label>
                                <input
                                    type="text"
                                    placeholder={t("modal.namePlaceholder", { defaultValue: "e.g., Client John Doe" })}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("modal.amount", { defaultValue: "Amount" })}</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    placeholder={t("modal.amountPlaceholder", { defaultValue: "0.00" })}
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("modal.dueDate", { defaultValue: "Due Date (Optional)" })}</label>
                                <input
                                    type="date"
                                    value={formData.due_date}
                                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("modal.notes", { defaultValue: "Description / Notes" })}</label>
                                <textarea
                                    rows="2"
                                    placeholder={t("modal.notesPlaceholder", { defaultValue: "Optional notes about this receivable..." })}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                                />
                            </div>
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-(--border)">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 border border-(--border) rounded-lg text-sm font-medium cursor-pointer">
                                    {t("modal.cancel", { defaultValue: "Cancel" })}
                                </button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-sm font-medium hover:opacity-95 disabled:opacity-50 cursor-pointer">
                                    {isSubmitting ? t("modal.creating", { defaultValue: "Saving..." }) : t("modal.create", { defaultValue: "Save Receivable" })}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}