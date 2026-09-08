// file: app/dashboard/money/withdrawals/page.jsx

"use client";

import { useState, useEffect } from "react";
import { ArrowDownToLine, AlertCircle, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";

export default function WithdrawalsPage() {
    const [accounts, setAccounts] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [accountId, setAccountId] = useState("");
    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const [accRes, wRes] = await Promise.all([
                    fetchApi("/api/v1/dashboard/money/accounts"),
                    fetchApi("/api/v1/dashboard/money/withdrawals")
                ]);
                setAccounts(accRes.data?.accounts || accRes.data || accRes);
                setWithdrawals(wRes.data?.withdrawals || wRes.data || wRes);
            } catch (err) {
                setError(err.message || "Failed to load withdrawal data.");
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    const handleWithdrawal = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await fetchApi("/api/v1/dashboard/money/withdrawals", {
                method: "POST",
                body: JSON.stringify({
                    accountId,
                    amount: Number(amount),
                    reason
                }),
            });
            toast.success("Withdrawal recorded successfully");
            setAmount("");
            setReason("");
            const res = await fetchApi("/api/v1/dashboard/money/withdrawals");
            setWithdrawals(res.data?.withdrawals || res.data || res);
        } catch (err) {
            toast.error(err.message || "Failed to record withdrawal.");
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
                <h1 className="text-xl font-bold tracking-tight">Account Withdrawals</h1>
                <p className="text-xs text-(--muted-foreground)">Record funds leaving financial accounts.</p>
            </div>

            <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground)">New Withdrawal</h2>
                <form onSubmit={handleWithdrawal} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-(--muted-foreground)">Financial Account</label>
                            <select
                                value={accountId}
                                onChange={(e) => setAccountId(e.target.value)}
                                className="w-full px-3 py-2 border border-(--border) rounded-lg text-sm bg-transparent"
                                required
                            >
                                <option value="">Select account</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name} ({Number(acc.balance).toLocaleString()} birr)</option>
                                ))}
                            </select>
                        </div>
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
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-(--muted-foreground)">Reason / Notes</label>
                        <input
                            type="text"
                            placeholder="Reason for withdrawal"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-3 py-2 border border-(--border) rounded-lg text-sm bg-transparent"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownToLine className="w-4 h-4" />}
                        <span>Confirm Withdrawal</span>
                    </button>
                </form>
            </div>

            <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground)">Withdrawal History</h2>
                {withdrawals.length === 0 ? (
                    <div className="text-center py-8 text-sm text-(--muted-foreground)">
                        No withdrawals recorded yet.
                    </div>
                ) : (
                    <div className="divide-y divide-(--border)">
                        {withdrawals.map((w) => (
                            <div key={w.id} className="py-3 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-medium">{w.reason}</p>
                                    <p className="text-xs font-mono text-(--muted-foreground)">Account: {w.accountName || "N/A"} • {new Date(w.createdAt).toLocaleString()}</p>
                                </div>
                                <span className="text-sm font-mono font-semibold text-rose-500">-{Number(w.amount).toLocaleString()} birr</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}