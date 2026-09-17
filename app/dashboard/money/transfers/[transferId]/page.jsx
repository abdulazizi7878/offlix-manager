"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { RefreshCw, ArrowLeft, AlertCircle, Calendar } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function TransferDetailsPage() {
    const t = useTranslations("dashboard.transferDetailsPage");
    const params = useParams();
    const transferId = params?.transferId;

    const [transfer, setTransfer] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadTransfer = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetchApi(`/api/v1/dashboard/money/transfers/${transferId}`);
                const transferData = res.data?.data ?? res.data ?? res;
                setTransfer(transferData);
            } catch (err) {
                setError(err.message || t("messages.loadError"));
                toast.error(t("messages.loadError"));
            } finally {
                setIsLoading(false);
            }
        };
        if (transferId) loadTransfer();
    }, [transferId]);

    if (isLoading) {
        return <div className="space-y-6 animate-pulse p-8"><div className="h-64 bg-(--card) rounded-xl" /></div>;
    }

    if (error || !transfer) {
        return (
            <div className="p-12 text-center bg-(--card) border border-(--border) rounded-xl space-y-4">
                <AlertCircle className="w-10 h-10 text-(--destructive) mx-auto" />
                <p className="text-sm font-semibold">{error || t("notFound")}</p>
                <Link href="/dashboard/money/transfers" className="inline-block px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-sm">
                    {t("backToTransfers")}
                </Link>
            </div>
        );
    }

    const transferDate = transfer.created_at || transfer.date;

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-between pb-6 border-b border-(--border)">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/money/transfers" className="p-2 border border-(--border) rounded-lg hover:bg-(--muted) transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
                        <p className="text-sm text-(--muted-foreground)">{t("subtitle")}</p>
                    </div>
                </div>
            </div>

            <div className="bg-(--card) border border-(--border) rounded-xl p-6 shadow-xs space-y-6">
                <div className="flex items-center justify-between p-4 bg-(--muted)/30 rounded-lg border border-(--border)">
                    <div>
                        <span className="text-xs uppercase font-semibold text-(--muted-foreground)">{t("transferAmount")}</span>
                        <p className="text-3xl font-bold mt-1">
                            {Number(transfer.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-normal text-(--muted-foreground)">{t("etb")}</span>
                        </p>
                    </div>
                    <div className="p-3 bg-(--primary)/10 text-(--primary) rounded-xl">
                        <RefreshCw className="w-8 h-8" />
                    </div>
                </div>

                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between py-3 border-b border-(--border)">
                        <span className="text-xs uppercase font-semibold text-(--muted-foreground)">{t("fromAccount")}</span>
                        <span className="text-sm font-semibold px-3 py-1 bg-(--muted) rounded-lg">
                            {transfer.from_money_account_name || transfer.from_account?.name || transfer.from_money_account?.name || t("source")}
                        </span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-(--border)">
                        <span className="text-xs uppercase font-semibold text-(--muted-foreground)">{t("toAccount")}</span>
                        <span className="text-sm font-semibold px-3 py-1 bg-(--primary)/10 text-(--primary) rounded-lg">
                            {transfer.to_money_account_name || transfer.to_account?.name || transfer.to_money_account?.name || t("destination")}
                        </span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-(--border)">
                        <span className="text-xs uppercase font-semibold text-(--muted-foreground)">{t("date")}</span>
                        <span className="text-sm font-medium flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-(--muted-foreground)" />
                            <div className="flex flex-col items-end sm:items-start">
                                <span className="font-medium text-(--foreground)" title={transferDate}>
                                    {dayjs(transferDate).fromNow()}
                                </span>
                                <span className="text-[11px] text-(--muted-foreground)">
                                    {new Date(transferDate).toLocaleDateString()}
                                </span>
                            </div>
                        </span>
                    </div>
                    <div className="space-y-1.5 py-3">
                        <span className="text-xs uppercase font-semibold text-(--muted-foreground)">{t("notes")}</span>
                        <p className="text-sm p-3 bg-(--muted)/20 rounded-lg border border-(--border)">
                            {transfer.notes || t("noNotes")}
                        </p>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-(--border)">
                    <Link href="/dashboard/money/transfers" className="px-4 py-2 border border-(--border) rounded-lg text-sm font-medium hover:bg-(--muted) transition-colors">
                        {t("backToTransfers")}
                    </Link>
                </div>
            </div>
        </div>
    );
}