"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Building2, ArrowLeft, CheckCircle2, AlertCircle, User, Calendar } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function SettlementDetailsPage() {
    const t = useTranslations("dashboard.settlementDetailsPage");
    const params = useParams();
    const router = useRouter();
    const settlementId = params?.settlementId;

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
            setError(err.message || t("messages.loadError"));
            toast.error(t("messages.loadError"));
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
            toast.error(t("messages.selectAccount"));
            return;
        }

        const orig = Number(settlement?.original_amount || settlement?.amount || 0);
        const rem = Number(settlement?.remaining_amount ?? orig);
        const targetAmount = acceptFull ? rem : Number(amount);

        if (isNaN(targetAmount) || targetAmount <= 0) {
            toast.error(t("messages.invalidAmount"));
            return;
        }
        if (targetAmount > rem) {
            toast.error(t("messages.exceedsRemaining"));
            return;
        }

        const parts = targetAmount.toString().split(".");
        if (parts[1] && parts[1].length > 2) {
            toast.error(t("messages.decimalLimit"));
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
            toast.success(t("messages.success"));
            setNotes("");
            loadDetails();
        } catch (err) {
            toast.error(err.message || t("messages.failed"));
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
                <p className="text-sm font-semibold">{error || t("notFound")}</p>
                <Link href="/dashboard/money/settlements" className="inline-block px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-sm">
                    {t("backToSettlements")}
                </Link>
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
                        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
                        <p className="text-sm text-(--muted-foreground)">{t("subtitle")}</p>
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
                        <span className="text-(--muted-foreground) block">{t("meta.branchName")}</span>
                        <span className="font-semibold text-sm">{settlement.branch_name || t("meta.na")}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-(--primary)/10 text-(--primary) rounded-lg">
                        <User className="w-4 h-4" />
                    </div>
                    <div>
                        <span className="text-(--muted-foreground) block">{t("meta.requestedBy")}</span>
                        <span className="font-semibold text-sm">{settlement.requested_by_name || t("meta.na")}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-(--primary)/10 text-(--primary) rounded-lg">
                        <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                        <span className="text-(--muted-foreground) block">{t("meta.requestedDate")}</span>
                        <span className="font-semibold text-sm">
                            {settlement.requested_at ? dayjs(settlement.requested_at).format("DD/MM/YYYY") : t("meta.na")}
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
                    <span className="text-xs uppercase font-semibold text-(--muted-foreground)">{t("summary.originalAmount")}</span>
                    <p className="text-xl font-bold">{orig.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal">{t("summary.etb")}</span></p>
                </div>
                <div className="bg-(--card) border border-(--border) rounded-xl p-4 space-y-1">
                    <span className="text-xs uppercase font-semibold text-(--muted-foreground)">{t("summary.acceptedAmount")}</span>
                    <p className="text-xl font-bold text-(--success)">{acc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal">{t("summary.etb")}</span></p>
                </div>
                <div className="bg-(--card) border border-(--border) rounded-xl p-4 space-y-1">
                    <span className="text-xs uppercase font-semibold text-(--muted-foreground)">{t("summary.remainingAmount")}</span>
                    <p className="text-xl font-bold text-(--destructive)">{rem.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal">{t("summary.etb")}</span></p>
                </div>
            </div>

            {/* Acceptance Form if not completed */}
            {!isCompleted && (
                <div className="bg-(--card) border border-(--border) rounded-xl p-6 shadow-xs space-y-6">
                    <h2 className="text-base font-semibold">{t("form.title")}</h2>
                    <form onSubmit={handleAccept} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("form.destinationAccount")}</label>
                            <select
                                value={moneyAccountId}
                                onChange={(e) => setMoneyAccountId(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                            >
                                <option value="">{t("form.selectDestination")}</option>
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
                            <label htmlFor="accept_full" className="text-sm font-medium">
                                {t("form.acceptFull", { amount: rem.toLocaleString() })}
                            </label>
                        </div>

                        {!acceptFull && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("form.partialAmount")}</label>
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
                            <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("form.notes")}</label>
                            <textarea
                                rows="2"
                                placeholder={t("form.notesPlaceholder")}
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
                                {isSubmitting ? t("form.processing") : t("form.acceptFunds")}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Acceptance History */}
            <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                <h3 className="text-base font-semibold">{t("history.title")}</h3>
                {(!settlement.history && !settlement.acceptances && !settlement.payments) || (settlement.history || settlement.acceptances || settlement.payments || []).length === 0 ? (
                    <p className="text-xs text-(--muted-foreground) py-4 text-center">{t("history.noRecords")}</p>
                ) : (
                    <div className="space-y-3">
                        {(settlement.history || settlement.acceptances || settlement.payments || []).map((h, i) => {
                            const hDate = h.created_at || h.date;
                            return (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-(--border) bg-(--muted)/20">
                                    <div>
                                        <p className="text-sm font-medium">
                                            {Number(h.amount).toLocaleString()} ETB → <span className="text-(--primary)">{h.money_account?.name || h.account_name || t("history.account")}</span>
                                        </p>
                                        <p className="text-xs text-(--muted-foreground)">
                                            {h.notes || t("history.noNotes")} • {hDate ? `${dayjs(hDate).format("DD/MM/YYYY")} (${dayjs(hDate).fromNow()})` : ""}
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
                    {t("backToSettlements")}
                </Link>
            </div>
        </div>
    );
}