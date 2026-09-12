// File: app/dashboard/products/purchases/[purchaseId]/page.jsx
"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle, ShoppingCart, Clock } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import dayjs from "dayjs";

export default function PurchaseDetailPage({ params }) {
    const resolvedParams = use(params);
    const purchaseId = resolvedParams.purchaseId;

    const [purchase, setPurchase] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchDetail() {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetchApi(`/api/v1/dashboard/products/purchases/${purchaseId}`);
                const detail = res.data?.data || res.data;

                setPurchase({
                    ...detail,
                    productId: detail.product_id ?? detail.productId,
                    productName: detail.product_name ?? detail.productName ?? detail.product?.name,
                    branchId: detail.branch_id ?? detail.branchId,
                    branchName: detail.branch_name ?? detail.branchName ?? detail.branch?.name,
                    costPrice: Number(detail.cost_price ?? detail.costPrice ?? 0),
                    quantity: Number(detail.quantity ?? 0),
                    totalCost: Number(detail.total_cost ?? detail.totalCost ?? ((detail.quantity ?? 0) * (detail.cost_price ?? detail.costPrice ?? 0))),
                    paymentSource: detail.payment_source ?? detail.paymentSource,
                    createdBy: detail.created_by_name ?? detail.created_by ?? detail.createdBy ?? detail.user?.name,
                    createdByUserEmail: detail.created_by_email,
                    createdAt: detail.created_at ?? detail.createdAt,
                    notes: detail.notes,
                });
            } catch (err) {
                setError(err.message || "Failed to load purchase details.");
            } finally {
                setIsLoading(false);
            }
        }
        if (purchaseId) {
            fetchDetail();
        }
    }, [purchaseId]);

    return (
        <div className="space-y-6 pb-16 max-w-3xl mx-auto">
            <div className="flex items-center gap-4 pb-4 border-b border-(--border)">
                <Link
                    href="/dashboard/products/purchases"
                    className="p-2 border border-(--border) rounded-lg hover:bg-(--muted) text-(--foreground) transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Purchase Record</h1>
                    <p className="text-xs text-(--muted-foreground) font-mono">ID: {purchaseId}</p>
                </div>
            </div>

            {isLoading ? (
                <div className="p-12 flex justify-center items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-(--primary)" />
                </div>
            ) : error ? (
                <div className="p-4 bg-(--destructive)/10 border border-(--destructive)/20 rounded-xl flex items-center gap-3 text-(--destructive)">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-semibold">{error}</p>
                </div>
            ) : purchase ? (
                <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-6 shadow-xs">
                    <div className="flex items-center justify-between pb-4 border-b border-(--border)">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-(--primary)/10 text-(--primary) flex items-center justify-center">
                                <ShoppingCart className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base text-(--foreground)">{purchase.productName || "N/A"}</h3>
                                <p className="text-xs text-(--muted-foreground) font-mono">Product ID: {purchase.productId || "N/A"}</p>
                            </div>
                        </div>
                        <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-(--muted) text-(--foreground)">
                            {purchase.paymentSource || "N/A"}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-(--border) text-sm">
                        <div>
                            <p className="text-xs text-(--muted-foreground)">Branch Location</p>
                            <p className="font-medium text-(--foreground) mt-0.5">{purchase.branchName || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-(--muted-foreground)">Acquisition Date</p>
                            <p className="font-medium text-(--foreground) mt-0.5 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-(--muted-foreground)" />
                                {purchase.createdAt ? dayjs(purchase.createdAt).format("YYYY-MM-DD HH:mm") : "N/A"}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pb-4 border-b border-(--border) font-mono">
                        <div className="bg-(--muted)/30 p-4 rounded-xl">
                            <p className="text-[11px] text-(--muted-foreground) uppercase tracking-wider">Quantity</p>
                            <p className="text-xl font-bold mt-1 text-(--foreground)">{purchase.quantity}</p>
                        </div>
                        <div className="bg-(--muted)/30 p-4 rounded-xl">
                            <p className="text-[11px] text-(--muted-foreground) uppercase tracking-wider">Cost Price</p>
                            <p className="text-xl font-bold mt-1 text-(--foreground)">${purchase.costPrice.toFixed(2)}</p>
                        </div>
                        <div className="bg-(--muted)/30 p-4 rounded-xl">
                            <p className="text-[11px] text-(--muted-foreground) uppercase tracking-wider">Total Cost</p>
                            <p className="text-xl font-bold mt-1 text-(--primary)">${purchase.totalCost.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="space-y-2 pb-4 border-b border-(--border)">
                        <p className="text-xs font-semibold text-(--muted-foreground) uppercase tracking-wider">Notes / Remarks</p>
                        <p className="text-sm bg-(--muted)/20 p-4 rounded-xl border border-(--border) text-(--foreground)">
                            {purchase.notes || "No notes provided for this inventory purchase entry."}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-(--muted-foreground) pt-1">
                        <div>
                            Created by: <span className="font-medium text-(--foreground)">{purchase.createdBy || "System"}</span>
                            {purchase.createdByUserEmail && <span className="text-(--muted-foreground) ml-1">({purchase.createdByUserEmail})</span>}
                        </div>
                        <p>Purchase ID: <span className="font-mono">{purchase.id}</span></p>
                    </div>
                </div>
            ) : (
                <div className="p-12 text-center text-(--muted-foreground)">Purchase record not found.</div>
            )}
        </div>
    );
}