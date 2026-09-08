// file: app/dashboard/money/transactions/page.jsx

"use client";

import { useState, useEffect } from "react";
import { ArrowLeftRight, AlertCircle, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api/client";

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadTransactions() {
            try {
                const res = await fetchApi("/api/v1/dashboard/money/transactions");
                setTransactions(res.data?.transactions || res.data || res);
            } catch (err) {
                setError(err.message || "Failed to load transactions.");
            } finally {
                setIsLoading(false);
            }
        }
        loadTransactions();
    }, []);

    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-pulse">
                <div className="h-8 w-48 bg-(--muted) rounded-md" />
                <div className="h-64 bg-(--muted) rounded-xl" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-6xl mx-auto p-6">
                <div className="p-4 bg-(--destructive)/10 border border-(--destructive)/20 rounded-xl flex items-center gap-3 text-(--destructive)">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-semibold">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-16">
            <div className="pb-4 border-b border-(--border)">
                <h1 className="text-xl font-bold tracking-tight">Financial Audit Trail</h1>
                <p className="text-xs text-(--muted-foreground)">Complete history of all inflows, outflows, sales payments, transfers, and settlements.</p>
            </div>

            <div className="bg-(--card) border border-(--border) rounded-xl shadow-xs overflow-hidden">
                {transactions.length === 0 ? (
                    <div className="text-center py-12 text-sm text-(--muted-foreground)">
                        No financial transactions found.
                    </div>
                ) : (
                    <div className="divide-y divide-(--border)">
                        {transactions.map((tx) => (
                            <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-(--muted)/50 transition-colors">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded bg-(--muted) text-(--muted-foreground) text-[10px] font-mono uppercase font-semibold">
                                            {tx.type}
                                        </span>
                                        <span className="text-sm font-medium">{tx.description || "Account Activity"}</span>
                                    </div>
                                    <p className="text-xs font-mono text-(--muted-foreground)">
                                        Account: {tx.accountName || tx.account_name || "N/A"} • {new Date(tx.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <span className={`text-sm font-mono font-semibold ${tx.direction === 'in' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {tx.direction === 'in' ? '+' : '-'}{Number(tx.amount).toLocaleString()} birr
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}