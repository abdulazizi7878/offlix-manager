// file: app/dashboard/money/payables/[payableId]/page.jsx

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CreditCard, AlertCircle, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";

export default function PayableDetailPage() {
    const params = useParams();
    const payableId = params.payableId;

    const [payable, setPayable] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        async function loadPayable() {
            if (!payableId) return;
            try {
                const res = await fetchApi(`/api/v1/dashboard/money/payables/${payableId}`);
                setPayable(res.data?.payable || res.data || res);
            } catch (err) {
                setError(err.message || "Failed to load payable details.");
            } finally {
                setIsLoading(false);
            }
        }
        loadPayable();
    }, [payableId]);

    const handleMakePayment = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await fetchApi(`/api/v1/dashboard/money/payables/${payableId}/payments`, {
                method: "POST",
                body: JSON.stringify({ amount: Number(paymentAmount) }),
            });
            toast.success("Payment made successfully");
            setPaymentAmount("");
            const res = await fetchApi(`/api/v1/dashboard/money/payables/${payableId}`);
            setPayable(res.data?.payable || res.data || res);
        } catch (err) {
            toast.error(err.message || "Failed to make payment.");
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

    if (error || !payable) {
        return (
            <div className="max-w-4xl mx-auto p-6 space-y-4">
                <div className="p-4 bg-(--destructive)/10 border border-(--destructive)/20 rounded-xl flex items-center gap-3 text-(--destructive)">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-semibold">{error || "Payable not found."}</p>
                </div>
                <Link href="/dashboard/money/payables" className="inline-flex items-center gap-2 text-xs font-medium text-(--muted-foreground) hover:text-(--foreground)">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Payables</span>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-16">
            <div className="flex items-center justify-between pb-4 border-b border-(--border)">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/money/payables" className="p-2 border border-(--border) rounded-lg hover:bg-(--muted) text-(--muted-foreground) transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">{payable.partyName || payable.party_name || "Business Obligation"}</h1>
                        <p className="text-xs font-mono text-(--muted-foreground)">Branch: {payable.branchName || payable.branch_name || "N/A"}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-(--card) border border-(--border) rounded-xl p-5 space-y-1 shadow-xs">
                    <span className="text-xs text-(--muted-foreground)">Original Amount</span>
                    <p className="text-xl font-mono font-bold">{Number(payable.originalAmount || payable.amount || 0).toLocaleString()} birr</p>
                </div>
                <div className="bg-(--card) border border-(--border) rounded-xl p-5 space-y-1 shadow-xs">
                    <span className="text-xs text-(--muted-foreground)">Amount Paid</span>
                    <p className="text-xl font-mono font-bold text-emerald-500">{Number(payable.paidAmount || 0).toLocaleString()} birr</p>
                </div>
                <div className="bg-(--card) border border-(--border) rounded-xl p-5 space-y-1 shadow-xs">
                    <span className="text-xs text-(--muted-foreground)">Remaining Balance</span>
                    <p className="text-xl font-mono font-bold text-rose-500">{Number(payable.remainingAmount || 0).toLocaleString()} birr</p>
                </div>
            </div>

            {payable.status !== 'paid' && (
                <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground)">Make Payment</h2>
                    <form onSubmit={handleMakePayment} className="flex gap-3">
                        <input
                            type="number"
                            step="0.01"
                            placeholder="Enter payment amount in birr"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="flex-1 px-3 py-2 border border-(--border) rounded-lg text-sm bg-transparent"
                            required
                        />
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pay Debt"}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}