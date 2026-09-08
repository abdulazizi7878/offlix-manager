// file: app/dashboard/money/receivables/[receivableId]/page.jsx

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CircleDollarSign, AlertCircle, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";

export default function ReceivableDetailPage() {
    const params = useParams();
    const receivableId = params.receivableId;

    const [receivable, setReceivable] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        async function loadReceivable() {
            if (!receivableId) return;
            try {
                const res = await fetchApi(`/api/v1/dashboard/money/receivables/${receivableId}`);
                setReceivable(res.data?.receivable || res.data || res);
            } catch (err) {
                setError(err.message || "Failed to load receivable details.");
            } finally {
                setIsLoading(false);
            }
        }
        loadReceivable();
    }, [receivableId]);

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await fetchApi(`/api/v1/dashboard/money/receivables/${receivableId}/payments`, {
                method: "POST",
                body: JSON.stringify({ amount: Number(paymentAmount) }),
            });
            toast.success("Payment recorded successfully");
            setPaymentAmount("");
            // reload
            const res = await fetchApi(`/api/v1/dashboard/money/receivables/${receivableId}`);
            setReceivable(res.data?.receivable || res.data || res);
        } catch (err) {
            toast.error(err.message || "Failed to record payment.");
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

    if (error || !receivable) {
        return (
            <div className="max-w-4xl mx-auto p-6 space-y-4">
                <div className="p-4 bg-(--destructive)/10 border border-(--destructive)/20 rounded-xl flex items-center gap-3 text-(--destructive)">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-semibold">{error || "Receivable not found."}</p>
                </div>
                <Link href="/dashboard/money/receivables" className="inline-flex items-center gap-2 text-xs font-medium text-(--muted-foreground) hover:text-(--foreground)">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Receivables</span>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-16">
            <div className="flex items-center justify-between pb-4 border-b border-(--border)">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/money/receivables" className="p-2 border border-(--border) rounded-lg hover:bg-(--muted) text-(--muted-foreground) transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">{receivable.customerName || receivable.customer_name || "Customer Credit"}</h1>
                        <p className="text-xs font-mono text-(--muted-foreground)">Branch: {receivable.branchName || receivable.branch_name || "N/A"}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-(--card) border border-(--border) rounded-xl p-5 space-y-1 shadow-xs">
                    <span className="text-xs text-(--muted-foreground)">Original Amount</span>
                    <p className="text-xl font-mono font-bold">{Number(receivable.originalAmount || receivable.amount || 0).toLocaleString()} birr</p>
                </div>
                <div className="bg-(--card) border border-(--border) rounded-xl p-5 space-y-1 shadow-xs">
                    <span className="text-xs text-(--muted-foreground)">Amount Paid</span>
                    <p className="text-xl font-mono font-bold text-emerald-500">{Number(receivable.paidAmount || 0).toLocaleString()} birr</p>
                </div>
                <div className="bg-(--card) border border-(--border) rounded-xl p-5 space-y-1 shadow-xs">
                    <span className="text-xs text-(--muted-foreground)">Remaining Balance</span>
                    <p className="text-xl font-mono font-bold text-amber-500">{Number(receivable.remainingAmount || 0).toLocaleString()} birr</p>
                </div>
            </div>

            {/* Record Payment Form */}
            {receivable.status !== 'paid' && (
                <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground)">Record Payment</h2>
                    <form onSubmit={handleRecordPayment} className="flex gap-3">
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
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Receive Payment"}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}