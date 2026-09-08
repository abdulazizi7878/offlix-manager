// file: app/dashboard/money/receivables/page.jsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CircleDollarSign, AlertCircle, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api/client";

export default function ReceivablesPage() {
    const [receivables, setReceivables] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadReceivables() {
            try {
                const res = await fetchApi("/api/v1/dashboard/money/receivables");
                setReceivables(res.data?.receivables || res.data || res);
            } catch (err) {
                setError(err.message || "Failed to load receivables.");
            } finally {
                setIsLoading(false);
            }
        }
        loadReceivables();
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
                <h1 className="text-xl font-bold tracking-tight">Customer Receivables</h1>
                <p className="text-xs text-(--muted-foreground)">Outstanding credit balances owed by customers to the business.</p>
            </div>

            {receivables.length === 0 ? (
                <div className="bg-(--card) border border-(--border) rounded-xl p-12 text-center space-y-3">
                    <CircleDollarSign className="w-10 h-10 mx-auto text-(--muted-foreground)" />
                    <h2 className="text-sm font-semibold">No receivables yet</h2>
                    <p className="text-xs text-(--muted-foreground)">When customers buy on credit, their outstanding balances will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {receivables.map((rec) => (
                        <Link
                            key={rec.id}
                            href={`/dashboard/money/receivables/${rec.id}`}
                            className="bg-(--card) border border-(--border) rounded-xl p-5 space-y-3 hover:border-(--primary) transition-all block shadow-xs"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold">{rec.customerName || rec.customer_name || "Walk-in Customer"}</span>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${rec.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                    {rec.status}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-(--border) text-xs">
                                <div>
                                    <span className="text-(--muted-foreground) block">Original</span>
                                    <span className="font-mono font-semibold">{Number(rec.originalAmount || rec.amount || 0).toLocaleString()} birr</span>
                                </div>
                                <div>
                                    <span className="text-(--muted-foreground) block">Paid</span>
                                    <span className="font-mono font-semibold text-emerald-500">{Number(rec.paidAmount || 0).toLocaleString()} birr</span>
                                </div>
                                <div>
                                    <span className="text-(--muted-foreground) block">Remaining</span>
                                    <span className="font-mono font-semibold text-amber-500">{Number(rec.remainingAmount || 0).toLocaleString()} birr</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}