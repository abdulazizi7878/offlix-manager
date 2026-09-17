// file: app/dashboard/money/total-money/page.jsx

"use client";

import { useState, useEffect } from "react";
import { Wallet, Landmark, AlertCircle } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { useTranslations } from "next-intl";

export default function TotalMoneyPage() {
    const t = useTranslations("dashboard.totalMoneyPage");
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadTotalMoney() {
            try {
                const res = await fetchApi("/api/v1/dashboard/money/total-money");
                setData(res.data?.data ?? res.data ?? res);
            } catch (err) {
                setError(err.message || t("loadError"));
            } 
            finally {
                setIsLoading(false);
            }
        }
        loadTotalMoney();
    }, []);

    if (isLoading) {
        return (
            <div className="max-w-5xl mx-auto space-y-6 pb-16 animate-pulse">
                <div className="h-8 w-48 bg-(--muted) rounded-md" />
                <div className="h-48 bg-(--muted) rounded-xl" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-5xl mx-auto p-6">
                <div className="p-4 bg-(--destructive)/10 border border-(--destructive)/20 rounded-xl flex items-center gap-3 text-(--destructive)">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-semibold">{error}</p>
                </div>
            </div>
        );
    }

    const totalBalance = data?.total ?? 0;
    const accounts = Array.isArray(data?.accounts) ? data.accounts : (Array.isArray(data?.data?.accounts) ? data.data.accounts : []);

    const cashBalances = accounts.filter(acc => acc.type === "cash");
    const bankBalances = accounts.filter(acc => acc.type === "bank");

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-16">
            <div className="pb-4 border-b border-(--border)">
                <h1 className="text-xl font-bold tracking-tight">{t("title")}</h1>
                <p className="text-xs text-(--muted-foreground)">{t("subtitle")}</p>
            </div>

            {/* Main Total Balance Box */}
            <div className="bg-(--primary)/5 border border-(--primary)/20 rounded-xl p-6 space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-(--primary)">{t("actualLiquidBalance")}</span>
                <p className="text-4xl font-mono font-bold tracking-tight text-(--primary)">{Number(totalBalance).toLocaleString()} {t("birr")}</p>
                <p className="text-xs text-(--muted-foreground)">{t("balanceHelp")}</p>
            </div>

            {/* Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground) flex items-center gap-2">
                        <Wallet className="w-4 h-4" /> {t("cashBalances")}
                    </h2>
                    {cashBalances.length === 0 ? (
                        <p className="text-xs text-(--muted-foreground)">{t("noCashAccounts")}</p>
                    ) : (
                        <div className="divide-y divide-(--border)">
                            {cashBalances.map((acc, idx) => (
                                <div key={acc.id || idx} className="py-2.5 flex items-center justify-between text-sm">
                                    <span>{acc.name}</span>
                                    <span className="font-mono font-semibold">{Number(acc.balance).toLocaleString()} {t("birr")}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground) flex items-center gap-2">
                        <Landmark className="w-4 h-4" /> {t("bankBalances")}
                    </h2>
                    {bankBalances.length === 0 ? (
                        <p className="text-xs text-(--muted-foreground)">{t("noBankAccounts")}</p>
                    ) : (
                        <div className="divide-y divide-(--border)">
                            {bankBalances.map((acc, idx) => (
                                <div key={acc.id || idx} className="py-2.5 flex items-center justify-between text-sm">
                                    <span>{acc.name}</span>
                                    <span className="font-mono font-semibold">{Number(acc.balance).toLocaleString()} {t("birr")}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Account By Account Breakdown */}
            <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("accountDetails")}</h2>
                {accounts.length === 0 ? (
                    <p className="text-xs text-(--muted-foreground)">{t("noAccounts")}</p>
                ) : (
                    <div className="divide-y divide-(--border)">
                        {accounts.map((acc) => (
                            <div key={acc.id} className="py-3 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-medium">{acc.name}</p>
                                    <p className="text-xs text-(--muted-foreground) uppercase">{acc.type} • {acc.branchName || t("ownerAccount")}</p>
                                </div>
                                <span className="text-sm font-mono font-semibold">{Number(acc.balance).toLocaleString()} {t("birr")}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}