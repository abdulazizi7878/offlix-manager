// file: app/dashboard/money/payables/[payableId]/page.jsx

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { TrendingDown, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";

export default function PayableDetailsPage() {
    const params = useParams();
    const payableId = params.payableId;

    const [payable, setPayable] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [payFull, setPayFull] = useState(true);
    const [amount, setAmount] = useState("");
    const [moneyAccountId, setMoneyAccountId] = useState("");
    const [notes, setNotes] = useState("");

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [pRes, accRes] = await Promise.all([
                fetchApi(`/api/v1/dashboard/money/payables/${payableId}`),
                fetchApi("/api/v1/dashboard/money/accounts")
            ]);

            // Handle nested data structures for payable and accounts matching: { success: true, data: { ... } }
            const pData = pRes.data?.data ?? pRes.data ?? {};
            setPayable(pData);

            const accResponseData = accRes.data?.data ?? accRes.data ?? {};
            const accList = Array.isArray(accResponseData)
                ? accResponseData
                : (accResponseData.data ?? accRes.data?.accounts ?? []);
            setAccounts(accList);

            const rem = Number(pData.remaining_amount ?? pData.amount ?? 0);
            setAmount(rem.toString());
        } catch (err) {
            setError(err.message || "Failed to load payable details.");
            toast.error("Failed to load payable details");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (payableId) loadData();
    }, [payableId]);

    const handlePayment = async (e) => {
        e.preventDefault();
        if (!moneyAccountId) {
            toast.error("Please select a payment money account");
            return;
        }

        const orig = Number(payable?.amount || 0);
        const rem = Number(payable?.remaining_amount ?? orig);
        const targetAmount = payFull ? rem : Number(amount);

        if (isNaN(targetAmount) || targetAmount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }
        if (targetAmount > rem) {
            toast.error("Amount cannot exceed remaining payable amount");
            return;
        }

        const parts = targetAmount.toString().split(".");
        if (parts[1] && parts[1].length > 2) {
            toast.error("Amounts can support a maximum of 2 decimal places");
            return;
        }

        setIsSubmitting(true);
        try {
            await fetchApi(`/api/v1/dashboard/money/payables/${payableId}/payments`, {
                method: "POST",
                body: JSON.stringify({
                    moneyAccountId,
                    amount: payFull ? undefined : targetAmount,
                    full: payFull,
                    notes: notes || null
                })
            });
            toast.success("Payment recorded successfully");
            setNotes("");
            loadData();
        } catch (err) {
            toast.error(err.message || "Failed to record payment");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="space-y-6 animate-pulse p-8"><div className="h-64 bg-(--card) rounded-xl" /></div>;
    }

    if (error || !payable) {
        return (
            <div className="p-12 text-center bg-(--card) border border-(--border) rounded-xl space-y-4">
                <AlertCircle className="w-10 h-10 text-(--destructive) mx-auto" />
                <p className="text-sm font-semibold">{error || "Payable not found"}</p>
                <Link href="/dashboard/money/payables" className="inline-block px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-sm">Back to Payables</Link>
            </div>
        );
    }

    const orig = Number(payable.amount || 0);
    const rem = Number(payable.remaining_amount ?? orig);
    const paid = orig - rem;
    const isPaid = rem <= 0 || payable.status === "paid";

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-between pb-6 border-b border-(--border)">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/money/payables" className="p-2 border border-(--border) rounded-lg hover:bg-(--muted) transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Payable Details</h1>
                        <p className="text-sm text-(--muted-foreground)">Supplier: {payable.supplier_name || payable.name}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-(--card) border border-(--border) rounded-xl p-4 space-y-1">
                    <span className="text-xs uppercase font-semibold text-(--muted-foreground)">Original Amount</span>
                    <p className="text-xl font-bold">{orig.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal">ETB</span></p>
                </div>
                <div className="bg-(--card) border border-(--border) rounded-xl p-4 space-y-1">
                    <span className="text-xs uppercase font-semibold text-(--muted-foreground)">Paid Amount</span>
                    <p className="text-xl font-bold text-(--success)">{paid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal">ETB</span></p>
                </div>
                <div className="bg-(--card) border border-(--border) rounded-xl p-4 space-y-1">
                    <span className="text-xs uppercase font-semibold text-(--muted-foreground)">Remaining Amount</span>
                    <p className="text-xl font-bold text-(--destructive)">{rem.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal">ETB</span></p>
                </div>
            </div>

            {!isPaid && (
                <div className="bg-(--card) border border-(--border) rounded-xl p-6 shadow-xs space-y-6">
                    <h2 className="text-base font-semibold">Make Payment</h2>
                    <form onSubmit={handlePayment} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Payment Account</label>
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
                                id="pay_full"
                                checked={payFull}
                                onChange={(e) => setPayFull(e.target.checked)}
                                className="rounded border-(--border) text-(--primary) focus:ring-(--ring)"
                            />
                            <label htmlFor="pay_full" className="text-sm font-medium">Pay full remaining amount ({rem.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB)</label>
                        </div>

                        {!payFull && (
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
                                {isSubmitting ? "Processing..." : "Submit Payment"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                <h3 className="text-base font-semibold">Payment History</h3>
                {(!payable.payments && !payable.history) || (payable.payments || payable.history || []).length === 0 ? (
                    <p className="text-xs text-(--muted-foreground) py-4 text-center">No payment records yet.</p>
                ) : (
                    <div className="space-y-3">
                        {(payable.payments || payable.history || []).map((pay, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-(--border) bg-(--muted)/20">
                                <div>
                                    <p className="text-sm font-medium">
                                        {Number(pay.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB via <span className="text-(--primary)">{pay.money_account?.name || "Account"}</span>
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
                <Link href="/dashboard/money/payables" className="px-4 py-2 border border-(--border) rounded-lg text-sm font-medium hover:bg-(--muted) transition-colors">
                    Back to Payables
                </Link>
            </div>
        </div>
    );
}