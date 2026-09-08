// file: app/dashboard/money/transfers/page.jsx

"use client";

import { useState, useEffect } from "react";
import { ArrowLeftRight, AlertCircle, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";

export default function TransfersPage() {
    const [accounts, setAccounts] = useState([]);
    const [transfers, setTransfers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [fromAccountId, setFromAccountId] = useState("");
    const [toAccountId, setToAccountId] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const [accRes, txRes] = await Promise.all([
                    fetchApi("/api/v1/dashboard/money/accounts"),
                    fetchApi("/api/v1/dashboard/money/transfers")
                ]);
                setAccounts(accRes.data?.accounts || accRes.data || accRes);
                setTransfers(txRes.data?.transfers || txRes.data || txRes);
            } catch (err) {
                setError(err.message || "Failed to load transfer data.");
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    const handleTransfer = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await fetchApi("/api/v1/dashboard/money/transfers", {
                method: "POST",
                body: JSON.stringify({
                    fromAccountId,
                    toAccountId,
                    amount: Number(amount),
                    description
                }),
            });
            toast.success("Transfer completed successfully");
            setAmount("");
            setDescription("");
            const res = await fetchApi("/api/v1/dashboard/money/transfers");
            setTransfers(res.data?.transfers || res.data || res);
        } catch (err) {
            toast.error(err.message || "Failed to execute transfer.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-pulse">
                <div className="h-8 w-48 bg-(--muted) rounded-md" />
                <div className="h-64 bg-(--muted) rounded-xl" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="p-4 bg-(--destructive)/10 border border-(--destructive)/20 rounded-xl flex items-center gap-3 text-(--destructive)">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-semibold">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-16">
            <div className="pb-4 border-b border-(--border)">
                <h1 className="text-xl font-bold tracking-tight">Account Transfers</h1>
                <p className="text-xs text-(--muted-foreground)">Move funds between internal accounts (Cash to Bank, etc.).</p>
            </div>

            {/* Create Transfer Form */}
            <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground)">New Transfer</h2>
                <form onSubmit={handleTransfer} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-(--muted-foreground)">From Account</label>
                            <select
                                value={fromAccountId}
                                onChange={(e) => setFromAccountId(e.target.value)}
                                className="w-full px-3 py-2 border border-(--border) rounded-lg text-sm bg-transparent"
                                required
                            >
                                <option value="">Select source account</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name} ({Number(acc.balance).toLocaleString()} birr)</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-(--muted-foreground)">To Account</label>
                            <select
                                value={toAccountId}
                                onChange={(e) => setToAccountId(e.target.value)}
                                className="w-full px-3 py-2 border border-(--border) rounded-lg text-sm bg-transparent"
                                required
                            >
                                <option value="">Select destination account</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name} ({Number(acc.balance).toLocaleString()} birr)</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-(--muted-foreground)">Amount (birr)</label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full px-3 py-2 border border-(--border) rounded-lg text-sm bg-transparent"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-(--muted-foreground)">Description / Note</label>
                            <input
                                type="text"
                                placeholder="e.g. Daily cash deposit"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-3 py-2 border border-(--border) rounded-lg text-sm bg-transparent"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeftRight className="w-4 h-4" />}
                        <span>Execute Transfer</span>
                    </button>
                </form>
            </div>

            {/* Recent Transfers List */}
            <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground)">Transfer History</h2>
                {transfers.length === 0 ? (
                    <div className="text-center py-8 text-sm text-(--muted-foreground)">
                        No transfers recorded yet.
                    </div>
                ) : (
                    <div className="divide-y divide-(--border)">
                        {transfers.map((tx) => (
                            <div key={tx.id} className="py-3 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-medium">{tx.description || "Account Transfer"}</p>
                                    <p className="text-xs font-mono text-(--muted-foreground)">
                                        {tx.fromAccountName || "Source"} → {tx.toAccountName || "Destination"} • {new Date(tx.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <span className="text-sm font-mono font-semibold">{Number(tx.amount).toLocaleString()} birr</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}