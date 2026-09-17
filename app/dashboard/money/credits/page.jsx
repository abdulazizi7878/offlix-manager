"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import {
    TrendingUp,
    Plus,
    Search,
} from "lucide-react";

import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

export default function CreditsPage() {
    const t = useTranslations("dashboard.creditsPage");
    const [credits, setCredits] = useState([]);
    const [accounts, setAccounts] = useState([]);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [directionFilter, setDirectionFilter] = useState("");

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        customer_name: "",
        amount: "",
        moneyAccountId: "",
        direction: "out",
        due_date: "",
        notes: "",
    });

    const loadData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();

            if (search) {
                params.append("search", search);
            }

            if (statusFilter) {
                params.append("status", statusFilter);
            }

            if (directionFilter) {
                params.append("direction", directionFilter);
            }

            const [credRes, accRes] = await Promise.all([
                fetchApi(`/api/v1/dashboard/money/credits?${params.toString()}`),
                fetchApi("/api/v1/dashboard/money/accounts"),
            ]);

            const responseBody = credRes.data;

            let credList = Array.isArray(responseBody?.data)
                ? responseBody.data
                : Array.isArray(responseBody?.data?.data)
                    ? responseBody.data.data
                    : Array.isArray(responseBody)
                        ? responseBody
                        : [];

            if (directionFilter) {
                credList = credList.filter(
                    (c) => c.direction === directionFilter
                );
            }

            const accResponseData = accRes.data?.data ?? accRes.data ?? {};
            const accList = Array.isArray(accResponseData)
                ? accResponseData
                : (accResponseData.data ?? accRes.data?.accounts ?? []);

            setCredits(credList);
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
            loadData();
        }, 300);

        return () => clearTimeout(timer);
    }, [search, statusFilter, directionFilter]);

    const handleCreateCredit = async (e) => {
        e.preventDefault();

        if (!formData.customer_name.trim()) {
            toast.error(t("messages.nameRequired"));
            return;
        }

        if (!formData.moneyAccountId) {
            toast.error(t("messages.selectAccount"));
            return;
        }

        if (!formData.direction) {
            toast.error(t("messages.selectDirection"));
            return;
        }

        if (
            !formData.amount ||
            isNaN(formData.amount) ||
            Number(formData.amount) <= 0
        ) {
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
            await fetchApi("/api/v1/dashboard/money/credits", {
                method: "POST",
                body: JSON.stringify({
                    name: formData.customer_name.trim(),
                    moneyAccountId: formData.moneyAccountId,
                    direction: formData.direction,
                    description: formData.notes.trim() || null,
                    amount: Number(formData.amount),
                    dueDate: formData.due_date || null,
                }),
            });

            toast.success(t("messages.success"));
            setIsCreateModalOpen(false);

            setFormData({
                customer_name: "",
                amount: "",
                moneyAccountId: "",
                direction: "out",
                due_date: "",
                notes: "",
            });

            loadData();
        } catch (err) {
            toast.error(err.message || t("messages.createError"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-(--border)">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-(--primary)/10 text-(--primary) rounded-xl">
                        <TrendingUp className="w-6 h-6" />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {t("title")}
                        </h1>

                        <p className="text-sm text-(--muted-foreground) mt-0.5">
                            {t("description")}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 bg-(--primary) text-(--primary-foreground) px-4 py-2 rounded-lg font-medium text-sm hover:opacity-95 transition-opacity"
                >
                    <Plus className="w-4 h-4" />
                    <span>{t("createCredit")}</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-(--card) border border-(--border) rounded-xl p-4 shadow-xs flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--muted-foreground)" />

                    <input
                        type="text"
                        placeholder={t("searchPlaceholder")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                    />
                </div>

                <select
                    value={directionFilter}
                    onChange={(e) => setDirectionFilter(e.target.value)}
                    className="w-full sm:w-40 px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                >
                    <option value="">{t("allDirections")}</option>
                    <option value="in">{t("moneyIn")}</option>
                    <option value="out">{t("moneyOut")}</option>
                </select>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full sm:w-48 px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                >
                    <option value="">{t("allStatuses")}</option>
                    <option value="pending">{t("statuses.pending")}</option>
                    <option value="partial">{t("statuses.partial")}</option>
                    <option value="paid">{t("statuses.paid")}</option>
                    <option value="cancelled">{t("statuses.cancelled")}</option>
                </select>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 bg-(--destructive)/10 border border-(--destructive)/20 rounded-xl flex items-center justify-between text-(--destructive)">
                    <span className="text-sm font-medium">{error}</span>

                    <button
                        onClick={loadData}
                        className="px-3 py-1.5 bg-(--background) border border-(--border) text-xs rounded-lg font-medium"
                    >
                        {t("retry")}
                    </button>
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div className="space-y-4 animate-pulse">
                    <div className="h-64 bg-(--card) rounded-xl" />
                </div>
            )}

            {/* Empty */}
            {!isLoading && !error && credits.length === 0 && (
                <div className="p-12 text-center bg-(--card) border border-(--border) rounded-xl space-y-4">
                    <div className="mx-auto w-12 h-12 bg-(--muted) text-(--muted-foreground) rounded-full flex items-center justify-center">
                        <TrendingUp className="w-6 h-6" />
                    </div>

                    <div className="max-w-sm mx-auto space-y-1">
                        <h2 className="text-lg font-semibold">{t("empty.title")}</h2>

                        <p className="text-xs text-(--muted-foreground)">
                            {t("empty.description")}
                        </p>
                    </div>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 bg-(--primary) text-(--primary-foreground) px-4 py-2 rounded-lg font-medium text-sm hover:opacity-95 transition-opacity"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{t("createCredit")}</span>
                    </button>
                </div>
            )}

            {/* Table */}
            {!isLoading && !error && credits.length > 0 && (
                <div className="bg-(--card) border border-(--border) rounded-xl shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-(--muted)/50 border-b border-(--border) text-(--muted-foreground) text-xs font-semibold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-3.5">{t("table.customer")}</th>
                                    <th className="px-6 py-3.5">{t("table.direction")}</th>
                                    <th className="px-6 py-3.5">{t("table.original")}</th>
                                    <th className="px-6 py-3.5">{t("table.remaining")}</th>
                                    <th className="px-6 py-3.5">{t("table.status")}</th>
                                    <th className="px-6 py-3.5">{t("table.createdAt")}</th>
                                    <th className="px-6 py-3.5">{t("table.dueDate")}</th>
                                    <th className="px-6 py-3.5 text-right">{t("table.action")}</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-(--border)">
                                {credits.map((c) => {
                                    const orig = Number(c.amount || 0);
                                    const rem = Number(c.remaining_amount ?? orig);
                                    const dueDate = c.due_date;
                                    const createdAt = c.created_at;
                                    const isMoneyIn = c.direction === "in";

                                    return (
                                        <tr
                                            key={c.id}
                                            className="hover:bg-(--muted)/30 transition-colors"
                                        >
                                            <td className="px-6 py-4 font-medium">
                                                {c.customer_name || c.name}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${isMoneyIn
                                                            ? "bg-(--success)/10 text-(--success)"
                                                            : "bg-(--destructive)/10 text-(--destructive)"
                                                        }`}
                                                >
                                                    {isMoneyIn ? t("moneyIn") : t("moneyOut")}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 font-semibold">
                                                {orig.toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}{" "}
                                                <span className="text-xs font-normal text-(--muted-foreground)">
                                                    {t("table.etb")}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 font-semibold">
                                                {rem.toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}{" "}
                                                <span className="text-xs font-normal text-(--muted-foreground)">
                                                    {t("table.etb")}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium uppercase bg-(--primary)/10 text-(--primary)">
                                                    {c.status ? t(`statuses.${c.status}`) : t("statuses.pending")}
                                                </span>
                                            </td>

                                            {/* Created At Column */}
                                            <td className="px-6 py-4 text-xs text-(--muted-foreground)">
                                                <div>
                                                    {createdAt
                                                        ? dayjs(createdAt)
                                                            .tz("Africa/Addis_Ababa")
                                                            .format("DD/MM/YYYY HH:mm")
                                                        : "—"}
                                                </div>

                                                <div className="text-[10px]">
                                                    {createdAt
                                                        ? `(${dayjs(createdAt)
                                                            .tz("Africa/Addis_Ababa")
                                                            .fromNow()})`
                                                        : ""}
                                                </div>
                                            </td>

                                            {/* Due Date Column */}
                                            <td className="px-6 py-4 text-xs text-(--muted-foreground)">
                                                <div>
                                                    {dueDate
                                                        ? dayjs(dueDate)
                                                            .tz("Africa/Addis_Ababa")
                                                            .format("DD/MM/YYYY")
                                                        : "—"}
                                                </div>

                                                <div className="text-[10px]">
                                                    {dueDate
                                                        ? `(${dayjs(dueDate)
                                                            .tz("Africa/Addis_Ababa")
                                                            .fromNow()})`
                                                        : ""}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    href={`/dashboard/money/credits/${c.id}`}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-(--border) rounded-lg text-xs font-medium hover:bg-(--muted) transition-colors"
                                                >
                                                    {t("table.viewManage")}
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
                    <div className="bg-(--card) border border-(--border) rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-(--border) shrink-0">
                            <h2 className="text-base font-bold">{t("modal.title")}</h2>

                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="text-(--muted-foreground) hover:text-(--foreground)"
                            >
                                ✕
                            </button>
                        </div>

                        <form
                            onSubmit={handleCreateCredit}
                            className="p-6 space-y-4 overflow-y-auto"
                        >
                            {/* Customer */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">
                                    {t("modal.name")}
                                </label>

                                <input
                                    type="text"
                                    placeholder={t("modal.namePlaceholder")}
                                    value={formData.customer_name}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            customer_name: e.target.value,
                                        })
                                    }
                                    required
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                                />
                            </div>

                            {/* Direction */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">
                                    {t("modal.direction")}
                                </label>

                                <select
                                    value={formData.direction}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            direction: e.target.value,
                                        })
                                    }
                                    required
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                                >
                                    <option value="out">{t("moneyOut")}</option>
                                    <option value="in">{t("moneyIn")}</option>
                                </select>

                                <p className="text-xs text-(--muted-foreground)">
                                    {t("modal.directionHelp")}
                                </p>
                            </div>

                            {/* Money Account */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">
                                    {t("modal.account")}
                                </label>

                                <select
                                    value={formData.moneyAccountId}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            moneyAccountId: e.target.value,
                                        })
                                    }
                                    required
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                                >
                                    <option value="">{t("modal.selectAccount")}</option>

                                    {accounts.map((acc) => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.name} ({acc.type})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Amount */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">
                                    {t("modal.amount")}
                                </label>

                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    placeholder={t("modal.amountPlaceholder")}
                                    value={formData.amount}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            amount: e.target.value,
                                        })
                                    }
                                    required
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                                />
                            </div>

                            {/* Due Date */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">
                                    {t("modal.dueDate")}
                                </label>

                                <input
                                    type="date"
                                    value={formData.due_date}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            due_date: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                                />
                            </div>

                            {/* Notes */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">
                                    {t("modal.notes")}
                                </label>

                                <textarea
                                    rows="2"
                                    placeholder={t("modal.notesPlaceholder")}
                                    value={formData.notes}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            notes: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-(--border)">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 border border-(--border) rounded-lg text-sm font-medium"
                                >
                                    {t("modal.cancel")}
                                </button>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-sm font-medium disabled:opacity-50"
                                >
                                    {isSubmitting ? t("modal.submitting") : t("modal.submit")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}