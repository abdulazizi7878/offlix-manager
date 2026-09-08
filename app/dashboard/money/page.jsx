// file: app/dashboard/money/page.jsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Wallet, Landmark, ArrowLeftRight, CircleDollarSign,
    CreditCard, ArrowDownToLine, HandCoins, PieChart,
    TrendingUp, Plus, ArrowUpRight, AlertCircle, Loader2
} from "lucide-react";
import { fetchApi } from "@/lib/api/client";

export default function MoneyOverviewPage() {
    const [overview, setOverview] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadMoneyOverview() {
            try {
                const res = await fetchApi("/api/v1/dashboard/money/overview");
                setOverview(res.data || res);
            } catch (err) {
                setError(err.message || "Failed to load financial overview.");
            } finally {
                setIsLoading(false);
            }
        }
        loadMoneyOverview();
    }, []);

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto space-y-6 pb-16 animate-pulse">
                <div className="h-8 w-48 bg-(--muted) rounded-md" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="h-32 bg-(--muted) rounded-xl" />
                    <div className="h-32 bg-(--muted) rounded-xl" />
                    <div className="h-32 bg-(--muted) rounded-xl" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <div className="p-4 bg-(--destructive)/10 border border-(--destructive)/20 rounded-xl flex items-center gap-3 text-(--destructive)">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-semibold">{error}</p>
                </div>
            </div>
        );
    }

    const { totalMoney = 0, cash = 0, bank = 0, receivables = 0, payables = 0, recentActivity = [] } = overview || {};

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-16">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-(--border)">
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Money Control Center</h1>
                    <p className="text-xs text-(--muted-foreground)">Manage accounts, cash flow, receivables, and payables.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/dashboard/money/transfers"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-(--border) hover:bg-(--muted) rounded-lg text-xs font-medium transition-colors"
                    >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                        <span>Transfer</span>
                    </Link>
                    <Link
                        href="/dashboard/money/withdrawals"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-(--primary) text-(--primary-foreground) hover:opacity-90 rounded-lg text-xs font-medium transition-colors"
                    >
                        <ArrowDownToLine className="w-3.5 h-3.5" />
                        <span>Withdrawal</span>
                    </Link>
                </div>
            </div>

            {/* Financial Snapshot Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-(--card) border border-(--border) rounded-xl p-5 space-y-2 shadow-xs">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground) flex items-center gap-1.5">
                        <Wallet className="w-4 h-4 text-(--primary)" /> Total Money
                    </span>
                    <p className="text-2xl font-mono font-bold tracking-tight">{Number(totalMoney).toLocaleString()} birr</p>
                </div>
                <div className="bg-(--card) border border-(--border) rounded-xl p-5 space-y-2 shadow-xs">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground) flex items-center gap-1.5">
                        <Wallet className="w-4 h-4" /> Cash
                    </span>
                    <p className="text-2xl font-mono font-bold tracking-tight">{Number(cash).toLocaleString()} birr</p>
                </div>
                <div className="bg-(--card) border border-(--border) rounded-xl p-5 space-y-2 shadow-xs">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground) flex items-center gap-1.5">
                        <Landmark className="w-4 h-4" /> Bank Money
                    </span>
                    <p className="text-2xl font-mono font-bold tracking-tight">{Number(bank).toLocaleString()} birr</p>
                </div>
                <div className="bg-(--card) border border-(--border) rounded-xl p-5 space-y-2 shadow-xs">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground) flex items-center gap-1.5">
                        <CircleDollarSign className="w-4 h-4 text-amber-500" /> Customers Owe
                    </span>
                    <p className="text-2xl font-mono font-bold tracking-tight text-amber-500">{Number(receivables).toLocaleString()} birr</p>
                </div>
                <div className="bg-(--card) border border-(--border) rounded-xl p-5 space-y-2 shadow-xs">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground) flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-rose-500" /> Business Owes
                    </span>
                    <p className="text-2xl font-mono font-bold tracking-tight text-rose-500">{Number(payables).toLocaleString()} birr</p>
                </div>
            </div>

            {/* Quick Navigation Cards / Drilldowns */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Link href="/dashboard/money/accounts" className="p-4 bg-(--card) border border-(--border) rounded-xl hover:border-(--primary) transition-all flex items-center justify-between group">
                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Financial Accounts</h3>
                        <p className="text-sm font-medium mt-1">View all accounts</p>
                    </div>
                    <Landmark className="w-5 h-5 text-(--muted-foreground) group-hover:text-(--primary) transition-colors" />
                </Link>
                <Link href="/dashboard/money/transactions" className="p-4 bg-(--card) border border-(--border) rounded-xl hover:border-(--primary) transition-all flex items-center justify-between group">
                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Transactions</h3>
                        <p className="text-sm font-medium mt-1">Audit money trail</p>
                    </div>
                    <ArrowLeftRight className="w-5 h-5 text-(--muted-foreground) group-hover:text-(--primary) transition-colors" />
                </Link>
                <Link href="/dashboard/money/receivables" className="p-4 bg-(--card) border border-(--border) rounded-xl hover:border-(--primary) transition-all flex items-center justify-between group">
                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Receivables</h3>
                        <p className="text-sm font-medium mt-1">Customer credits</p>
                    </div>
                    <CircleDollarSign className="w-5 h-5 text-(--muted-foreground) group-hover:text-(--primary) transition-colors" />
                </Link>
                <Link href="/dashboard/money/settlements" className="p-4 bg-(--card) border border-(--border) rounded-xl hover:border-(--primary) transition-all flex items-center justify-between group">
                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Settlements</h3>
                        <p className="text-sm font-medium mt-1">Branch remittances</p>
                    </div>
                    <HandCoins className="w-5 h-5 text-(--muted-foreground) group-hover:text-(--primary) transition-colors" />
                </Link>
            </div>

            {/* Recent Money Activity */}
            <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground)">Recent Money Activity</h2>
                {recentActivity.length === 0 ? (
                    <div className="text-center py-8 text-sm text-(--muted-foreground)">
                        No recent money movements recorded.
                    </div>
                ) : (
                    <div className="divide-y divide-(--border)">
                        {recentActivity.map((activity) => (
                            <div key={activity.id} className="py-3 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-medium">{activity.description || activity.type}</p>
                                    <p className="text-xs font-mono text-(--muted-foreground)">{new Date(activity.createdAt).toLocaleString()}</p>
                                </div>
                                <span className={`text-sm font-mono font-semibold ${activity.direction === 'in' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {activity.direction === 'in' ? '+' : '-'}{Number(activity.amount).toLocaleString()} birr
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}