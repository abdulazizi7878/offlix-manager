// file: app/dashboard/money/total-money/page.jsx

"use client";

import { useState, useEffect } from "react";
import { Wallet, Landmark, Building2, AlertCircle, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api/client";

export default function TotalMoneyPage() {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadTotalMoney() {
            try {
                const res = await fetchApi("/api/v1/dashboard/money/total-money");
                setData(res.data || res);
            } catch (err) {
                setError(err.message || "Failed to load total money details.");
            } finally {
                setIsLoading(false);
            }
        }
        loadTotalMoney();
    }, []);

    if (isLoading) {
        return (
            <div className="max-w-5xl mx-auto space-y-6 pb-16 animate-pulse">
                <div className="h-8 w-48 bg-(--muted) rounded-md" />
                <div className="h-48 bg-(--muted) rounded-xl" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-5xl mx-auto p-6">
                <div className="p-4 bg-(--destructive)/10 border border-(--destructive)/20 rounded-xl flex items-center gap-3 text-(--destructive)">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-semibold">{error}</p>
                </div>
            </div>
        );
    }

    const { totalBalance = 0, cashBalances = [], bankBalances = [], branchBalances = [], accountBreakdown = [] } = data || {};

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-16">
            <div className="pb-4 border-b border-(--border)">
                <h1 className="text-xl font-bold tracking-tight">Total Money Breakdown</h1>
                <p className="text-xs text-(--muted-foreground)">Actual funds held across all financial accounts (excludes receivables & payables).</p>
            </div>

            {/* Main Total Balance Box */}
            <div className="bg-(--primary)/5 border border-(--primary)/20 rounded-xl p-6 space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-(--primary)">Actual Liquid Balance</span>
                <p className="text-4xl font-mono font-bold tracking-tight text-(--primary)">{Number(totalBalance).toLocaleString()} birr</p>
                <p className="text-xs text-(--muted-foreground)">Sum of all physical cash and bank holdings in active financial accounts.</p>
            </div>

            {/* Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground) flex items-center gap-2">
                        <Wallet className="w-4 h-4" /> Cash Balances
                    </h2>
                    {cashBalances.length === 0 ? (
                        <p className="text-xs text-(--muted-foreground)">No cash accounts found.</p>
                    ) : (
                        <div className="divide-y divide-(--border)">
                            {cashBalances.map((acc, idx) => (
                                <div key={idx} className="py-2.5 flex items-center justify-between text-sm">
                                    <span>{acc.name}</span>
                                    <span className="font-mono font-semibold">{Number(acc.balance).toLocaleString()} birr</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground) flex items-center gap-2">
                        <Landmark className="w-4 h-4" /> Bank Balances
                    </h2>
                    {bankBalances.length === 0 ? (
                        <p className="text-xs text-(--muted-foreground)">No bank accounts found.</p>
                    ) : (
                        <div className="divide-y divide-(--border)">
                            {bankBalances.map((acc, idx) => (
                                <div key={idx} className="py-2.5 flex items-center justify-between text-sm">
                                    <span>{acc.name}</span>
                                    <span className="font-mono font-semibold">{Number(acc.balance).toLocaleString()} birr</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Account By Account Breakdown */}
            <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground)">Account-by-Account Details</h2>
                <div className="divide-y divide-(--border)">
                    {(accountBreakdown || []).map((acc) => (
                        <div key={acc.id} className="py-3 flex items-center justify-between">
                            <div className="space-y-0.5">
                                <p className="text-sm font-medium">{acc.name}</p>
                                <p className="text-xs text-(--muted-foreground) uppercase">{acc.type} • {acc.branchName || "Owner Account"}</p>
                            </div>
                            <span className="text-sm font-mono font-semibold">{Number(acc.balance).toLocaleString()} birr</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}