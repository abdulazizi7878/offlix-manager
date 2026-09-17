"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";

import {
    TrendingUp,
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    Calendar,
    User,
    FileText,
    Clock,
} from "lucide-react";

import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function CreditDetailsPage() {
    const t = useTranslations("dashboard.creditDetailsPage");
    const creditsT = useTranslations("dashboard.creditsPage");
    const params = useParams();
    const creditId = params.creditId;

    const [credit, setCredit] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [receiveFull, setReceiveFull] = useState(true);
    const [amount, setAmount] = useState("");
    const [moneyAccountId, setMoneyAccountId] = useState("");
    const [notes, setNotes] = useState("");

    const loadData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const [cRes, accRes] = await Promise.all([
                fetchApi(`/api/v1/dashboard/money/credits/${creditId}`),
                fetchApi("/api/v1/dashboard/money/accounts"),
            ]);

            const cData = cRes.data?.data ?? cRes.data ?? cRes;
            setCredit(cData);

            const accRaw = accRes.data?.data ?? accRes.data ?? {};
            const accList = Array.isArray(accRaw)
                ? accRaw
                : Array.isArray(accRaw.data)
                    ? accRaw.data
                    : accRes.data?.accounts ?? [];

            setAccounts(accList);

            const rem = Number(cData.remaining_amount ?? cData.amount);
            setAmount(rem.toString());
        } catch (err) {
            setError(err.message || t("messages.loadError"));
            toast.error(t("messages.loadError"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (creditId) {
            loadData();
        }
    }, [creditId]);

    const isMoneyIn = credit?.direction === "in";

    const handleReceivePayment = async (e) => {
        e.preventDefault();

        if (!moneyAccountId) {
            toast.error(
                isMoneyIn
                    ? t("messages.selectPaymentAccount")
                    : t("messages.selectReceivingAccount")
            );
            return;
        }

        const orig = Number(credit?.amount || 0);
        const rem = Number(credit?.remaining_amount ?? orig);
        const targetAmount = receiveFull ? rem : Number(amount);

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
            await fetchApi(
                `/api/v1/dashboard/money/credits/${creditId}/payments`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        moneyAccountId,
                        amount: receiveFull ? undefined : targetAmount,
                        full: receiveFull,
                        notes: notes.trim() || null,
                    }),
                }
            );

            toast.success(
                isMoneyIn
                    ? t("messages.paymentSuccess")
                    : t("messages.receiveSuccess")
            );

            setNotes("");
            setMoneyAccountId("");
            loadData();
        } catch (err) {
            toast.error(err.message || t("messages.processFailed"));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse p-8">
                <div className="h-64 bg-(--card) rounded-xl" />
            </div>
        );
    }

    if (error || !credit) {
        return (
            <div className="p-12 text-center bg-(--card) border border-(--border) rounded-xl space-y-4">
                <AlertCircle className="w-10 h-10 text-(--destructive) mx-auto" />
                <p className="text-sm font-semibold">{error || t("notFound")}</p>
                <Link
                    href="/dashboard/money/credits"
                    className="inline-block px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-sm"
                >
                    {t("backToCredits")}
                </Link>
            </div>
        );
    }

    const orig = Number(credit.amount || 0);
    const rem = Number(credit.remaining_amount ?? orig);
    const received = orig - rem;
    const isPaid = rem <= 0 || credit.status === "paid";
    const dueDate = credit.due_date;
    const createdAt = credit.created_at;
    const updatedAt = credit.updated_at;

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-6 border-b border-(--border)">
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/money/credits"
                        className="p-2 border border-(--border) rounded-lg hover:bg-(--muted) transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>

                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">
                                {credit.customer_name || credit.name}
                            </h1>

                            <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${isPaid
                                        ? "bg-(--success)/10 text-(--success)"
                                        : "bg-(--primary)/10 text-(--primary)"
                                    }`}
                            >
                                {credit.status ? creditsT(`statuses.${credit.status}`) : creditsT("statuses.pending")}
                            </span>
                        </div>

                        <p className="text-sm text-(--muted-foreground) mt-0.5">
                            {isMoneyIn ? t("moneyInSub") : t("moneyOutSub")}
                        </p>
                    </div>
                </div>
            </div>

            {/* Credit Information */}
            <div className="bg-(--card) border border-(--border) rounded-xl p-5 space-y-4 shadow-xs">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">
                    {t("info.title")}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {/* Direction */}
                    <div className="flex items-start gap-2.5">
                        <TrendingUp
                            className={`w-4 h-4 mt-0.5 ${isMoneyIn
                                    ? "text-(--success)"
                                    : "text-(--destructive)"
                                }`}
                        />

                        <div>
                            <span className="text-xs text-(--muted-foreground) block">
                                {t("info.direction")}
                            </span>

                            <span
                                className={`font-medium ${isMoneyIn
                                        ? "text-(--success)"
                                        : "text-(--destructive)"
                                    }`}
                            >
                                {isMoneyIn ? creditsT("moneyIn") : creditsT("moneyOut")}
                            </span>
                        </div>
                    </div>

                    {/* Created By */}
                    <div className="flex items-start gap-2.5">
                        <User className="w-4 h-4 text-(--muted-foreground) mt-0.5" />

                        <div>
                            <span className="text-xs text-(--muted-foreground) block">
                                {t("info.createdBy")}
                            </span>

                            <span className="font-medium">
                                {credit.created_by_name || t("info.systemUser")}
                            </span>
                        </div>
                    </div>

                    {/* Due Date */}
                    <div className="flex items-start gap-2.5">
                        <Calendar className="w-4 h-4 text-(--muted-foreground) mt-0.5" />

                        <div>
                            <span className="text-xs text-(--muted-foreground) block">
                                {t("info.dueDate")}
                            </span>

                            <span className="font-medium">
                                {dueDate
                                    ? `${dayjs(dueDate).format("DD/MM/YYYY")} (${dayjs(dueDate).fromNow()})`
                                    : t("info.noDueDate")}
                            </span>
                        </div>
                    </div>

                    {/* Created At */}
                    <div className="flex items-start gap-2.5">
                        <Clock className="w-4 h-4 text-(--muted-foreground) mt-0.5" />

                        <div>
                            <span className="text-xs text-(--muted-foreground) block">
                                {t("info.createdAt")}
                            </span>

                            <span className="font-medium">
                                {createdAt
                                    ? `${dayjs(createdAt).format("DD/MM/YYYY HH:mm")} (${dayjs(createdAt).fromNow()})`
                                    : t("info.na")}
                            </span>
                        </div>
                    </div>

                    {/* Updated At */}
                    <div className="flex items-start gap-2.5">
                        <Clock className="w-4 h-4 text-(--muted-foreground) mt-0.5" />

                        <div>
                            <span className="text-xs text-(--muted-foreground) block">
                                {t("info.lastUpdated")}
                            </span>

                            <span className="font-medium">
                                {updatedAt
                                    ? `${dayjs(updatedAt).format("DD/MM/YYYY HH:mm")} (${dayjs(updatedAt).fromNow()})`
                                    : t("info.na")}
                            </span>
                        </div>
                    </div>
                </div>

                {credit.description && (
                    <div className="pt-3 border-t border-(--border) flex items-start gap-2.5">
                        <FileText className="w-4 h-4 text-(--muted-foreground) mt-0.5" />

                        <div>
                            <span className="text-xs text-(--muted-foreground) block">
                                {t("info.description")}
                            </span>

                            <p className="text-sm text-(--foreground) mt-0.5">
                                {credit.description}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Amount Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-(--card) border border-(--border) rounded-xl p-4 space-y-1">
                    <span className="text-xs uppercase font-semibold text-(--muted-foreground)">
                        {t("summary.original")}
                    </span>

                    <p className="text-xl font-bold">
                        {orig.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}{" "}
                        <span className="text-xs font-normal">{t("summary.etb")}</span>
                    </p>
                </div>

                <div className="bg-(--card) border border-(--border) rounded-xl p-4 space-y-1">
                    <span className="text-xs uppercase font-semibold text-(--muted-foreground)">
                        {isMoneyIn ? t("summary.received") : t("summary.returned")}
                    </span>

                    <p className="text-xl font-bold text-(--success)">
                        {received.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}{" "}
                        <span className="text-xs font-normal">{t("summary.etb")}</span>
                    </p>
                </div>

                <div className="bg-(--card) border border-(--border) rounded-xl p-4 space-y-1">
                    <span className="text-xs uppercase font-semibold text-(--muted-foreground)">
                        {t("summary.remaining")}
                    </span>

                    <p className="text-xl font-bold text-(--destructive)">
                        {rem.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}{" "}
                        <span className="text-xs font-normal">{t("summary.etb")}</span>
                    </p>
                </div>
            </div>

            {/* Payment Form */}
            {!isPaid && (
                <div className="bg-(--card) border border-(--border) rounded-xl p-6 shadow-xs space-y-6">
                    <h2 className="text-base font-semibold">
                        {isMoneyIn
                            ? t("paymentForm.makePayment")
                            : t("paymentForm.receivePayment")}
                    </h2>

                    <form onSubmit={handleReceivePayment} className="space-y-4">
                        {/* Account */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">
                                {isMoneyIn
                                    ? t("paymentForm.paymentAccount")
                                    : t("paymentForm.receivingAccount")}
                            </label>

                            <select
                                value={moneyAccountId}
                                onChange={(e) => setMoneyAccountId(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                            >
                                <option value="">{t("paymentForm.selectAccount")}</option>

                                {accounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name} ({acc.type})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Full payment */}
                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="receive_full"
                                checked={receiveFull}
                                onChange={(e) => setReceiveFull(e.target.checked)}
                                className="rounded border-(--border) text-(--primary) focus:ring-(--ring)"
                            />

                            <label htmlFor="receive_full" className="text-sm font-medium">
                                {isMoneyIn
                                    ? t("paymentForm.payFull", { amount: rem.toLocaleString() })
                                    : t("paymentForm.receiveFull", { amount: rem.toLocaleString() })}
                            </label>
                        </div>

                        {/* Partial amount */}
                        {!receiveFull && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">
                                    {isMoneyIn
                                        ? t("paymentForm.paymentAmount")
                                        : t("paymentForm.receivedAmount")}
                                </label>

                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={rem}
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                                />
                            </div>
                        )}

                        {/* Notes */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">
                                {t("paymentForm.notes")}
                            </label>

                            <textarea
                                rows="2"
                                placeholder={t("paymentForm.notesPlaceholder")}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                            />
                        </div>

                        {/* Submit */}
                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-sm font-medium hover:opacity-95 transition-opacity disabled:opacity-50"
                            >
                                {isSubmitting
                                    ? t("paymentForm.processing")
                                    : isMoneyIn
                                        ? t("paymentForm.submitPayment")
                                        : t("paymentForm.submitReceive")}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Payment History */}
            <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                <h3 className="text-base font-semibold">{t("history.title")}</h3>

                {(!credit.payments && !credit.history) ||
                    (credit.payments || credit.history || []).length === 0 ? (
                    <p className="text-xs text-(--muted-foreground) py-4 text-center">
                        {t("history.noRecords")}
                    </p>
                ) : (
                    <div className="space-y-3">
                        {(credit.payments || credit.history || []).map((pay, i) => {
                            const payDate = pay.created_at || pay.date;

                            return (
                                <div
                                    key={i}
                                    className="flex items-center justify-between p-3 rounded-lg border border-(--border) bg-(--muted)/20"
                                >
                                    <div>
                                        <p className="text-sm font-medium">
                                            {Number(pay.amount).toLocaleString()}{" "}
                                            {t("history.etb")} {t("history.to")}{" "}
                                            <span className="text-(--primary)">
                                                {pay.money_account?.name || t("history.account")}
                                            </span>
                                        </p>

                                        <p className="text-xs text-(--muted-foreground)">
                                            {pay.notes || t("history.noNotes")}{" "}
                                            •{" "}
                                            {payDate
                                                ? `${dayjs(payDate).format("DD/MM/YYYY")} (${dayjs(payDate).fromNow()})`
                                                : ""}
                                        </p>
                                    </div>

                                    <CheckCircle2 className="w-5 h-5 text-(--success)" />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Back */}
            <div className="flex justify-end">
                <Link
                    href="/dashboard/money/credits"
                    className="px-4 py-2 border border-(--border) rounded-lg text-sm font-medium hover:bg-(--muted) transition-colors"
                >
                    {t("backToCredits")}
                </Link>
            </div>
        </div>
    );
}