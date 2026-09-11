// file: app/dashboard/money/settlements/[settlementId]/page.jsx

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, ArrowLeft, CheckCircle2, AlertCircle, User, Calendar } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function SettlementDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const settlementId = params.settlementId;

    const [settlement, setSettlement] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [acceptFull, setAcceptFull] = useState(true);
    const [amount, setAmount] = useState("");
    const [moneyAccountId, setMoneyAccountId] = useState("");
    const [notes, setNotes] = useState("");

    const loadDetails = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [setRes, accRes] = await Promise.all([
                fetchApi(`/api/v1/dashboard/money/settlements/${settlementId}`),
                fetchApi("/api/v1/dashboard/money/accounts")
            ]);

            const sData = setRes.data?.data ?? setRes.data ?? setRes;
            setSettlement(sData);

            const accRaw = accRes.data?.data ?? accRes.data ?? {};
            const accList = Array.isArray(accRaw)
                ? accRaw
                : (Array.isArray(accRaw.data) ? accRaw.data : (accRes.data?.accounts ?? []));

            setAccounts(accList);

            const rem = Number(sData.remaining_amount ?? (sData.original_amount || sData.amount || 0));
            setAmount(rem.toString());
        } catch (err) {
            setError(err.message || "Failed to load settlement details.");
            toast.error("Failed to load settlement details");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (settlementId) loadDetails();
    }, [settlementId]);

    const handleAccept = async (e) => {
        e.preventDefault();
        if (!moneyAccountId) {
            toast.error("Please select a destination money account");
            return;
        }

        const orig = Number(settlement?.original_amount || settlement?.amount || 0);
        const rem = Number(settlement?.remaining_amount ?? orig);
        const targetAmount = acceptFull ? rem : Number(amount);

        if (isNaN(targetAmount) || targetAmount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }
        if (targetAmount > rem) {
            toast.error("Amount cannot exceed remaining settlement amount");
            return;
        }

        const parts = targetAmount.toString().split(".");
        if (parts[1] && parts[1].length > 2) {
            toast.error("Amounts can support a maximum of 2 decimal places");
            return;
        }

        setIsSubmitting(true);
        try {
            await fetchApi(`/api/v1/dashboard/money/settlements/${settlementId}/accept`, {
                method: "POST",
                body: JSON.stringify({
                    moneyAccountId,
                    amount: targetAmount,
                    notes
                })
            });
            toast.success("Settlement accepted successfully");
            setNotes("");
            loadDetails();
        } catch (err) {
            toast.error(err.message || "Failed to accept settlement");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="space-y-6 animate-pulse p-8"><div className="h-64 bg-(--card) rounded-xl" /></div>;
    }

    if (error || !settlement) {
        return (
            <div className="p-12 text-center bg-(--card) border border-(--border) rounded-xl space-y-4">
                <AlertCircle className="w-10 h-10 text-(--destructive) mx-auto" />
                <p className="text-sm font-semibold">{error || "Settlement not found"}</p>
                <Link href="/dashboard/money/settlements" className="inline-block px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-sm">Back to Settlements</Link>
            </div>
        );
    }

    const orig = Number(settlement.original_amount || settlement.amount || 0);
    const rem = Number(settlement.remaining_amount ?? orig);
    const acc = orig - rem;
    const isCompleted = rem <= 0 || settlement.status === "received" || settlement.status === "completed";

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-between pb-6 border-b border-(--border)">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/money/settlements" className="p-2 border border-(--border) rounded-lg hover:bg-(--muted) transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Settlement Details</h1>
                        <p className="text-sm text-(--muted-foreground)">Manage acceptance of branch revenue funds.</p>
                    </div>
                </div>
            </div>

            {/* Info Meta Card (Branch, Requester, Date) */}
            <div className="bg-(--card) border border-(--border) rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-(--primary)/10 text-(--primary) rounded-lg">
                        <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                        <span className="text-(--muted-foreground) block">Branch Name</span>
                        <span className="font-semibold text-sm">{settlement.branch_name || "N/A"}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-(--primary)/10 text-(--primary) rounded-lg">
                        <User className="w-4 h-4" />
                    </div>
                    <div>
                        <span className="text-(--muted-foreground) block">Requested By</span>
                        <span className="font-semibold text-sm">{settlement.requested_by_name || "N/A"}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-(--primary)/10 text-(--primary) rounded-lg">
                        <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                        <span className="text-(--muted-foreground) block">Requested Date</span>
                        <span className="font-semibold text-sm">
                            {settlement.requested_at ? dayjs(settlement.requested_at).format("DD/MM/YYYY") : "N/A"}
                        </span>
                        <span className="text-[10px] text-(--muted-foreground) block">
                            {settlement.requested_at ? `(${dayjs(settlement.requested_at).fromNow()})` : ""}
                        </span>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-(--card) border border-(--border) rounded-xl p-4 space-y-1">
                    <span className="text-xs uppercase font-semibold text-(--muted-foreground)">Original Amount</span>
                    <p className="text-xl font-bold">{orig.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal">ETB</span></p>
                </div>
                <div className="bg-(--card) border border-(--border) rounded-xl p-4 space-y-1">
                    <span className="text-xs uppercase font-semibold text-(--muted-foreground)">Accepted Amount</span>
                    <p className="text-xl font-bold text-(--success)">{acc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal">ETB</span></p>
                </div>
                <div className="bg-(--card) border border-(--border) rounded-xl p-4 space-y-1">
                    <span className="text-xs uppercase font-semibold text-(--muted-foreground)">Remaining Amount</span>
                    <p className="text-xl font-bold text-(--destructive)">{rem.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal">ETB</span></p>
                </div>
            </div>

            {/* Acceptance Form if not completed */}
            {!isCompleted && (
                <div className="bg-(--card) border border-(--border) rounded-xl p-6 shadow-xs space-y-6">
                    <h2 className="text-base font-semibold">Accept Settlement Funds</h2>
                    <form onSubmit={handleAccept} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Destination Money Account</label>
                            <select
                                value={moneyAccountId}
                                onChange={(e) => setMoneyAccountId(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                            >
                                <option value="">Select Destination Account</option>
                                {accounts.map(accItem => (
                                    <option key={accItem.id} value={accItem.id}>{accItem.name} ({accItem.type})</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="accept_full"
                                checked={acceptFull}
                                onChange={(e) => setAcceptFull(e.target.checked)}
                                className="rounded border-(--border) text-(--primary) focus:ring-(--ring)"
                            />
                            <label htmlFor="accept_full" className="text-sm font-medium">Accept full remaining amount ({rem.toLocaleString()} ETB)</label>
                        </div>

                        {!acceptFull && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Partial Amount (ETB)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    max={rem}
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Notes</label>
                            <textarea
                                rows="2"
                                placeholder="Acceptance notes..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                            />
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-sm font-medium hover:opacity-95 transition-opacity disabled:opacity-50"
                            >
                                {isSubmitting ? "Processing..." : "Accept Funds"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Acceptance History */}
            <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                <h3 className="text-base font-semibold">Acceptance History</h3>
                {(!settlement.history && !settlement.acceptances && !settlement.payments) || (settlement.history || settlement.acceptances || settlement.payments || []).length === 0 ? (
                    <p className="text-xs text-(--muted-foreground) py-4 text-center">No acceptance records yet for this settlement.</p>
                ) : (
                    <div className="space-y-3">
                        {(settlement.history || settlement.acceptances || settlement.payments || []).map((h, i) => {
                            const hDate = h.created_at || h.date;
                            return (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-(--border) bg-(--muted)/20">
                                    <div>
                                        <p className="text-sm font-medium">
                                            {Number(h.amount).toLocaleString()} ETB → <span className="text-(--primary)">{h.money_account?.name || h.account_name || "Account"}</span>
                                        </p>
                                        <p className="text-xs text-(--muted-foreground)">
                                            {h.notes || "No notes"} • {hDate ? `${dayjs(hDate).format("DD/MM/YYYY")} (${dayjs(hDate).fromNow()})` : ""}
                                        </p>
                                    </div>
                                    <CheckCircle2 className="w-5 h-5 text-(--success)" />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="flex justify-end">
                <Link href="/dashboard/money/settlements" className="px-4 py-2 border border-(--border) rounded-lg text-sm font-medium hover:bg-(--muted) transition-colors">
                    Back to Settlements
                </Link>
            </div>
        </div>
    );
}