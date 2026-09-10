// file: app/dashboard/money/transactions/[transactionId]/page.jsx

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRightLeft, ArrowLeft, ArrowUpRight, ArrowDownLeft, AlertCircle, Calendar, Wallet } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function TransactionDetailsPage() {
    const params = useParams();
    const transactionId = params.transactionId;

    const [transaction, setTransaction] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadTx = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetchApi(`/api/v1/dashboard/money/transactions/${transactionId}`);
                setTransaction(res.data || res);
            } catch (err) {
                setError(err.message || "Failed to load transaction details.");
                toast.error("Failed to load transaction details");
            } finally {
                setIsLoading(false);
            }
        };
        if (transactionId) loadTx();
    }, [transactionId]);

    if (isLoading) {
        return <div className="space-y-6 animate-pulse p-8"><div className="h-64 bg-(--card) rounded-xl" /></div>;
    }

    if (error || !transaction) {
        return (
            <div className="p-12 text-center bg-(--card) border border-(--border) rounded-xl space-y-4">
                <AlertCircle className="w-10 h-10 text-(--destructive) mx-auto" />
                <p className="text-sm font-semibold">{error || "Transaction not found"}</p>
                <Link href="/dashboard/money/transactions" className="inline-block px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-sm">Back to Transactions</Link>
            </div>
        );
    }

    const isIn = transaction.direction === "in" || transaction.type === "income" || transaction.type === "deposit";
    const txDate = transaction.date || transaction.created_at;

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-between pb-6 border-b border-(--border)">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/money/transactions" className="p-2 border border-(--border) rounded-lg hover:bg-(--muted) transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Transaction Details</h1>
                        <p className="text-sm text-(--muted-foreground)">Complete information about this transaction record.</p>
                    </div>
                </div>
            </div>

            <div className="bg-(--card) border border-(--border) rounded-xl p-6 shadow-xs space-y-6">
                <div className="flex items-center justify-between p-4 bg-(--muted)/30 rounded-lg border border-(--border)">
                    <div>
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium uppercase mb-2 ${isIn ? "bg-(--success)/10 text-(--success)" : "bg-(--destructive)/10 text-(--destructive)"}`}>
                            {transaction.direction || (isIn ? "In" : "Out")} • {transaction.type}
                        </span>
                        <p className="text-3xl font-bold">
                            {isIn ? "+" : "-"}{Number(transaction.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-normal text-(--muted-foreground)">ETB</span>
                        </p>
                    </div>
                    <div className={`p-3 rounded-xl ${isIn ? "bg-(--success)/10 text-(--success)" : "bg-(--destructive)/10 text-(--destructive)"}`}>
                        {isIn ? <ArrowDownLeft className="w-8 h-8" /> : <ArrowUpRight className="w-8 h-8" />}
                    </div>
                </div>

                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between py-3 border-b border-(--border)">
                        <span className="text-xs uppercase font-semibold text-(--muted-foreground)">Money Account</span>
                        <span className="text-sm font-medium flex items-center gap-1.5">
                            <Wallet className="w-4 h-4 text-(--primary)" />
                            {transaction.money_account_name || transaction.money_account?.name || "N/A"}
                        </span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-(--border)">
                        <span className="text-xs uppercase font-semibold text-(--muted-foreground)">Date</span>
                        <span className="text-sm font-medium flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-(--muted-foreground)" />
                            <span title={txDate}>
                                {dayjs(txDate).fromNow()} ({new Date(txDate).toLocaleDateString()})
                            </span>
                        </span>
                    </div>
                    <div className="space-y-1.5 py-3">
                        <span className="text-xs uppercase font-semibold text-(--muted-foreground)">Description / Notes</span>
                        <p className="text-sm p-3 bg-(--muted)/20 rounded-lg border border-(--border)">
                            {transaction.description || "No description provided."}
                        </p>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-(--border)">
                    <Link href="/dashboard/money/transactions" className="px-4 py-2 border border-(--border) rounded-lg text-sm font-medium hover:bg-(--muted) transition-colors">
                        Back to Transactions
                    </Link>
                </div>
            </div>
        </div>
    );
}