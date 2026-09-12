"use client";

import { useState, useEffect } from "react";

import Link from "next/link";

import {
    TrendingUp,
    Plus,
    Search,
} from "lucide-react";

import { fetchApi } from "@/lib/api/client";

import { toast } from "sonner";

import dayjs from "dayjs";

import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function CreditsPage() {
    const [credits, setCredits] = useState([]);
    const [accounts, setAccounts] = useState([]);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [directionFilter, setDirectionFilter] = useState("");

    const [isCreateModalOpen, setIsCreateModalOpen] =
        useState(false);

    const [isSubmitting, setIsSubmitting] =
        useState(false);

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
                params.append(
                    "direction",
                    directionFilter
                );
            }

            const [credRes, accRes] =
                await Promise.all([
                    fetchApi(
                        `/api/v1/dashboard/money/credits?${params.toString()}`
                    ),
                    fetchApi(
                        "/api/v1/dashboard/money/accounts"
                    ),
                ]);

            const credResponseData =
                credRes.data?.data ??
                credRes.data ??
                {};

            const credList =
                Array.isArray(credResponseData)
                    ? credResponseData
                    : (
                        credResponseData.data ??
                        credRes.data?.credits ??
                        []
                    );

            const accResponseData =
                accRes.data?.data ??
                accRes.data ??
                {};

            const accList =
                Array.isArray(accResponseData)
                    ? accResponseData
                    : (
                        accResponseData.data ??
                        accRes.data?.accounts ??
                        []
                    );

            setCredits(credList);
            setAccounts(accList);
        } catch (err) {
            setError(
                err.message ||
                "Failed to load credits."
            );

            toast.error(
                "Failed to load credits"
            );
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadData();
        }, 300);

        return () => clearTimeout(timer);
    }, [
        search,
        statusFilter,
        directionFilter,
    ]);

    const handleCreateCredit = async (e) => {
        e.preventDefault();

        if (!formData.customer_name.trim()) {
            toast.error(
                "Customer name is required"
            );
            return;
        }

        if (!formData.moneyAccountId) {
            toast.error(
                "Please select a money account"
            );
            return;
        }

        if (!formData.direction) {
            toast.error(
                "Please select a credit direction"
            );
            return;
        }

        if (
            !formData.amount ||
            isNaN(formData.amount) ||
            Number(formData.amount) <= 0
        ) {
            toast.error(
                "Please enter a valid amount"
            );
            return;
        }

        const parts =
            formData.amount.split(".");

        if (
            parts[1] &&
            parts[1].length > 2
        ) {
            toast.error(
                "Amounts can support a maximum of 2 decimal places"
            );
            return;
        }

        setIsSubmitting(true);

        try {
            await fetchApi(
                "/api/v1/dashboard/money/credits",
                {
                    method: "POST",
                    body: JSON.stringify({
                        name:
                            formData.customer_name.trim(),

                        moneyAccountId:
                            formData.moneyAccountId,

                        direction:
                            formData.direction,

                        description:
                            formData.notes.trim() ||
                            null,

                        amount:
                            Number(formData.amount),

                        dueDate:
                            formData.due_date ||
                            null,
                    }),
                }
            );

            toast.success(
                "Credit recorded successfully"
            );

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
            toast.error(
                err.message ||
                "Failed to record credit"
            );
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
                            Credits
                        </h1>

                        <p className="text-sm text-(--muted-foreground) mt-0.5">
                            Track money given out and money received as credit.
                        </p>
                    </div>
                </div>

                <button
                    onClick={() =>
                        setIsCreateModalOpen(true)
                    }
                    className="inline-flex items-center justify-center gap-2 bg-(--primary) text-(--primary-foreground) px-4 py-2 rounded-lg font-medium text-sm hover:opacity-95 transition-opacity"
                >
                    <Plus className="w-4 h-4" />
                    <span>Create Credit</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-(--card) border border-(--border) rounded-xl p-4 shadow-xs flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--muted-foreground)" />

                    <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                        className="w-full pl-9 pr-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                    />
                </div>

                <select
                    value={directionFilter}
                    onChange={(e) =>
                        setDirectionFilter(
                            e.target.value
                        )
                    }
                    className="w-full sm:w-40 px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                >
                    <option value="">
                        All Directions
                    </option>

                    <option value="in">
                        Money In
                    </option>

                    <option value="out">
                        Money Out
                    </option>
                </select>

                <select
                    value={statusFilter}
                    onChange={(e) =>
                        setStatusFilter(
                            e.target.value
                        )
                    }
                    className="w-full sm:w-48 px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                >
                    <option value="">
                        All Statuses
                    </option>

                    <option value="pending">
                        Pending
                    </option>

                    <option value="partial">
                        Partial
                    </option>

                    <option value="paid">
                        Paid
                    </option>

                    <option value="cancelled">
                        Cancelled
                    </option>
                </select>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 bg-(--destructive)/10 border border-(--destructive)/20 rounded-xl flex items-center justify-between text-(--destructive)">
                    <span className="text-sm font-medium">
                        {error}
                    </span>

                    <button
                        onClick={loadData}
                        className="px-3 py-1.5 bg-(--background) border border-(--border) text-xs rounded-lg font-medium"
                    >
                        Retry
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
            {!isLoading &&
                !error &&
                credits.length === 0 && (
                    <div className="p-12 text-center bg-(--card) border border-(--border) rounded-xl space-y-4">
                        <div className="mx-auto w-12 h-12 bg-(--muted) text-(--muted-foreground) rounded-full flex items-center justify-center">
                            <TrendingUp className="w-6 h-6" />
                        </div>

                        <div className="max-w-sm mx-auto space-y-1">
                            <h2 className="text-lg font-semibold">
                                No credits found
                            </h2>

                            <p className="text-xs text-(--muted-foreground)">
                                Create a credit record when money is given out or received as credit.
                            </p>
                        </div>

                        <button
                            onClick={() =>
                                setIsCreateModalOpen(
                                    true
                                )
                            }
                            className="inline-flex items-center gap-2 bg-(--primary) text-(--primary-foreground) px-4 py-2 rounded-lg font-medium text-sm hover:opacity-95 transition-opacity"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Create Credit</span>
                        </button>
                    </div>
                )}

            {/* Table */}
            {!isLoading &&
                !error &&
                credits.length > 0 && (
                    <div className="bg-(--card) border border-(--border) rounded-xl shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-(--muted)/50 border-b border-(--border) text-(--muted-foreground) text-xs font-semibold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3.5">
                                            Customer
                                        </th>

                                        <th className="px-6 py-3.5">
                                            Direction
                                        </th>

                                        <th className="px-6 py-3.5">
                                            Original
                                        </th>

                                        <th className="px-6 py-3.5">
                                            Remaining
                                        </th>

                                        <th className="px-6 py-3.5">
                                            Status
                                        </th>

                                        <th className="px-6 py-3.5">
                                            Due Date
                                        </th>

                                        <th className="px-6 py-3.5 text-right">
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-(--border)">
                                    {credits.map((c) => {
                                        const orig =
                                            Number(
                                                c.amount ||
                                                0
                                            );

                                        const rem =
                                            Number(
                                                c.remaining_amount ??
                                                orig
                                            );

                                        const dueDate =
                                            c.due_date;

                                        const isMoneyIn =
                                            c.direction ===
                                            "in";

                                        return (
                                            <tr
                                                key={c.id}
                                                className="hover:bg-(--muted)/30 transition-colors"
                                            >
                                                <td className="px-6 py-4 font-medium">
                                                    {c.customer_name ||
                                                        c.name}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${isMoneyIn
                                                                ? "bg-(--success)/10 text-(--success)"
                                                                : "bg-(--destructive)/10 text-(--destructive)"
                                                            }`}
                                                    >
                                                        {isMoneyIn
                                                            ? "Money In"
                                                            : "Money Out"}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 font-semibold">
                                                    {orig.toLocaleString(
                                                        undefined,
                                                        {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        }
                                                    )}{" "}
                                                    <span className="text-xs font-normal text-(--muted-foreground)">
                                                        ETB
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 font-semibold">
                                                    {rem.toLocaleString(
                                                        undefined,
                                                        {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        }
                                                    )}{" "}
                                                    <span className="text-xs font-normal text-(--muted-foreground)">
                                                        ETB
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium uppercase bg-(--primary)/10 text-(--primary)">
                                                        {c.status ||
                                                            "pending"}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 text-xs text-(--muted-foreground)">
                                                    <div>
                                                        {dueDate
                                                            ? dayjs(
                                                                dueDate
                                                            ).format(
                                                                "DD/MM/YYYY"
                                                            )
                                                            : "No due date"}
                                                    </div>

                                                    <div className="text-[10px]">
                                                        {dueDate
                                                            ? `(${dayjs(
                                                                dueDate
                                                            ).fromNow()})`
                                                            : ""}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 text-right">
                                                    <Link
                                                        href={`/dashboard/money/credits/${c.id}`}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-(--border) rounded-lg text-xs font-medium hover:bg-(--muted) transition-colors"
                                                    >
                                                        View / Manage
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
                            <h2 className="text-lg font-bold">
                                Create Credit
                            </h2>

                            <button
                                onClick={() =>
                                    setIsCreateModalOpen(
                                        false
                                    )
                                }
                                className="text-(--muted-foreground) hover:text-(--foreground)"
                            >
                                ✕
                            </button>
                        </div>

                        <form
                            onSubmit={
                                handleCreateCredit
                            }
                            className="space-y-4"
                        >
                            {/* Customer */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">
                                    Name
                                </label>

                                <input
                                    type="text"
                                    placeholder="Person or business name..."
                                    value={
                                        formData.customer_name
                                    }
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            customer_name:
                                                e.target
                                                    .value,
                                        })
                                    }
                                    required
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                                />
                            </div>

                            {/* Direction */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">
                                    Direction
                                </label>

                                <select
                                    value={
                                        formData.direction
                                    }
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            direction:
                                                e.target
                                                    .value,
                                        })
                                    }
                                    required
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                                >
                                    <option value="out">
                                        Money Out
                                    </option>

                                    <option value="in">
                                        Money In
                                    </option>
                                </select>

                                <p className="text-xs text-(--muted-foreground)">
                                    Money Out decreases your balance. Money In increases your balance.
                                </p>
                            </div>

                            {/* Money Account */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">
                                    Money Account
                                </label>

                                <select
                                    value={
                                        formData.moneyAccountId
                                    }
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            moneyAccountId:
                                                e.target
                                                    .value,
                                        })
                                    }
                                    required
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                                >
                                    <option value="">
                                        Select Account
                                    </option>

                                    {accounts.map(
                                        (acc) => (
                                            <option
                                                key={
                                                    acc.id
                                                }
                                                value={
                                                    acc.id
                                                }
                                            >
                                                {acc.name}{" "}
                                                ({acc.type})
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            {/* Amount */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">
                                    Amount (ETB)
                                </label>

                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    placeholder="0.00"
                                    value={
                                        formData.amount
                                    }
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            amount:
                                                e.target
                                                    .value,
                                        })
                                    }
                                    required
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                                />
                            </div>

                            {/* Due Date */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">
                                    Due Date
                                </label>

                                <input
                                    type="date"
                                    value={
                                        formData.due_date
                                    }
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            due_date:
                                                e.target
                                                    .value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                                />
                            </div>

                            {/* Notes */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">
                                    Notes
                                </label>

                                <textarea
                                    rows="2"
                                    placeholder="Notes..."
                                    value={
                                        formData.notes
                                    }
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            notes:
                                                e.target
                                                    .value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-(--border)">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsCreateModalOpen(
                                            false
                                        )
                                    }
                                    className="px-4 py-2 border border-(--border) rounded-lg text-sm font-medium"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        isSubmitting
                                    }
                                    className="px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-sm font-medium disabled:opacity-50"
                                >
                                    {isSubmitting
                                        ? "Creating..."
                                        : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}