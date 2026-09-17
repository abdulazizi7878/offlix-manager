"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    RefreshCw,
    Landmark,
    Smartphone,
    CreditCard,
    ArrowRightLeft,
    Building2,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    Plus,
} from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";

export default function MoneyOverviewPage() {
    const t = useTranslations("dashboard.moneyOverviewPage");
    const [totalMoney, setTotalMoney] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadOverviewData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [totalRes, accountsRes, transactionsRes] = await Promise.all([
                fetchApi("/api/v1/dashboard/money/total-money"),
                fetchApi("/api/v1/dashboard/money/accounts?limit=5"),
                fetchApi("/api/v1/dashboard/money/transactions?limit=5")
            ]);

            setTotalMoney(totalRes.data || totalRes);
            setAccounts(accountsRes.data?.data ?? []);
            setTransactions(transactionsRes.data?.data ?? []);
        } catch (err) {
            setError(err.message || t("messages.loadError"));
            toast.error(t("messages.loadError"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadOverviewData();
    }, []);

    const getTypeIcon = (type) => {
        switch (type) {
            case "cash":
                return <Wallet className="w-5 h-5" />;
            case "bank":
                return <Landmark className="w-5 h-5" />;
            case "mobile_money":
                return <Smartphone className="w-5 h-5" />;
            default:
                return <CreditCard className="w-5 h-5" />;
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="flex items-center justify-between pb-6 border-b border-(--border)">
                    <div className="space-y-2">
                        <div className="h-8 w-48 bg-(--muted) rounded-lg" />
                        <div className="h-4 w-72 bg-(--muted) rounded-md" />
                    </div>
                    <div className="h-10 w-32 bg-(--muted) rounded-lg" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-32 bg-(--card) border border-(--border) rounded-xl p-6 space-y-3" />
                    ))}
                </div>
                <div className="h-64 bg-(--card) border border-(--border) rounded-xl p-6" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-(--card) border border-(--border) rounded-xl space-y-4">
                <div className="mx-auto w-12 h-12 bg-(--destructive)/10 text-(--destructive) rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold">{t("messages.unableToLoad")}</h2>
                    <p className="text-xs text-(--muted-foreground)">{error}</p>
                </div>
                <button
                    onClick={loadOverviewData}
                    className="inline-flex items-center gap-2 bg-(--primary) text-(--primary-foreground) px-4 py-2 rounded-lg font-medium text-sm hover:opacity-95 transition-opacity"
                >
                    <RefreshCw className="w-4 h-4" />
                    <span>{t("tryAgain")}</span>
                </button>
            </div>
        );
    }

    const totalAmount = totalMoney?.total ?? 0;

    const byType = (totalMoney?.byType ?? []).reduce((acc, item) => {
        acc[item.type] = Number(item.total_amount || 0);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-(--border)">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-(--primary)/10 text-(--primary) rounded-xl">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
                        <p className="text-sm text-(--muted-foreground) mt-0.5">
                            {t("subtitle")}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/dashboard/money/transactions"
                        className="inline-flex items-center justify-center gap-2 bg-(--secondary) text-(--secondary-foreground) px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
                    >
                        <ArrowRightLeft className="w-4 h-4" />
                        <span>{t("transactions")}</span>
                    </Link>
                    <Link
                        href="/dashboard/money/accounts"
                        className="inline-flex items-center justify-center gap-2 bg-(--primary) text-(--primary-foreground) px-4 py-2 rounded-lg font-medium text-sm hover:opacity-95 transition-opacity"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{t("manageAccounts")}</span>
                    </Link>
                </div>
            </div>

            {/* Total Money Hero Card */}
            <div className="bg-gradient-to-br from-(--primary)/15 via-(--card) to-(--card) border border-(--border) rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
                <div className="absolute right-6 top-6 opacity-10 text-(--primary)">
                    <Wallet className="w-32 h-32" />
                </div>
                <div className="relative z-10 space-y-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("totalLiquidMoney")}</p>
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1 text-(--foreground)">
                            {Number(totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-lg font-normal text-(--muted-foreground)">{t("etb")}</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-(--border)/60">
                        <div className="space-y-1">
                            <span className="text-xs text-(--muted-foreground)">{t("cash")}</span>
                            <p className="text-lg font-semibold">
                                {Number(byType.cash || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-(--muted-foreground)">{t("etb")}</span>
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-(--muted-foreground)">{t("bankAccounts")}</span>
                            <p className="text-lg font-semibold">
                                {Number(byType.bank || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-(--muted-foreground)">{t("etb")}</span>
                            </p>
                        </div>
                        <div className="space-y-1 col-span-2 sm:col-span-1">
                            <span className="text-xs text-(--muted-foreground)">{t("mobileMoney")}</span>
                            <p className="text-lg font-semibold">
                                {Number(byType.mobile_money || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-(--muted-foreground)">{t("etb")}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Links / Modules Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                <Link href="/dashboard/money/accounts" className="p-4 bg-(--card) border border-(--border) rounded-xl hover:border-(--primary) transition-all space-y-2 group text-center flex flex-col items-center justify-center">
                    <div className="p-2.5 bg-(--primary)/10 text-(--primary) rounded-xl group-hover:scale-110 transition-transform">
                        <Wallet className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold">{t("modules.accounts")}</span>
                </Link>
                <Link href="/dashboard/money/transactions" className="p-4 bg-(--card) border border-(--border) rounded-xl hover:border-(--primary) transition-all space-y-2 group text-center flex flex-col items-center justify-center">
                    <div className="p-2.5 bg-(--primary)/10 text-(--primary) rounded-xl group-hover:scale-110 transition-transform">
                        <ArrowRightLeft className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold">{t("modules.transactions")}</span>
                </Link>
                <Link href="/dashboard/money/transfers" className="p-4 bg-(--card) border border-(--border) rounded-xl hover:border-(--primary) transition-all space-y-2 group text-center flex flex-col items-center justify-center">
                    <div className="p-2.5 bg-(--primary)/10 text-(--primary) rounded-xl group-hover:scale-110 transition-transform">
                        <RefreshCw className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold">{t("modules.transfers")}</span>
                </Link>
                <Link href="/dashboard/money/settlements" className="p-4 bg-(--card) border border-(--border) rounded-xl hover:border-(--primary) transition-all space-y-2 group text-center flex flex-col items-center justify-center">
                    <div className="p-2.5 bg-(--primary)/10 text-(--primary) rounded-xl group-hover:scale-110 transition-transform">
                        <Building2 className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold">{t("modules.settlements")}</span>
                </Link>
                <Link href="/dashboard/money/payables" className="p-4 bg-(--card) border border-(--border) rounded-xl hover:border-(--primary) transition-all space-y-2 group text-center flex flex-col items-center justify-center">
                    <div className="p-2.5 bg-(--primary)/10 text-(--primary) rounded-xl group-hover:scale-110 transition-transform">
                        <TrendingDown className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold">{t("modules.payables")}</span>
                </Link>
                <Link href="/dashboard/money/credits" className="p-4 bg-(--card) border border-(--border) rounded-xl hover:border-(--primary) transition-all space-y-2 group text-center flex flex-col items-center justify-center">
                    <div className="p-2.5 bg-(--primary)/10 text-(--primary) rounded-xl group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold">{t("modules.credits")}</span>
                </Link>
            </div>

            {/* Split Section: Accounts & Recent Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Money Accounts Preview */}
                <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold">{t("moneyAccounts")}</h3>
                        <Link href="/dashboard/money/accounts" className="text-xs text-(--primary) font-medium hover:underline">
                            {t("viewAll")}
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {accounts.length === 0 ? (
                            <p className="text-xs text-(--muted-foreground) py-6 text-center">{t("noAccounts")}</p>
                        ) : (
                            accounts.map((acc) => (
                                <div key={acc.id} className="flex items-center justify-between p-3 rounded-lg border border-(--border) hover:bg-(--muted)/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-(--primary)/10 text-(--primary) rounded-lg">
                                            {getTypeIcon(acc.type)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{acc.name}</p>
                                            <p className="text-xs text-(--muted-foreground) capitalize">{acc.type.replace("_", " ")}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold">
                                            {Number(acc.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-(--muted-foreground)">{t("etb")}</span>
                                        </p>
                                        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${acc.status === "active" !== false ? "bg-(--success)/10 text-(--success)" : "bg-(--muted) text-(--muted-foreground)"}`}>
                                            {acc.status === "active" !== false ? t("active") : t("inactive")}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Transactions Preview */}
                <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold">{t("recentTransactions")}</h3>
                        <Link href="/dashboard/money/transactions" className="text-xs text-(--primary) font-medium hover:underline">
                            {t("viewAll")}
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {transactions.length === 0 ? (
                            <p className="text-xs text-(--muted-foreground) py-6 text-center">{t("noTransactions")}</p>
                        ) : (
                            transactions.map((tx) => {
                                const isIn = tx.direction === "in" || tx.type === "income" || tx.type === "deposit";
                                return (
                                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border border-(--border) hover:bg-(--muted)/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${isIn ? "bg-(--success)/10 text-(--success)" : "bg-(--destructive)/10 text-(--destructive)"}`}>
                                                {isIn ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{tx.description || tx.type}</p>
                                                <p className="text-xs text-(--muted-foreground)">
                                                    {tx.money_account_name || t("account")} • {new Date(tx.created_at || tx.date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-semibold ${isIn ? "text-(--success)" : "text-(--destructive)"}`}>
                                                {isIn ? "+" : "-"}{Number(tx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal">{t("etb")}</span>
                                            </p>
                                            <span className="text-[10px] text-(--muted-foreground) uppercase">{tx.type}</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}