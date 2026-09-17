// File: app/dashboard/products/purchases/[purchaseId]/page.jsx
"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle, ShoppingCart, Clock } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { useTranslations } from "next-intl";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function PurchaseDetailPage({ params }) {
    const t = useTranslations("dashboard.purchaseDetail");

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
                    productName: detail.product_name ?? detail.productName ?? detail.product?.name,
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
                setError(err.message || t("loadError"));
            } finally {
                setIsLoading(false);
            }
        }
        if (purchaseId) {
            fetchDetail();
        }
    }, [purchaseId, t]);

    return (
        <div className="space-y-6 pb-16 max-w-3xl mx-auto">
            <div className="flex items-center gap-4 pb-4 border-b border-[var(--border)]">
                <Link
                    href="/dashboard/products/purchases"
                    className="p-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] text-[var(--foreground)] transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">{t("title")}</h1>
                </div>
            </div>

            {isLoading ? (
                <div className="p-12 flex justify-center items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
                </div>
            ) : error ? (
                <div className="p-4 bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 rounded-xl flex items-center gap-3 text-[var(--destructive)]">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-semibold">{error}</p>
                </div>
            ) : purchase ? (
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-6 shadow-xs">
                    <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                                <ShoppingCart className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base text-[var(--foreground)]">{purchase.productName || "N/A"}</h3>
                            </div>
                        </div>
                        <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-[var(--muted)] text-[var(--foreground)]">
                            {purchase.paymentSource || "N/A"}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-[var(--border)] text-sm">
                        <div>
                            <p className="text-xs text-[var(--muted-foreground)]">{t("branchLocation")}</p>
                            <p className="font-medium text-[var(--foreground)] mt-0.5">{purchase.branchName || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-[var(--muted-foreground)]">{t("acquisitionDate")}</p>
                            <div className="font-medium text-[var(--foreground)] mt-0.5 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                                <span>{purchase.createdAt ? dayjs(purchase.createdAt).format("YYYY-MM-DD HH:mm") : "N/A"}</span>
                                {purchase.createdAt && (
                                    <span className="text-xs text-[var(--muted-foreground)]">
                                        ({dayjs(purchase.createdAt).fromNow()})
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pb-4 border-b border-[var(--border)] font-mono">
                        <div className="bg-[var(--muted)]/30 p-4 rounded-xl">
                            <p className="text-[11px] text-[var(--muted-foreground)] uppercase tracking-wider">{t("quantity")}</p>
                            <p className="text-xl font-bold mt-1 text-[var(--foreground)]">{purchase.quantity}</p>
                        </div>
                        <div className="bg-[var(--muted)]/30 p-4 rounded-xl">
                            <p className="text-[11px] text-[var(--muted-foreground)] uppercase tracking-wider">{t("costPrice")}</p>
                            <p className="text-xl font-bold mt-1 text-[var(--foreground)]">
                                {purchase.costPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
                            </p>
                        </div>
                        <div className="bg-[var(--muted)]/30 p-4 rounded-xl">
                            <p className="text-[11px] text-[var(--muted-foreground)] uppercase tracking-wider">{t("totalCost")}</p>
                            <p className="text-xl font-bold mt-1 text-[var(--primary)]">
                                {purchase.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2 pb-4 border-b border-[var(--border)]">
                        <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">{t("notes")}</p>
                        <p className="text-sm bg-[var(--muted)]/20 p-4 rounded-xl border border-[var(--border)] text-[var(--foreground)]">
                            {purchase.notes || t("noNotes")}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-[var(--muted-foreground)] pt-1">
                        <div>
                            {t("createdBy")}: <span className="font-medium text-[var(--foreground)]">{purchase.createdBy || "System"}</span>
                            {purchase.createdByUserEmail && <span className="text-[var(--muted-foreground)] ml-1">({purchase.createdByUserEmail})</span>}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-12 text-center text-[var(--muted-foreground)]">{t("notFound")}</div>
            )}
        </div>
    );
}