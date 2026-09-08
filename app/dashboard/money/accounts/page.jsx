// file: app/dashboard/money/accounts/page.jsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Wallet, Landmark } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";

export default function AccountsOverviewPage() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAccounts() {
            try {
                const res = await fetchApi("/api/v1/dashboard/money/accounts");
                setAccounts(res.data || res.accounts || []);
            } catch (err) {
                toast.error("Failed to load financial accounts.");
            } finally {
                setLoading(false);
            }
        }
        fetchAccounts();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Financial Accounts</h2>
                    <p className="text-sm text-(--muted-foreground)">Manage global cash and bank accounts for the business.</p>
                </div>
                <Link
                    href="/dashboard/money/accounts/create"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-(--primary) text-(--primary-foreground) font-medium text-sm hover:opacity-95 transition-opacity"
                >
                    <Plus className="w-4 h-4" />
                    <span>Create Account</span>
                </Link>
            </div>

            <div className="bg-(--card) border border-(--border) rounded-xl overflow-hidden shadow-xs">
                {loading ? (
                    <div className="p-8 text-center text-sm text-(--muted-foreground)">Loading accounts...</div>
                ) : accounts.length === 0 ? (
                    <div className="p-12 text-center space-y-3">
                        <div className="w-10 h-10 rounded-full bg-(--muted) flex items-center justify-center mx-auto text-(--muted-foreground)">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-medium">No financial accounts found.</p>
                        <p className="text-xs text-(--muted-foreground)">Get started by creating a new account.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-(--muted)/50 border-b border-(--border) text-xs font-semibold text-(--muted-foreground)">
                                <tr>
                                    <th className="px-6 py-3">Account Name</th>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3">Bank Details</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border)">
                                {accounts.map((acc) => (
                                    <tr key={acc.id || acc._id} className="hover:bg-(--muted)/30 transition-colors">
                                        <td className="px-6 py-4 font-medium flex items-center gap-2.5">
                                            <div className="p-2 rounded-lg bg-(--muted) text-(--foreground)">
                                                {acc.type?.toLowerCase() === "bank" ? (
                                                    <Landmark className="w-4 h-4" />
                                                ) : (
                                                    <Wallet className="w-4 h-4" />
                                                )}
                                            </div>
                                            <span>{acc.name}</span>
                                        </td>
                                        <td className="px-6 py-4 capitalize">{acc.type}</td>
                                        <td className="px-6 py-4 text-(--muted-foreground)">
                                            {acc.type?.toLowerCase() === "bank" ? (
                                                <div className="space-y-0.5">
                                                    <p className="font-medium text-(--foreground)">{acc.bankName || "—"}</p>
                                                    <p className="text-xs">{acc.accountIdentifier || acc.accountNumber || "—"}</p>
                                                </div>
                                            ) : (
                                                <span className="text-xs italic">N/A (Cash Account)</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${acc.status === "active" || !acc.status
                                                    ? "bg-emerald-500/10 text-emerald-500"
                                                    : "bg-amber-500/10 text-amber-500"
                                                }`}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                                <span className="capitalize">{acc.status || "Active"}</span>
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}