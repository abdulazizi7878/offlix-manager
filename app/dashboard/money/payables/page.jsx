// file: app/dashboard/money/payables/page.jsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingDown, Plus, Search, AlertCircle } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";

export default function PayablesPage() {
    const [payables, setPayables] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        supplier_name: "",
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

            const [payRes, accRes] = await Promise.all([
                fetchApi(`/api/v1/dashboard/money/payables?${params.toString()}`),
                fetchApi("/api/v1/dashboard/money/accounts")
            ]);

            // Handle pagination and nested data structure: { success: true, data: { data: [], pagination: {} } }
            const payResponseData = payRes.data?.data ?? payRes.data ?? {};
            const payList = Array.isArray(payResponseData)
                ? payResponseData
                : (payResponseData.data ?? payRes.data?.payables ?? []);

            const accResponseData = accRes.data?.data ?? accRes.data ?? {};
            const accList = Array.isArray(accResponseData)
                ? accResponseData
                : (accResponseData.data ?? accRes.data?.accounts ?? []);

            setPayables(payList);
            setAccounts(accList);
        } catch (err) {
            setError(err.message || "Failed to load payables.");
            toast.error("Failed to load payables");
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

    const handleCreatePayable = async (e) => {
        e.preventDefault();
        if (!formData.supplier_name.trim()) {
            toast.error("Supplier name is required");
            return;
        }
        if (!formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        const parts = formData.amount.split(".");
        if (parts[1] && parts[1].length > 2) {
            toast.error("Amounts can support a maximum of 2 decimal places");
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
            toast.success("Payable created successfully");
            setIsCreateModalOpen(false);
            setFormData({ supplier_name: "", amount: "", due_date: "", notes: "" });
            loadData();
        } catch (err) {
            toast.error(err.message || "Failed to create payable");
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
                        <h1 className="text-2xl font-bold tracking-tight">Payables (Money Owed)</h1>
                        <p className="text-sm text-(--muted-foreground) mt-0.5">
                            Manage supplier bills and outgoing payment obligations.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 bg-(--primary) text-(--primary-foreground) px-4 py-2 rounded-lg font-medium text-sm hover:opacity-95 transition-opacity"
                >
                    <Plus className="w-4 h-4" />
                    <span>Create Payable</span>
                </button>
            </div>

            <div className="bg-(--card) border border-(--border) rounded-xl p-4 shadow-xs flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--muted-foreground)" />
                    <input
                        type="text"
                        placeholder="Search supplier..."
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
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            {error && (
                <div className="p-4 bg-(--destructive)/10 border border-(--destructive)/20 rounded-xl flex items-center justify-between text-(--destructive)">
                    <span className="text-sm font-medium">{error}</span>
                    <button onClick={loadData} className="px-3 py-1.5 bg-(--background) border border-(--border) text-xs rounded-lg font-medium">Retry</button>
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
                        <h2 className="text-lg font-semibold">No payables found</h2>
                        <p className="text-xs text-(--muted-foreground)">Create a payable when your business owes money to a supplier.</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 bg-(--primary) text-(--primary-foreground) px-4 py-2 rounded-lg font-medium text-sm hover:opacity-95 transition-opacity"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create Payable</span>
                    </button>
                </div>
            )}

            {!isLoading && !error && payables.length > 0 && (
                <div className="bg-(--card) border border-(--border) rounded-xl shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-(--muted)/50 border-b border-(--border) text-(--muted-foreground) text-xs font-semibold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-3.5">Supplier</th>
                                    <th className="px-6 py-3.5">Original</th>
                                    <th className="px-6 py-3.5">Remaining</th>
                                    <th className="px-6 py-3.5">Status</th>
                                    <th className="px-6 py-3.5">Due Date</th>
                                    <th className="px-6 py-3.5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border)">
                                {payables.map((p) => {
                                    const orig = Number(p.amount || 0);
                                    const rem = Number(p.remaining_amount ?? orig);
                                    return (
                                        <tr key={p.id} className="hover:bg-(--muted)/30 transition-colors">
                                            <td className="px-6 py-4 font-medium">{p.supplier_name || p.name}</td>
                                            <td className="px-6 py-4 font-semibold">{orig.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-(--muted-foreground)">ETB</span></td>
                                            <td className="px-6 py-4 font-semibold text-(--destructive)">{rem.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal">ETB</span></td>
                                            <td className="px-6 py-4">
                                                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium uppercase bg-(--primary)/10 text-(--primary)">
                                                    {p.status || "pending"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-(--muted-foreground)">{p.due_date ? new Date(p.due_date).toLocaleDateString() : "No due date"}</td>
                                            <td className="px-6 py-4 text-right">
                                                <Link href={`/dashboard/money/payables/${p.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 border border-(--border) rounded-lg text-xs font-medium hover:bg-(--muted) transition-colors">
                                                    View / Pay
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

            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-(--card) border border-(--border) rounded-2xl w-full max-w-md p-6 space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-4 border-b border-(--border)">
                            <h2 className="text-lg font-bold">Create Payable</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-(--muted-foreground) hover:text-(--foreground)">✕</button>
                        </div>
                        <form onSubmit={handleCreatePayable} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Supplier Name</label>
                                <input
                                    type="text"
                                    placeholder="Supplier name..."
                                    value={formData.supplier_name}
                                    onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                                />
                            </div>
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
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Due Date</label>
                                <input
                                    type="date"
                                    value={formData.due_date}
                                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Notes</label>
                                <textarea
                                    rows="2"
                                    placeholder="Notes..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                                />
                            </div>
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-(--border)">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 border border-(--border) rounded-lg text-sm font-medium">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-sm font-medium">{isSubmitting ? "Creating..." : "Create"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}