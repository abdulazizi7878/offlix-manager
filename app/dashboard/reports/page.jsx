// file: app/dashboard/reports/page.jsx

"use client";

import { useState, useEffect } from "react";
import { BarChart3, AlertCircle, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api/client";

export default function ReportsPage() {
    const [reportData, setReportData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadReport() {
            try {
                const res = await fetchApi("/api/v1/dashboard/reports");
                setReportData(res.data || res);
            } catch (err) {
                setError(err.message || "Failed to load business reports.");
            } finally {
                setIsLoading(false);
            }
        }
        loadReport();
    }, []);

    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-pulse">
                <div className="h-8 w-48 bg-(--muted) rounded-md" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-48 bg-(--muted) rounded-xl" />
                    <div className="h-48 bg-(--muted) rounded-xl" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-6xl mx-auto p-6">
                <div className="p-4 bg-(--destructive)/10 border border-(--destructive)/20 rounded-xl flex items-center gap-3 text-(--destructive)">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-semibold">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-16">
            <div className="pb-4 border-b border-(--border)">
                <h1 className="text-xl font-bold tracking-tight">Business Analytics & Reports</h1>
                <p className="text-xs text-(--muted-foreground)">Analyze overall business performance, sales volume, and cash flow trends.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground) flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" /> Sales Summary
                    </h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-1 border-b border-(--border)">
                            <span className="text-(--muted-foreground)">Total Revenue</span>
                            <span className="font-mono font-semibold">{Number(reportData?.totalRevenue || 0).toLocaleString()} birr</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-(--border)">
                            <span className="text-(--muted-foreground)">Total Transactions</span>
                            <span className="font-mono font-semibold">{reportData?.totalSalesCount || 0}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground) flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" /> Financial Position
                    </h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-1 border-b border-(--border)">
                            <span className="text-(--muted-foreground)">Total Liquid Assets</span>
                            <span className="font-mono font-semibold text-emerald-500">{Number(reportData?.totalLiquid || 0).toLocaleString()} birr</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-(--border)">
                            <span className="text-(--muted-foreground)">Outstanding Receivables</span>
                            <span className="font-mono font-semibold text-amber-500">{Number(reportData?.totalReceivables || 0).toLocaleString()} birr</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}