// file: app/dashboard/sales/page.jsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart, Plus, AlertCircle, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api/client";

export default function SalesOverviewPage() {
    const [sales, setSales] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadSales() {
            try {
                const res = await fetchApi("/api/v1/dashboard/sales");
                setSales(res.data?.sales || res.data || res);
            } catch (err) {
                setError(err.message || "Failed to load sales.");
            } finally {
                setIsLoading(false);
            }
        }
        loadSales();
    }, []);

    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-pulse">
                <div className="flex justify-between pb-4 border-b border-(--border)">
                    <div className="h-8 w-40 bg-(--muted) rounded-md" />
                    <div className="h-8 w-28 bg-(--muted) rounded-md" />
                </div>
                <div className="h-64 bg-(--muted) rounded-xl" />
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
            <div className="flex items-center justify-between pb-4 border-b border-(--border)">
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Sales Overview</h1>
                    <p className="text-xs text-(--muted-foreground)">Track business sales, payment statuses, and customer transactions.</p>
                </div>
                <Link
                    href="/dashboard/sales/create"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-(--primary) text-(--primary-foreground) rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Sale</span>
                </Link>
            </div>

            {sales.length === 0 ? (
                <div className="bg-(--card) border border-(--border) rounded-xl p-12 text-center space-y-3">
                    <ShoppingCart className="w-10 h-10 mx-auto text-(--muted-foreground)" />
                    <h2 className="text-sm font-semibold">No sales recorded yet</h2>
                    <p className="text-xs text-(--muted-foreground)">Create your first sale to start tracking business revenue.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {sales.map((sale) => (
                        <Link
                            key={sale.id}
                            href={`/dashboard/sales/${sale.id}`}
                            className="bg-(--card) border border-(--border) rounded-xl p-4 flex items-center justify-between hover:border-(--primary) transition-all shadow-xs"
                        >
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold">{sale.customerName || sale.customer_name || "Walk-in Customer"}</span>
                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full uppercase ${sale.paymentStatus === 'paid' || sale.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                        {sale.paymentStatus || sale.payment_status}
                                    </span>
                                </div>
                                <p className="text-xs font-mono text-(--muted-foreground)">Branch: {sale.branchName || sale.branch_name || "N/A"} • {new Date(sale.createdAt || sale.created_at).toLocaleString()}</p>
                            </div>
                            <span className="text-base font-mono font-bold text-(--primary)">{Number(sale.totalAmount || sale.total_amount || 0).toLocaleString()} birr</span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}