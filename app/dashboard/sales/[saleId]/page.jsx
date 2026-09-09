// file: app/dashboard/sales/[saleId]/page.jsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    AlertCircle,
    Printer,
    Building2,
    User,
    Calendar,
    FileText,
} from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function SaleDetailPage() {
    const params = useParams();
    const router = useRouter();
    const saleId = params.saleId;

    const [sale, setSale] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadSaleDetail() {
            if (!saleId) return;
            try {
                const response = await fetchApi(`/api/v1/dashboard/sales/${saleId}`);
                setSale(response.data || response);
            } catch (err) {
                setError(err.message || "Failed to load sale details.");
            } finally {
                setIsLoading(false);
            }
        }

        loadSaleDetail();
    }, [saleId]);

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
                    <ArrowLeft className="w-4 h-4" /> Back to Sales
                </Link>
                <div className="p-4 bg-(--destructive)/10 border border-(--destructive)/20 rounded-xl flex items-center gap-3 text-(--destructive)">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-semibold">{error || "Sale not found."}</p>
                </div>
            </div>
        );
    }

    const id = sale.id || sale._id;
    const dateStr = sale.createdAt || sale.created_at || sale.date;

    const branchName = sale.branch_name || sale.branchName || sale.branch?.name || "—";
    const employeeName = sale.employee_name || sale.employeeName || sale.employee?.name || sale.employee?.username || "—";
    const customerName = sale.customer_name || sale.customerName || "Walk-in Customer";
    const status = sale.payment_status || sale.paymentStatus || "paid";

    const firstPayment = sale.payments?.[0] || {};
    const paymentMethod = sale.payment_method || sale.paymentMethod || firstPayment.paymentMethod || firstPayment.payment_method || "—";

    const totalAmount = Number(sale.total_amount || sale.totalAmount || 0);
    const paidAmount = Number(sale.paid_amount || sale.paidAmount || (status === "paid" ? totalAmount : 0));
    const remainingAmount = Math.max(0, totalAmount - paidAmount);
    const notes = sale.notes || sale.note || "";
    const items = sale.items || sale.saleItems || [];

    // Day.js relative time (e.g. "3 days ago")
    const relativeTime = dateStr ? dayjs(dateStr).fromNow() : "";

    const getStatusBadge = (s) => {
        switch (s) {
            case "paid":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Paid
                    </span>
                );
            case "partial":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <Clock className="w-3 h-3" /> Partial
                    </span>
                );
            case "credit":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20">
                        <AlertCircle className="w-3 h-3" /> Credit
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
                                Sale #{String(id).slice(-8)}
                            </h1>
                            {getStatusBadge(status)}
                        </div>
                        <p className="text-xs text-(--muted-foreground)" title={dateStr ? new Date(dateStr).toLocaleString() : ""}>
                            {relativeTime} {dateStr ? `(${new Date(dateStr).toLocaleString()})` : ""}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 px-3 py-2 border border-(--border) rounded-xl text-xs font-medium hover:bg-(--muted) transition-colors"
                >
                    <Printer className="w-4 h-4" />
                    <span>Print</span>
                </button>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-(--card) border border-(--border) rounded-xl p-4 shadow-xs space-y-1">
                    <span className="text-xs font-medium text-(--muted-foreground) flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" /> Branch
                    </span>
                    <p className="text-sm font-semibold">{branchName}</p>
                </div>

                <div className="bg-(--card) border border-(--border) rounded-xl p-4 shadow-xs space-y-1">
                    <span className="text-xs font-medium text-(--muted-foreground) flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> Customer
                    </span>
                    <p className="text-sm font-semibold">{customerName}</p>
                </div>

                <div className="bg-(--card) border border-(--border) rounded-xl p-4 shadow-xs space-y-1">
                    <span className="text-xs font-medium text-(--muted-foreground) flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> Handled By (Employee)
                    </span>
                    <p className="text-sm font-semibold">{employeeName}</p>
                </div>
            </div>

            {/* Items Table */}
            <div className="bg-(--card) border border-(--border) rounded-xl shadow-xs overflow-hidden space-y-4">
                <div className="p-4 border-b border-(--border)">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground)">
                        Purchased Items
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-(--border) bg-(--muted)/30 text-xs font-medium text-(--muted-foreground)">
                                <th className="py-3 px-4">Product</th>
                                <th className="py-3 px-4 text-right">Quantity</th>
                                <th className="py-3 px-4 text-right">Price per Item</th>
                                <th className="py-3 px-4 text-right">Line Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-(--border) text-sm">
                            {items.map((item, idx) => {
                                const productName = item.productName || item.product_name || item.product?.name || item.name || "Product";
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
                                            {Number(price).toLocaleString()} birr
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono font-semibold text-xs">
                                            {Number(lineTotal).toLocaleString()} birr
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-(--border) bg-(--muted)/10 flex flex-col items-end space-y-1">
                    <div className="text-xs text-(--muted-foreground)">
                        Sale Total Amount:
                    </div>
                    <div className="text-xl font-mono font-bold text-(--primary)">
                        {totalAmount.toLocaleString()} birr
                    </div>
                </div>
            </div>

            {/* Payment Summary & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-(--card) border border-(--border) rounded-xl p-6 shadow-xs space-y-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground)">
                        Payment Breakdown
                    </h2>

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-1 border-b border-(--border)">
                            <span className="text-(--muted-foreground)">Payment Status:</span>
                            <span className="font-semibold capitalize">{status}</span>
                        </div>
                        {status !== "credit" && (
                            <div className="flex justify-between py-1 border-b border-(--border)">
                                <span className="text-(--muted-foreground)">Payment Method:</span>
                                <span className="font-semibold uppercase">{paymentMethod}</span>
                            </div>
                        )}
                        <div className="flex justify-between py-1 border-b border-(--border)">
                            <span className="text-(--muted-foreground)">Amount Paid:</span>
                            <span className="font-mono font-semibold text-emerald-500">
                                {paidAmount.toLocaleString()} birr
                            </span>
                        </div>
                        {status !== "paid" && (
                            <div className="flex justify-between py-1">
                                <span className="text-(--muted-foreground)">Remaining Balance:</span>
                                <span className="font-mono font-semibold text-rose-500">
                                    {remainingAmount.toLocaleString()} birr
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {notes && (
                    <div className="bg-(--card) border border-(--border) rounded-xl p-6 shadow-xs space-y-3">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground) flex items-center gap-1.5">
                            <FileText className="w-4 h-4" /> Notes
                        </h2>
                        <p className="text-sm text-(--muted-foreground) whitespace-pre-wrap">
                            {notes}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}