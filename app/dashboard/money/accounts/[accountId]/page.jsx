// file: app/dashboard/money/accounts/[accountId]/page.jsx

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Landmark, ArrowLeftRight, AlertCircle, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api/client";

export default function AccountDetailPage() {
    const params = useParams();
    const accountId = params.accountId;

    const [accountData, setAccountData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadAccountDetail() {
            if (!accountId) return;
            try {
                const res = await fetchApi(`/api/v1/dashboard/money/accounts/${accountId}`);
                setAccountData(res.data || res);
            } catch (err) {
                setError(err.message || "Failed to load account details.");
            } finally {
                setIsLoading(false);
            }
        }
        loadAccountDetail();
    }, [accountId]);

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-pulse">
                <div className="h-8 w-48 bg-(--muted) rounded-md" />
                <div className="h-40 bg-(--muted) rounded-xl" />
            </div>
        );
    }

    if (error || !accountData) {
        return (
            <div className="max-w-4xl mx-auto p-6 space-y-4">
                <div className="p-4 bg-(--destructive)/10 border border-(--destructive)/20 rounded-xl flex items-center gap-3 text-(--destructive)">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-semibold">{error || "Account not found."}</p>
                </div>
                <Link href="/dashboard/money/accounts" className="inline-flex items-center gap-2 text-xs font-medium text-(--muted-foreground) hover:text-(--foreground)">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Accounts</span>
                </Link>
            </div>
        );
    }

    const { account, transactions = [] } = accountData;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-16">
            <div className="flex items-center justify-between pb-4 border-b border-(--border)">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/money/accounts" className="p-2 border border-(--border) rounded-lg hover:bg-(--muted) text-(--muted-foreground) transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">{account.name}</h1>
                        <p className="text-xs uppercase font-mono text-(--muted-foreground)">{account.type} • {account.branchName || account.branch_name || "Owner"}</p>
                    </div>
                </div>
            </div>

            <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-2 shadow-xs">
                <span className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Current Balance</span>
                <p className="text-3xl font-mono font-bold tracking-tight text-(--primary)">{Number(account.balance || 0).toLocaleString()} birr</p>
            </div>

            <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground)">Transaction History</h2>
                {transactions.length === 0 ? (
                    <div className="text-center py-8 text-sm text-(--muted-foreground)">
                        No transactions recorded for this account.
                    </div>
                ) : (
                    <div className="divide-y divide-(--border)">
                        {transactions.map((tx) => (
                            <div key={tx.id} className="py-3 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-medium">{tx.description || tx.type}</p>
                                    <p className="text-xs font-mono text-(--muted-foreground)">{new Date(tx.createdAt).toLocaleString()}</p>
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