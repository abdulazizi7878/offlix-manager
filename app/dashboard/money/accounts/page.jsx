"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Wallet, Plus, Search, Landmark, Smartphone, CreditCard, AlertCircle, CheckCircle2, XCircle, Pencil } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";

export default function MoneyAccountsPage() {
    const t = useTranslations("dashboard.moneyAccountsPage");
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        type: "cash",
        is_active: true
    });

    const loadAccounts = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (typeFilter) params.append("type", typeFilter);
            if (search) params.append("search", search);

            const res = await fetchApi(`/api/v1/dashboard/money/accounts?${params.toString()}`);
            setAccounts(res.data?.data || res.data?.accounts || res.data || []);
        } catch (err) {
            setError(err.message || t("messages.loadError"));
            toast.error(t("messages.loadError"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadAccounts();
        }, 300);
        return () => clearTimeout(timer);
    }, [search, typeFilter]);

    const handleCreateAccount = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error(t("messages.nameRequired"));
            return;
        }

        setIsSubmitting(true);
        try {
            await fetchApi("/api/v1/dashboard/money/accounts", {
                method: "POST",
                body: JSON.stringify(formData)
            });
            toast.success(t("messages.createSuccess"));
            setIsCreateModalOpen(false);
            setFormData({ name: "", type: "cash", is_active: true });
            loadAccounts();
        } catch (err) {
            toast.error(err.message || t("messages.createError"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case "cash":
                return <Wallet className="w-5 h-5" />;
            case "bank":
                return <Landmark className="w-5 h-5" />;
            case "mobile_money":
                return <Smartphone className="w-5 h-5" />;
            default:
                return <CreditCard className="w-5 h-5" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-(--border)">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-(--primary)/10 text-(--primary) rounded-xl">
                        <Wallet className="w-6 h-6" />
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
                    className="inline-flex items-center justify-center gap-2 bg-(--primary) text-(--primary-foreground) px-4 py-2 rounded-lg font-medium text-sm hover:opacity-95 transition-opacity"
                >
                    <Plus className="w-4 h-4" />
                    <span>{t("createAccount")}</span>
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-(--card) border border-(--border) rounded-xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--muted-foreground)" />
                    <input
                        type="text"
                        placeholder={t("searchPlaceholder")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full sm:w-48 px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                    >
                        <option value="">{t("allTypes")}</option>
                        <option value="cash">{t("cash")}</option>
                        <option value="bank">{t("bank")}</option>
                        <option value="mobile_money">{t("mobileMoney")}</option>
                    </select>
                </div>
            </div>

            {/* Error state */}
            {error && (
                <div className="p-4 bg-(--destructive)/10 border border-(--destructive)/20 rounded-xl flex items-center justify-between text-(--destructive)">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                    <button onClick={loadAccounts} className="px-3 py-1.5 bg-(--background) border border-(--border) text-xs rounded-lg font-medium">{t("retry")}</button>
                </div>
            )}

            {/* Loading state */}
            {isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-40 bg-(--card) border border-(--border) rounded-xl p-6" />
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!isLoading && !error && accounts.length === 0 && (
                <div className="p-12 text-center bg-(--card) border border-(--border) rounded-xl space-y-4">
                    <div className="mx-auto w-12 h-12 bg-(--muted) text-(--muted-foreground) rounded-full flex items-center justify-center">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <div className="max-w-sm mx-auto space-y-1">
                        <h2 className="text-lg font-semibold">{t("emptyState.title")}</h2>
                        <p className="text-xs text-(--muted-foreground)">{t("emptyState.subtitle")}</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 bg-(--primary) text-(--primary-foreground) px-4 py-2 rounded-lg font-medium text-sm hover:opacity-95 transition-opacity"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{t("createAccount")}</span>
                    </button>
                </div>
            )}

            {/* Accounts Grid */}
            {!isLoading && !error && accounts.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {accounts.map((acc) => (
                        <div key={acc.id} className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs hover:border-(--primary)/50 transition-colors flex flex-col justify-between">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="p-2.5 bg-(--primary)/10 text-(--primary) rounded-xl">
                                        {getTypeIcon(acc.type)}
                                    </div>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${acc.status === "active" ? "bg-(--success)/10 text-(--success)" : "bg-(--muted) text-(--muted-foreground)"}`}>
                                        {acc.status === "active" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                        {acc.status === "active" ? t("active") : t("inactive")}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold">{acc.name}</h3>
                                    <p className="text-xs text-(--muted-foreground) uppercase tracking-wider mt-0.5">{acc.type.replace("_", " ")}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-(--border) flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] uppercase font-semibold text-(--muted-foreground)">{t("currentBalance")}</p>
                                    <p className="text-lg font-bold">
                                        {Number(acc.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-(--muted-foreground)">{t("etb")}</span>
                                    </p>
                                </div>
                                <Link
                                    href={`/dashboard/money/accounts/${acc.id}`}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-(--border) rounded-lg text-xs font-medium hover:bg-(--muted) transition-colors"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                    <span>{t("details")}</span>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Account Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-(--card) border border-(--border) rounded-2xl w-full max-w-md p-6 space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-4 border-b border-(--border)">
                            <h2 className="text-lg font-bold">{t("modal.title")}</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-(--muted-foreground) hover:text-(--foreground)">✕</button>
                        </div>
                        <form onSubmit={handleCreateAccount} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("modal.accountName")}</label>
                                <input
                                    type="text"
                                    placeholder={t("modal.namePlaceholder")}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("modal.accountType")}</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                                >
                                    <option value="cash">{t("cash")}</option>
                                    <option value="bank">{t("bank")}</option>
                                    <option value="mobile_money">{t("mobileMoney")}</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="rounded border-(--border) text-(--primary) focus:ring-(--ring)"
                                />
                                <label htmlFor="is_active" className="text-sm font-medium">{t("modal.activeAccount")}</label>
                            </div>
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-(--border)">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 border border-(--border) rounded-lg text-sm font-medium hover:bg-(--muted) transition-colors"
                                >
                                    {t("modal.cancel")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-sm font-medium hover:opacity-95 transition-opacity disabled:opacity-50"
                                >
                                    {isSubmitting ? t("modal.submitting") : t("createAccount")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}