// file: app/dashboard/sales/[saleId]/page.jsx

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShoppingCart, AlertCircle, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api/client";

// Import Day.js and the relativeTime plugin
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

export default function SaleDetailPage() {
    const params = useParams();
    const saleId = params.saleId;

    const [sale, setSale] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadSaleDetail() {
            if (!saleId) return;
            try {
                const res = await fetchApi(`/api/v1/dashboard/sales/${saleId}`);
                setSale(res.data?.sale || res.data || res);
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
                <div className="h-64 bg-(--muted) rounded-xl" />
            </div>
        );
    }

    if (error || !sale) {
        return (
            <div className="max-w-4xl mx-auto p-6 space-y-4">
                <div className="p-4 bg-(--destructive)/10 border border-(--destructive)/20 rounded-xl flex items-center gap-3 text-(--destructive)">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-semibold">{error || "Sale not found."}</p>
                </div>
                <Link href="/dashboard/sales" className="inline-flex items-center gap-2 text-xs font-medium text-(--muted-foreground) hover:text-(--foreground)">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Sales</span>
                </Link>
            </div>
        );
    }

    const items = sale.items || [];
    const paymentStatus = sale.paymentStatus || sale.payment_status;
    const paymentMethod = sale.paymentMethod || sale.payment_method;
    const paidAmount = sale.paidAmount ?? sale.paid_amount;
    const totalAmount = Number(sale.totalAmount || sale.total_amount || 0);
    const remainingAmount = sale.remainingAmount ?? sale.remaining_amount ?? Math.max(0, totalAmount - Number(paidAmount || 0));

    const rawDate = sale.createdAt || sale.created_at;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-16">
            <div className="flex items-center justify-between pb-4 border-b border-(--border)">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/sales" className="p-2 border border-(--border) rounded-lg hover:bg-(--muted) text-(--muted-foreground) transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Sale Receipt #{sale.id?.slice(0, 8)}</h1>
                        <p className="text-xs font-mono text-(--muted-foreground)">
                            Branch: {sale.branchName || sale.branch_name || "N/A"} • {dayjs(rawDate).fromNow()} ({dayjs(rawDate).format("MMM D, YYYY h:mm A")})
                        </p>
                    </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full uppercase ${paymentStatus === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : paymentStatus === 'partial' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {paymentStatus}
                </span>
            </div>

            <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-6 shadow-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Customer</h3>
                        <p className="text-base font-medium mt-0.5">{sale.customerName || sale.customer_name || "Walk-in Customer"}</p>
                    </div>
                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Created By</h3>
                        <p className="text-base font-medium mt-0.5">{sale.employeeName || sale.employee_name || "N/A"}</p>
                    </div>
                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Payment Method</h3>
                        <p className="text-base font-medium mt-0.5 capitalize">{paymentMethod || "N/A"}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-(--border)">
                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Paid Amount</h3>
                        <p className="text-base font-mono font-medium mt-0.5 text-emerald-600">
                            {paidAmount !== undefined && paidAmount !== null ? `${Number(paidAmount).toLocaleString()} birr` : "N/A"}
                        </p>
                    </div>
                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Remaining Balance</h3>
                        <p className="text-base font-mono font-medium mt-0.5 text-amber-600">
                            {remainingAmount !== undefined && remainingAmount !== null ? `${Number(remainingAmount).toLocaleString()} birr` : "N/A"}
                        </p>
                    </div>
                </div>

                {sale.notes && (
                    <div className="pt-4 border-t border-(--border)">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Notes</h3>
                        <p className="text-sm mt-0.5 text-(--muted-foreground)">{sale.notes}</p>
                    </div>
                )}

                <div className="space-y-3 pt-4 border-t border-(--border)">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Purchased Items</h3>
                    <div className="divide-y divide-(--border)">
                        {items.map((item, idx) => (
                            <div key={idx} className="py-3 flex items-center justify-between text-sm">
                                <div>
                                    <p className="font-medium">{item.productName || item.product_name || "Product"}</p>
                                    <p className="text-xs text-(--muted-foreground)">Qty: {item.quantity} × {Number(item.pricePerItem || item.price_per_item || 0).toLocaleString()} birr</p>
                                </div>
                                <span className="font-mono font-semibold">{(Number(item.quantity) * Number(item.pricePerItem || item.price_per_item || 0)).toLocaleString()} birr</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-4 border-t border-(--border) flex items-center justify-between">
                    <span className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground)">Total Amount</span>
                    <span className="text-2xl font-mono font-bold text-(--primary)">{totalAmount.toLocaleString()} birr</span>
                </div>
            </div>
        </div>
    );
}