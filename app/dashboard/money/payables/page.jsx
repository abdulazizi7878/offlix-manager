// file: app/dashboard/money/payables/page.jsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CreditCard, AlertCircle, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api/client";

export default function PayablesPage() {
    const [payables, setPayables] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadPayables() {
            try {
                const res = await fetchApi("/api/v1/dashboard/money/payables");
                setPayables(res.data?.payables || res.data || res);
            } catch (err) {
                setError(err.message || "Failed to load payables.");
            } finally {
                setIsLoading(false);
            }
        }
        loadPayables();
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
                <h1 className="text-xl font-bold tracking-tight">Business Payables</h1>
                <p className="text-xs text-(--muted-foreground)">Outstanding debts and financial obligations owed by the business.</p>
            </div>

            {payables.length === 0 ? (
                <div className="bg-(--card) border border-(--border) rounded-xl p-12 text-center space-y-3">
                    <CreditCard className="w-10 h-10 mx-auto text-(--muted-foreground)" />
                    <h2 className="text-sm font-semibold">No payables found</h2>
                    <p className="text-xs text-(--muted-foreground)">Financial obligations will appear here when recorded.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {payables.map((pay) => (
                        <Link
                            key={pay.id}
                            href={`/dashboard/money/payables/${pay.id}`}
                            className="bg-(--card) border border-(--border) rounded-xl p-5 space-y-3 hover:border-(--primary) transition-all block shadow-xs"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold">{pay.partyName || pay.party_name || "Vendor / Supplier"}</span>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pay.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                    {pay.status}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-(--border) text-xs">
                                <div>
                                    <span className="text-(--muted-foreground) block">Original</span>
                                    <span className="font-mono font-semibold">{Number(pay.originalAmount || pay.amount || 0).toLocaleString()} birr</span>
                                </div>
                                <div>
                                    <span className="text-(--muted-foreground) block">Paid</span>
                                    <span className="font-mono font-semibold text-emerald-500">{Number(pay.paidAmount || 0).toLocaleString()} birr</span>
                                </div>
                                <div>
                                    <span className="text-(--muted-foreground) block">Remaining</span>
                                    <span className="font-mono font-semibold text-rose-500">{Number(pay.remainingAmount || 0).toLocaleString()} birr</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}