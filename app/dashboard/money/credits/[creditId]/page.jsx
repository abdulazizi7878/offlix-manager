// file: app/dashboard/money/credits/[creditId]/page.jsx

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { TrendingUp, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";

export default function CreditDetailsPage() {
    const params = useParams();
    const creditId = params.creditId;

    const [credit, setCredit] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [receiveFull, setReceiveFull] = useState(true);
    const [amount, setAmount] = useState("");
    const [moneyAccountId, setMoneyAccountId] = useState("");
    const [notes, setNotes] = useState("");

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [cRes, accRes] = await Promise.all([
                fetchApi(`/api/v1/dashboard/money/credits/${creditId}`),
                fetchApi("/api/v1/dashboard/money/accounts")
            ]);
            const cData = cRes.data?.data ?? cRes.data ?? cRes;
            setCredit(cData);

            // Handle nested response structures for accounts matching: { success: true, data: { data: [...], pagination: {...} } }
            const accRaw = accRes.data?.data ?? accRes.data ?? {};
            const accList = Array.isArray(accRaw)
                ? accRaw
                : (Array.isArray(accRaw.data) ? accRaw.data : (accRes.data?.accounts ?? []));

            setAccounts(accList);

            const rem = Number(cData.remaining_amount ?? cData.amount);
            setAmount(rem.toString());
        } catch (err) {
            setError(err.message || "Failed to load credit details.");
            toast.error("Failed to load credit details");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (creditId) loadData();
    }, [creditId]);

    const handleReceivePayment = async (e) => {
        e.preventDefault();
        if (!moneyAccountId) {
            toast.error("Please select a receiving money account");
            return;
        }

        const orig = Number(credit?.amount || 0);
        const rem = Number(credit?.remaining_amount ?? orig);
        const targetAmount = receiveFull ? rem : Number(amount);

        if (isNaN(targetAmount) || targetAmount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }
        if (targetAmount > rem) {
            toast.error("Amount cannot exceed remaining credit amount");
            return;
        }

        const parts = targetAmount.toString().split(".");
        if (parts[1] && parts[1].length > 2) {
            toast.error("Amounts can support a maximum of 2 decimal places");
            return;
        }

        setIsSubmitting(true);
        try {
            await fetchApi(`/api/v1/dashboard/money/credits/${creditId}/payments`, {
                method: "POST",
                body: JSON.stringify({
                    moneyAccountId,
                    amount: receiveFull ? undefined : targetAmount,
                    full: receiveFull,
                    notes: notes || null
                })
            });
            toast.success("Payment received successfully");
            setNotes("");
            loadData();
        } catch (err) {
            toast.error(err.message || "Failed to receive payment");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="space-y-6 animate-pulse p-8"><div className="h-64 bg-(--card) rounded-xl" /></div>;
    }

    if (error || !credit) {
        return (
            <div className="p-12 text-center bg-(--card) border border-(--border) rounded-xl space-y-4">
                <AlertCircle className="w-10 h-10 text-(--destructive) mx-auto" />
                <p className="text-sm font-semibold">{error || "Credit not found"}</p>
                <Link href="/dashboard/money/credits" className="inline-block px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-sm">Back to Credits</Link>
            </div>
        );
    }

    const orig = Number(credit.amount || 0);
    const rem = Number(credit.remaining_amount ?? orig);
    const received = orig - rem;
    const isPaid = rem <= 0 || credit.status === "paid";

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-between pb-6 border-b border-(--border)">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/money/credits" className="p-2 border border-(--border) rounded-lg hover:bg-(--muted) transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Credit Details</h1>
                        <p className="text-sm text-(--muted-foreground)">Customer: {credit.customer_name || credit.name}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-(--card) border border-(--border) rounded-xl p-4 space-y-1">
                    <span className="text-xs uppercase font-semibold text-(--muted-foreground)">Original Amount</span>
                    <p className="text-xl font-bold">{orig.toLocaleString()} <span className="text-xs font-normal">ETB</span></p>
                </div>
                <div className="bg-(--card) border border-(--border) rounded-xl p-4 space-y-1">
                    <span className="text-xs uppercase font-semibold text-(--muted-foreground)">Received Amount</span>
                    <p className="text-xl font-bold text-(--success)">{received.toLocaleString()} <span className="text-xs font-normal">ETB</span></p>
                </div>
                <div className="bg-(--card) border border-(--border) rounded-xl p-4 space-y-1">
                    <span className="text-xs uppercase font-semibold text-(--muted-foreground)">Remaining Amount</span>
                    <p className="text-xl font-bold text-(--destructive)">{rem.toLocaleString()} <span className="text-xs font-normal">ETB</span></p>
                </div>
            </div>

            {!isPaid && (
                <div className="bg-(--card) border border-(--border) rounded-xl p-6 shadow-xs space-y-6">
                    <h2 className="text-base font-semibold">Receive Payment</h2>
                    <form onSubmit={handleReceivePayment} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Receiving Account</label>
                            <select
                                value={moneyAccountId}
                                onChange={(e) => setMoneyAccountId(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                            >
                                <option value="">Select Account</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="receive_full"
                                checked={receiveFull}
                                onChange={(e) => setReceiveFull(e.target.checked)}
                                className="rounded border-(--border) text-(--primary) focus:ring-(--ring)"
                            />
                            <label htmlFor="receive_full" className="text-sm font-medium">Receive full remaining amount ({rem.toLocaleString()} ETB)</label>
                        </div>

                        {!receiveFull && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Partial Amount (ETB)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    max={rem}
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Notes</label>
                            <textarea
                                rows="2"
                                placeholder="Payment notes..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                            />
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-sm font-medium hover:opacity-95 transition-opacity disabled:opacity-50"
                            >
                                {isSubmitting ? "Processing..." : "Receive Payment"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                <h3 className="text-base font-semibold">Payment History</h3>
                {(!credit.payments && !credit.history) || (credit.payments || credit.history || []).length === 0 ? (
                    <p className="text-xs text-(--muted-foreground) py-4 text-center">No payment records yet.</p>
                ) : (
                    <div className="space-y-3">
                        {(credit.payments || credit.history || []).map((pay, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-(--border) bg-(--muted)/20">
                                <div>
                                    <p className="text-sm font-medium">
                                        {Number(pay.amount).toLocaleString()} ETB to <span className="text-(--primary)">{pay.money_account?.name || "Account"}</span>
                                    </p>
                                    <p className="text-xs text-(--muted-foreground)">{pay.notes || "No notes"} • {new Date(pay.created_at || pay.date).toLocaleDateString()}</p>
                                </div>
                                <CheckCircle2 className="w-5 h-5 text-(--success)" />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex justify-end">
                <Link href="/dashboard/money/credits" className="px-4 py-2 border border-(--border) rounded-lg text-sm font-medium hover:bg-(--muted) transition-colors">
                    Back to Credits
                </Link>
            </div>
        </div>
    );
}