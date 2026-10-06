"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    AlertCircle,
    Printer,
    Building2,
    User,
    FileText,
    PlusCircle,
    Loader2,
    CreditCard,
    History,
} from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function SaleDetailPage() {
    const t = useTranslations("dashboard.saleDetailPage");
    const params = useParams();
    const saleId = params.saleId;

    const [sale, setSale] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Receive Payment State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
    const [paymentError, setPaymentError] = useState("");

    useEffect(() => {
        async function loadSaleDetail() {
            if (!saleId) return;
            try {
                const response = await fetchApi(`/api/v1/dashboard/sales/${saleId}`);
                setSale(response.data || response);
            } catch (err) {
                setError(err.message || t("messages.loadError"));
            } finally {
                setIsLoading(false);
            }
        }

        loadSaleDetail();
    }, [saleId, t]);

    const handleOpenPaymentModal = () => {
        const total = Number(sale?.total_amount || sale?.totalAmount || 0);
        const paid = Number(sale?.paid_amount || sale?.paidAmount || 0);
        const remaining = Math.max(0, total - paid);

        setPaymentAmount(remaining.toString());
        setPaymentMethod("cash");
        setPaymentError("");
        setIsPaymentModalOpen(true);
    };

    const handleClosePaymentModal = () => {
        if (isSubmittingPayment) return;
        setIsPaymentModalOpen(false);
        setPaymentError("");
    };

    const handleReceivePaymentSubmit = async (e) => {
        e.preventDefault();
        setPaymentError("");

        const amountNum = Number(paymentAmount);
        const total = Number(sale?.total_amount || sale?.totalAmount || 0);
        const paid = Number(sale?.paid_amount || sale?.paidAmount || 0);
        const remaining = Math.max(0, total - paid);

        if (isNaN(amountNum) || amountNum <= 0) {
            setPaymentError(t("paymentModal.errors.invalidAmount"));
            return;
        }

        if (amountNum > remaining) {
            setPaymentError(t("paymentModal.errors.exceedsRemaining"));
            return;
        }

        setIsSubmittingPayment(true);

        try {
            await fetchApi(`/api/v1/dashboard/sales/${saleId}/payments`, {
                method: "POST",
                body: JSON.stringify({
                    amount: amountNum,
                    paymentMethod,
                }),
            });

            // Refetch updated sale details from source of truth
            const response = await fetchApi(`/api/v1/dashboard/sales/${saleId}`);
            setSale(response.data || response);

            setIsPaymentModalOpen(false);
            setPaymentAmount("");
            setPaymentError("");
        } catch (err) {
            setPaymentError(err.message || t("paymentModal.errors.submitFailed"));
        } finally {
            setIsSubmittingPayment(false);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-pulse">
                <div className="h-8 w-48 bg-(--muted) rounded-md" />
                <div className="h-96 bg-(--muted) rounded-xl" />
            </div>
        );
    }

    if (error || !sale) {
        return (
            <div className="max-w-4xl mx-auto p-6 space-y-4">
                <Link
                    href="/dashboard/sales"
                    className="inline-flex items-center gap-2 text-xs text-(--muted-foreground) hover:underline"
                >
                    <ArrowLeft className="w-4 h-4" /> {t("backToSales")}
                </Link>
                <div className="p-4 bg-(--destructive)/10 border border-(--destructive)/20 rounded-xl flex items-center gap-3 text-(--destructive)">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-semibold">{error || t("notFound")}</p>
                </div>
            </div>
        );
    }

    const id = sale.id || sale._id;
    const dateStr = sale.createdAt || sale.created_at || sale.date;

    const branchName = sale.branch_name || sale.branchName || sale.branch?.name || "—";
    const employeeName = sale.employee_name || sale.employeeName || sale.employee?.name || sale.employee?.username || "—";
    const customerName = sale.customer_name || sale.customerName || t("walkInCustomer");
    const status = sale.payment_status || sale.paymentStatus || "paid";

    const totalAmount = Number(sale.total_amount || sale.totalAmount || 0);
    const paidAmount = Number(sale.paid_amount || sale.paidAmount || (status === "paid" ? totalAmount : 0));
    const remainingAmount = Math.max(0, totalAmount - paidAmount);
    const notes = sale.notes || sale.note || "";
    const items = sale.items || sale.saleItems || [];
    const paymentsList = sale.payments || [];

    const relativeDate = dateStr ? dayjs(dateStr).fromNow() : "";

    const canReceivePayment = (status === "partial" || status === "credit") && remainingAmount > 0;

    const getStatusBadge = (s) => {
        switch (s) {
            case "paid":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> {t("status.paid")}
                    </span>
                );
            case "partial":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <Clock className="w-3 h-3" /> {t("status.partial")}
                    </span>
                );
            case "credit":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20">
                        <AlertCircle className="w-3 h-3" /> {t("status.credit")}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-(--muted) text-(--muted-foreground)">
                        {s}
                    </span>
                );
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-16">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-(--border)">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/sales"
                        className="p-2 border border-(--border) rounded-lg hover:bg-(--muted) text-(--muted-foreground) transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold font-mono">
                                {t("title", { id: String(id).slice(-8) })}
                            </h1>
                            {getStatusBadge(status)}
                        </div>
                        <p className="text-xs text-(--muted-foreground)" title={dateStr ? new Date(dateStr).toLocaleString() : ""}>
                            {relativeDate} {dateStr ? `(${new Date(dateStr).toLocaleString()})` : ""}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {canReceivePayment && (
                        <button
                            onClick={handleOpenPaymentModal}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-(--primary) text-(--primary-foreground) rounded-xl text-xs font-medium hover:opacity-90 transition-opacity"
                        >
                            <PlusCircle className="w-4 h-4" />
                            <span>{t("receivePayment")}</span>
                        </button>
                    )}

                    <button
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-2 px-3 py-2 border border-(--border) rounded-xl text-xs font-medium hover:bg-(--muted) transition-colors"
                    >
                        <Printer className="w-4 h-4" />
                        <span>{t("print")}</span>
                    </button>
                </div>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-(--card) border border-(--border) rounded-xl p-4 shadow-xs space-y-1">
                    <span className="text-xs font-medium text-(--muted-foreground) flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" /> {t("branch")}
                    </span>
                    <p className="text-sm font-semibold">{branchName}</p>
                </div>

                <div className="bg-(--card) border border-(--border) rounded-xl p-4 shadow-xs space-y-1">
                    <span className="text-xs font-medium text-(--muted-foreground) flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> {t("customer")}
                    </span>
                    <p className="text-sm font-semibold">{customerName}</p>
                </div>

                <div className="bg-(--card) border border-(--border) rounded-xl p-4 shadow-xs space-y-1">
                    <span className="text-xs font-medium text-(--muted-foreground) flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> {t("handledBy")}
                    </span>
                    <p className="text-sm font-semibold">{employeeName}</p>
                </div>
            </div>

            {/* Items Table */}
            <div className="bg-(--card) border border-(--border) rounded-xl shadow-xs overflow-hidden space-y-4">
                <div className="p-4 border-b border-(--border)">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground)">
                        {t("purchasedItems")}
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-(--border) bg-(--muted)/30 text-xs font-medium text-(--muted-foreground)">
                                <th className="py-3 px-4">{t("product")}</th>
                                <th className="py-3 px-4 text-right">{t("quantity")}</th>
                                <th className="py-3 px-4 text-right">{t("pricePerItem")}</th>
                                <th className="py-3 px-4 text-right">{t("lineTotal")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-(--border) text-sm">
                            {items.map((item, idx) => {
                                const productName = item.productName || item.product_name || item.product?.name || item.name || t("defaultProduct");
                                const qty = Number(item.quantity || 0);
                                const price = Number(item.pricePerItem || item.price_per_item || item.price || 0);
                                const lineTotal = item.totalAmount || item.total_amount || (qty * price);

                                return (
                                    <tr key={idx} className="hover:bg-(--muted)/20">
                                        <td className="py-3 px-4 font-medium text-xs">
                                            {productName}
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono text-xs">
                                            {qty}
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono text-xs">
                                            {Number(price).toLocaleString()} {t("birr")}
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono font-semibold text-xs">
                                            {Number(lineTotal).toLocaleString()} {t("birr")}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-(--border) bg-(--muted)/10 flex flex-col items-end space-y-1">
                    <div className="text-xs text-(--muted-foreground)">
                        {t("saleTotalAmount")}
                    </div>
                    <div className="text-xl font-mono font-bold text-(--primary)">
                        {totalAmount.toLocaleString()} {t("birr")}
                    </div>
                </div>
            </div>

            {/* Payment Summary & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-(--card) border border-(--border) rounded-xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground)">
                            {t("paymentBreakdown")}
                        </h2>
                        {canReceivePayment && (
                            <button
                                onClick={handleOpenPaymentModal}
                                className="text-xs text-(--primary) hover:underline font-medium inline-flex items-center gap-1"
                            >
                                <PlusCircle className="w-3.5 h-3.5" />
                                {t("receivePayment")}
                            </button>
                        )}
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-1 border-b border-(--border)">
                            <span className="text-(--muted-foreground)">{t("paymentStatus")}</span>
                            <span className="font-semibold capitalize">
                                {t(`status.${status}`, { defaultValue: status })}
                            </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-(--border)">
                            <span className="text-(--muted-foreground)">{t("saleTotalAmount")}</span>
                            <span className="font-mono font-semibold">
                                {totalAmount.toLocaleString()} {t("birr")}
                            </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-(--border)">
                            <span className="text-(--muted-foreground)">{t("amountPaid")}</span>
                            <span className="font-mono font-semibold text-emerald-500">
                                {paidAmount.toLocaleString()} {t("birr")}
                            </span>
                        </div>
                        {status !== "paid" && (
                            <div className="flex justify-between py-1">
                                <span className="text-(--muted-foreground)">{t("remainingBalance")}</span>
                                <span className="font-mono font-semibold text-rose-500">
                                    {remainingAmount.toLocaleString()} {t("birr")}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {notes && (
                    <div className="bg-(--card) border border-(--border) rounded-xl p-6 shadow-xs space-y-3">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground) flex items-center gap-1.5">
                            <FileText className="w-4 h-4" /> {t("notes")}
                        </h2>
                        <p className="text-sm text-(--muted-foreground) whitespace-pre-wrap">
                            {notes}
                        </p>
                    </div>
                )}
            </div>

            {/* Payment History Section */}
            <div className="bg-(--card) border border-(--border) rounded-xl shadow-xs overflow-hidden space-y-4">
                <div className="p-4 border-b border-(--border) flex items-center gap-2">
                    <History className="w-4 h-4 text-(--muted-foreground)" />
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground)">
                        {t("paymentHistory.title")}
                    </h2>
                </div>

                {paymentsList.length === 0 ? (
                    <div className="p-6 text-center text-xs text-(--muted-foreground)">
                        {t("paymentHistory.empty")}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-(--border) bg-(--muted)/30 text-xs font-medium text-(--muted-foreground)">
                                    <th className="py-3 px-4">{t("paymentHistory.date")}</th>
                                    <th className="py-3 px-4">{t("paymentHistory.method")}</th>
                                    <th className="py-3 px-4">{t("paymentHistory.receivedBy")}</th>
                                    <th className="py-3 px-4 text-right">{t("paymentHistory.amount")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border) text-sm">
                                {paymentsList.map((p, idx) => {
                                    const pMethod = p.paymentMethod || p.payment_method || "—";
                                    const pAmount = Number(p.amount || 0);
                                    const pUser = p.employee_name || p.employeeName || p.createdByUserName || p.created_by_user_name || p.user?.name || "—";
                                    const pDate = p.createdAt || p.created_at;

                                    return (
                                        <tr key={p.id || idx} className="hover:bg-(--muted)/20">
                                            <td className="py-3 px-4 text-xs font-mono text-(--muted-foreground)">
                                                {pDate ? dayjs(pDate).format("YYYY-MM-DD HH:mm") : "—"}
                                            </td>
                                            <td className="py-3 px-4 text-xs font-medium uppercase">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <CreditCard className="w-3.5 h-3.5 text-(--muted-foreground)" />
                                                    {pMethod}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-xs text-(--muted-foreground)">
                                                {pUser}
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono font-semibold text-xs text-emerald-500">
                                                +{pAmount.toLocaleString()} {t("birr")}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Receive Payment Modal */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="bg-(--card) border border-(--border) rounded-2xl p-6 w-full max-w-md shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b border-(--border) pb-3">
                            <h3 className="text-base font-semibold flex items-center gap-2">
                                <PlusCircle className="w-5 h-5 text-(--primary)" />
                                {t("paymentModal.title")}
                            </h3>
                            <button
                                onClick={handleClosePaymentModal}
                                disabled={isSubmittingPayment}
                                className="text-(--muted-foreground) hover:text-(--foreground) text-sm font-bold disabled:opacity-50"
                            >
                                ✕
                            </button>
                        </div>

                        {paymentError && (
                            <div className="p-3 bg-(--destructive)/10 border border-(--destructive)/20 rounded-xl flex items-center gap-2 text-xs text-(--destructive)">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{paymentError}</span>
                            </div>
                        )}

                        <form onSubmit={handleReceivePaymentSubmit} className="space-y-4">
                            <div className="p-3 bg-(--muted)/40 rounded-xl flex justify-between items-center text-xs">
                                <span className="text-(--muted-foreground)">{t("paymentModal.remainingBalance")}</span>
                                <span className="font-mono font-bold text-rose-500 text-sm">
                                    {remainingAmount.toLocaleString()} {t("birr")}
                                </span>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-(--muted-foreground)">
                                    {t("paymentModal.amountLabel")}
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={remainingAmount}
                                    disabled={isSubmittingPayment}
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-(--primary) disabled:opacity-50"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-(--muted-foreground)">
                                    {t("paymentModal.methodLabel")}
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        disabled={isSubmittingPayment}
                                        onClick={() => setPaymentMethod("cash")}
                                        className={`py-2 px-3 text-xs font-medium rounded-xl border transition-colors ${paymentMethod === "cash"
                                                ? "border-(--primary) bg-(--primary)/10 text-(--primary)"
                                                : "border-(--border) hover:bg-(--muted)/50"
                                            }`}
                                    >
                                        {t("paymentModal.methods.cash")}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isSubmittingPayment}
                                        onClick={() => setPaymentMethod("bank")}
                                        className={`py-2 px-3 text-xs font-medium rounded-xl border transition-colors ${paymentMethod === "bank"
                                                ? "border-(--primary) bg-(--primary)/10 text-(--primary)"
                                                : "border-(--border) hover:bg-(--muted)/50"
                                            }`}
                                    >
                                        {t("paymentModal.methods.bank")}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-(--border)">
                                <button
                                    type="button"
                                    disabled={isSubmittingPayment}
                                    onClick={handleClosePaymentModal}
                                    className="px-4 py-2 text-xs font-medium border border-(--border) rounded-xl hover:bg-(--muted) transition-colors disabled:opacity-50"
                                >
                                    {t("paymentModal.cancel")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingPayment}
                                    className="px-4 py-2 text-xs font-medium bg-(--primary) text-(--primary-foreground) rounded-xl hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    {isSubmittingPayment && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    <span>{t("paymentModal.submit")}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}