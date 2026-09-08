// file: app/dashboard/money/settlements/page.jsx

"use client";

import { useState, useEffect } from "react";
import { HandCoins, AlertCircle, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";

export default function SettlementsPage() {
    const [settlements, setSettlements] = useState([]);
    const [ownerAccounts, setOwnerAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedSettlementId, setSelectedSettlementId] = useState("");
    const [receivingAccountId, setReceivingAccountId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const [setRes, accRes] = await Promise.all([
                    fetchApi("/api/v1/dashboard/money/settlements"),
                    fetchApi("/api/v1/dashboard/money/accounts")
                ]);
                setSettlements(setRes.data?.settlements || setRes.data || setRes);
                // Filter or show owner accounts for receiving settlement
                const accs = accRes.data?.accounts || accRes.data || accRes;
                setOwnerAccounts(accs);
            } catch (err) {
                setError(err.message || "Failed to load settlements data.");
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    const handleReceiveSettlement = async (e) => {
        e.preventDefault();
        if (!selectedSettlementId || !receivingAccountId) {
            toast.error("Please select a settlement and receiving owner account.");
            return;
        }
        setIsSubmitting(true);
        try {
            await fetchApi(`/api/v1/dashboard/money/settlements/${selectedSettlementId}/receive`, {
                method: "POST",
                body: JSON.stringify({ receivingAccountId }),
            });
            toast.success("Settlement received successfully");
            setSelectedSettlementId("");
            setReceivingAccountId("");
            const res = await fetchApi("/api/v1/dashboard/money/settlements");
            setSettlements(res.data?.settlements || res.data || res);
        } catch (err) {
            toast.error(err.message || "Failed to receive settlement.");
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

    if (error) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="p-4 bg-(--destructive)/10 border border-(--destructive)/20 rounded-xl flex items-center gap-3 text-(--destructive)">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-semibold">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-16">
            <div className="pb-4 border-b border-(--border)">
                <h1 className="text-xl font-bold tracking-tight">Branch Settlements</h1>
                <p className="text-xs text-(--muted-foreground)">Manage money transfers from branches to the owner.</p>
            </div>

            {/* Receive Settlement Form */}
            <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground)">Receive Pending Settlement</h2>
                <form onSubmit={handleReceiveSettlement} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-(--muted-foreground)">Pending Settlement</label>
                            <select
                                value={selectedSettlementId}
                                onChange={(e) => setSelectedSettlementId(e.target.value)}
                                className="w-full px-3 py-2 border border-(--border) rounded-lg text-sm bg-transparent"
                                required
                            >
                                <option value="">Select pending settlement</option>
                                {settlements.filter(s => s.status === 'pending').map(s => (
                                    <option key={s.id} value={s.id}>{s.branchName || "Branch"} - {Number(s.amount).toLocaleString()} birr</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-(--muted-foreground)">To Owner Account</label>
                            <select
                                value={receivingAccountId}
                                onChange={(e) => setReceivingAccountId(e.target.value)}
                                className="w-full px-3 py-2 border border-(--border) rounded-lg text-sm bg-transparent"
                                required
                            >
                                <option value="">Select owner receiving account</option>
                                {ownerAccounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <HandCoins className="w-4 h-4" />}
                        <span>Receive Settlement</span>
                    </button>
                </form>
            </div>

            {/* Settlements List */}
            <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground)">All Settlements</h2>
                {settlements.length === 0 ? (
                    <div className="text-center py-8 text-sm text-(--muted-foreground)">
                        No settlements recorded yet.
                    </div>
                ) : (
                    <div className="divide-y divide-(--border)">
                        {settlements.map((s) => (
                            <div key={s.id} className="py-3 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{s.branchName || "Branch Settlement"}</span>
                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${s.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                            {s.status}
                                        </span>
                                    </div>
                                    <p className="text-xs font-mono text-(--muted-foreground)">{new Date(s.createdAt).toLocaleString()}</p>
                                </div>
                                <span className="text-sm font-mono font-semibold">{Number(s.amount).toLocaleString()} birr</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}