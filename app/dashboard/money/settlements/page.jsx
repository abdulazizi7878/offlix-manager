// file: app/dashboard/money/settlements/page.jsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Building2, Search, AlertCircle, CheckCircle2 } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";

export default function SettlementsPage() {
    const [settlements, setSettlements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadSettlements = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetchApi("/api/v1/dashboard/money/settlements");

            // Handle pagination and nested data structure: { success: true, data: { data: [], pagination: {} } }
            const responseData = res.data?.data ?? res.data ?? {};
            const settlementsList = Array.isArray(responseData)
                ? responseData
                : (responseData.data ?? res.data?.settlements ?? []);

            setSettlements(settlementsList);
        } catch (err) {
            setError(err.message || "Failed to load settlements.");
            toast.error("Failed to load settlements");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSettlements();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-(--border)">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-(--primary)/10 text-(--primary) rounded-xl">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Branch Settlements</h1>
                        <p className="text-sm text-(--muted-foreground) mt-0.5">
                            Manage revenue settlements requested by branches into central money systems.
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-(--destructive)/10 border border-(--destructive)/20 rounded-xl flex items-center justify-between text-(--destructive)">
                    <span className="text-sm font-medium">{error}</span>
                    <button onClick={loadSettlements} className="px-3 py-1.5 bg-(--background) border border-(--border) text-xs rounded-lg font-medium">Retry</button>
                </div>
            )}

            {isLoading && (
                <div className="space-y-4 animate-pulse">
                    <div className="h-64 bg-(--card) border border-(--border) rounded-xl" />
                </div>
            )}

            {!isLoading && !error && settlements.length === 0 && (
                <div className="p-12 text-center bg-(--card) border border-(--border) rounded-xl space-y-4">
                    <div className="mx-auto w-12 h-12 bg-(--muted) text-(--muted-foreground) rounded-full flex items-center justify-center">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div className="max-w-sm mx-auto space-y-1">
                        <h2 className="text-lg font-semibold">No settlements found</h2>
                        <p className="text-xs text-(--muted-foreground)">Branch settlements will appear here when requested.</p>
                    </div>
                </div>
            )}

            {!isLoading && !error && settlements.length > 0 && (
                <div className="bg-(--card) border border-(--border) rounded-xl shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-(--muted)/50 border-b border-(--border) text-(--muted-foreground) text-xs font-semibold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-3.5">Branch</th>
                                    <th className="px-6 py-3.5">Original</th>
                                    <th className="px-6 py-3.5">Accepted</th>
                                    <th className="px-6 py-3.5">Remaining</th>
                                    <th className="px-6 py-3.5">Status</th>
                                    <th className="px-6 py-3.5">Requested</th>
                                    <th className="px-6 py-3.5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border)">
                                {settlements.map((st) => {
                                    const orig = Number(st.original_amount || st.amount || 0);
                                    const rem = Number(st.remaining_amount ?? orig);
                                    const acc = orig - rem;
                                    const isDone = rem <= 0 || st.status === "received" || st.status === "completed";

                                    return (
                                        <tr key={st.id} className="hover:bg-(--muted)/30 transition-colors">
                                            <td className="px-6 py-4 font-medium">
                                                {st.branch?.name || st.branch_name || "Branch"}
                                            </td>
                                            <td className="px-6 py-4 font-semibold">
                                                {orig.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-(--muted-foreground)">ETB</span>
                                            </td>
                                            <td className="px-6 py-4 text-(--success) font-semibold">
                                                {acc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal">ETB</span>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-(--destructive)">
                                                {rem.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal">ETB</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium uppercase ${isDone ? "bg-(--success)/10 text-(--success)" : "bg-(--primary)/10 text-(--primary)"}`}>
                                                    {isDone ? "Received" : (st.status || "Pending")}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-(--muted-foreground)">
                                                {new Date(st.created_at || st.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    href={`/dashboard/money/settlements/${st.id}`}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-(--border) rounded-lg text-xs font-medium hover:bg-(--muted) transition-colors"
                                                >
                                                    {isDone ? "View History" : "Accept Funds"}
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}