// file: app/dashboard/money/transfers/page.jsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { RefreshCw, Plus, Search, ArrowRight, AlertCircle, Calendar } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function TransfersPage() {
    const [transfers, setTransfers] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        from_money_account_id: "",
        to_money_account_id: "",
        amount: "",
        notes: ""
    });

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [txRes, accRes] = await Promise.all([
                fetchApi("/api/v1/dashboard/money/transfers"),
                fetchApi("/api/v1/dashboard/money/accounts")
            ]);

            // Handle the nested data structure based on pagination response
            const txResponseData = txRes.data?.data ?? {};
            const txList = Array.isArray(txResponseData) ? txResponseData : (txResponseData.data ?? txRes.data?.transfers ?? []);

            setTransfers(txList);
            setAccounts(accRes.data?.data ?? accRes.data?.accounts ?? []);
        } catch (err) {
            setError(err.message || "Failed to load transfers.");
            toast.error("Failed to load transfers");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreateTransfer = async (e) => {
        e.preventDefault();
        if (!formData.from_money_account_id || !formData.to_money_account_id) {
            toast.error("Please select both source and destination accounts");
            return;
        }
        if (formData.from_money_account_id === formData.to_money_account_id) {
            toast.error("Source and destination accounts cannot be the same");
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
            await fetchApi("/api/v1/dashboard/money/transfers", {
                method: "POST",
                body: JSON.stringify({
                    fromMoneyAccountId: formData.from_money_account_id,
                    toMoneyAccountId: formData.to_money_account_id,
                    amount: Number(formData.amount),
                    notes: formData.notes
                })
            });
            toast.success("Transfer completed successfully");
            setIsCreateModalOpen(false);
            setFormData({
                from_money_account_id: "",
                to_money_account_id: "",
                amount: "",
                notes: ""
            });
            loadData();
        } catch (err) {
            toast.error(err.message || "Failed to execute transfer");
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
                        <h1 className="text-2xl font-bold tracking-tight">Account Transfers</h1>
                        <p className="text-sm text-(--muted-foreground) mt-0.5">
                            Move funds seamlessly between your business money accounts.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 bg-(--primary) text-(--primary-foreground) px-4 py-2 rounded-lg font-medium text-sm hover:opacity-95 transition-opacity"
                >
                    <Plus className="w-4 h-4" />
                    <span>New Transfer</span>
                </button>
            </div>

            {error && (
                <div className="p-4 bg-(--destructive)/10 border border-(--destructive)/20 rounded-xl flex items-center justify-between text-(--destructive)">
                    <span className="text-sm font-medium">{error}</span>
                    <button onClick={loadData} className="px-3 py-1.5 bg-(--background) border border-(--border) text-xs rounded-lg font-medium">Retry</button>
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
                        <h2 className="text-lg font-semibold">No transfers yet</h2>
                        <p className="text-xs text-(--muted-foreground)">Transfer money between your accounts to keep liquidity structured.</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 bg-(--primary) text-(--primary-foreground) px-4 py-2 rounded-lg font-medium text-sm hover:opacity-95 transition-opacity"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New Transfer</span>
                    </button>
                </div>
            )}

            {!isLoading && !error && transfers.length > 0 && (
                <div className="bg-(--card) border border-(--border) rounded-xl shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-(--muted)/50 border-b border-(--border) text-(--muted-foreground) text-xs font-semibold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-3.5">Route</th>
                                    <th className="px-6 py-3.5">Amount</th>
                                    <th className="px-6 py-3.5">Notes</th>
                                    <th className="px-6 py-3.5">Date</th>
                                    <th className="px-6 py-3.5 text-right">Action</th>
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
                                                        {tr.from_money_account_name || tr.from_account?.name || tr.from_money_account?.name || "Source"}
                                                    </span>
                                                    <ArrowRight className="w-4 h-4 text-(--muted-foreground)" />
                                                    <span className="px-2 py-1 bg-(--primary)/10 text-(--primary) rounded-md text-xs">
                                                        {tr.to_money_account_name || tr.to_account?.name || tr.to_money_account?.name || "Destination"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-semibold">
                                                {Number(tr.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-(--muted-foreground)">ETB</span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-(--muted-foreground) truncate max-w-xs">
                                                {tr.notes || "No notes"}
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
            )}

            {/* Create Transfer Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-(--card) border border-(--border) rounded-2xl w-full max-w-md p-6 space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-4 border-b border-(--border)">
                            <h2 className="text-lg font-bold">New Money Transfer</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-(--muted-foreground) hover:text-(--foreground)">✕</button>
                        </div>
                        <form onSubmit={handleCreateTransfer} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">From Account</label>
                                <select
                                    value={formData.from_money_account_id}
                                    onChange={(e) => setFormData({ ...formData, from_money_account_id: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                                >
                                    <option value="">Select Source Account</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">To Account</label>
                                <select
                                    value={formData.to_money_account_id}
                                    onChange={(e) => setFormData({ ...formData, to_money_account_id: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                                >
                                    <option value="">Select Destination Account</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                                    ))}
                                </select>
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
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Notes</label>
                                <textarea
                                    rows="2"
                                    placeholder="Transfer explanation..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                                    {isSubmitting ? "Transferring..." : "Execute Transfer"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}