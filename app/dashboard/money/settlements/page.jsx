"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Building2, Search, Filter } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function SettlementsPage() {
    const t = useTranslations("dashboard.settlementsPage");

    const [settlements, setSettlements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filtering states
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const loadSettlements = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetchApi("/api/v1/dashboard/money/settlements");

            const responseData = res.data?.data ?? res.data ?? {};
            const settlementsList = Array.isArray(responseData)
                ? responseData
                : (responseData.data ?? res.data?.settlements ?? []);

            setSettlements(settlementsList);
        } catch (err) {
            setError(err.message || t("messages.loadError"));
            toast.error(t("messages.loadError"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSettlements();
    }, []);

    // Filter settlements based on branch name, requester, and status
    const filteredSettlements = settlements.filter((st) => {
        const branchName = (st.branch?.name || st.branch_name || "").toLowerCase();
        const requester = (st.requested_by_name || "").toLowerCase();
        const receiver = (st.received_by_name || "").toLowerCase();
        const query = searchQuery.toLowerCase();

        const matchesSearch = branchName.includes(query) || requester.includes(query) || receiver.includes(query);

        const rem = Number(st.remaining_amount ?? (st.original_amount || st.amount || 0));
        const isDone = rem <= 0 || st.status === "received" || st.status === "completed";
        const currentStatus = isDone ? "received" : (st.status || "pending");

        const matchesStatus = statusFilter === "all" || currentStatus === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-(--border)">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-(--primary)/10 text-(--primary) rounded-xl">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
                        <p className="text-sm text-(--muted-foreground) mt-0.5">
                            {t("subtitle")}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-(--card) border border-(--border) p-4 rounded-xl shadow-xs">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--muted-foreground)" />
                    <input
                        type="text"
                        placeholder={t("searchPlaceholder")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-(--border) rounded-lg text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                    />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-2 text-xs text-(--muted-foreground)">
                        <Filter className="w-3.5 h-3.5" /> {t("filterStatus")}
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-(--border) rounded-lg text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                    >
                        <option value="all">{t("allStatuses")}</option>
                        <option value="requested">{t("requestedPending")}</option>
                        <option value="received">{t("received")}</option>
                    </select>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-(--destructive)/10 border border-(--destructive)/20 rounded-xl flex items-center justify-between text-(--destructive)">
                    <span className="text-sm font-medium">{error}</span>
                    <button onClick={loadSettlements} className="px-3 py-1.5 bg-(--background) border border-(--border) text-xs rounded-lg font-medium">
                        {t("retry")}
                    </button>
                </div>
            )}

            {isLoading && (
                <div className="space-y-4 animate-pulse">
                    <div className="h-64 bg-(--card) border border-(--border) rounded-xl" />
                </div>
            )}

            {!isLoading && !error && filteredSettlements.length === 0 && (
                <div className="p-12 text-center bg-(--card) border border-(--border) rounded-xl space-y-4">
                    <div className="mx-auto w-12 h-12 bg-(--muted) text-(--muted-foreground) rounded-full flex items-center justify-center">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div className="max-w-sm mx-auto space-y-1">
                        <h2 className="text-lg font-semibold">{t("noSettlementsTitle")}</h2>
                        <p className="text-xs text-(--muted-foreground)">{t("noSettlementsSubtitle")}</p>
                    </div>
                </div>
            )}

            {!isLoading && !error && filteredSettlements.length > 0 && (
                <div className="bg-(--card) border border-(--border) rounded-xl shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-(--muted)/50 border-b border-(--border) text-(--muted-foreground) text-xs font-semibold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-3.5">{t("table.branch")}</th>
                                    <th className="px-6 py-3.5">{t("table.original")}</th>
                                    <th className="px-6 py-3.5">{t("table.accepted")}</th>
                                    <th className="px-6 py-3.5">{t("table.remaining")}</th>
                                    <th className="px-6 py-3.5">{t("table.status")}</th>
                                    <th className="px-6 py-3.5">{t("table.requestedBy")}</th>
                                    <th className="px-6 py-3.5">{t("table.receiver")}</th>
                                    <th className="px-6 py-3.5">{t("table.requestedDate")}</th>
                                    <th className="px-6 py-3.5 text-right">{t("table.action")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border)">
                                {filteredSettlements.map((st) => {
                                    const orig = Number(st.original_amount || st.amount || 0);
                                    const rem = Number(st.remaining_amount ?? orig);
                                    const acc = orig - rem;
                                    const isDone = rem <= 0 || st.status === "received" || st.status === "completed";
                                    const reqDate = st.requested_at || st.created_at || st.date;

                                    return (
                                        <tr key={st.id} className="hover:bg-(--muted)/30 transition-colors">
                                            <td className="px-6 py-4 font-medium">
                                                {st.branch?.name || st.branch_name || t("table.branch")}
                                            </td>
                                            <td className="px-6 py-4 font-semibold">
                                                {orig.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-(--muted-foreground)">{t("table.etb")}</span>
                                            </td>
                                            <td className="px-6 py-4 text-(--success) font-semibold">
                                                {acc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal">{t("table.etb")}</span>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-(--destructive)">
                                                {rem.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal">{t("table.etb")}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium uppercase ${isDone ? "bg-(--success)/10 text-(--success)" : "bg-(--primary)/10 text-(--primary)"}`}>
                                                    {isDone ? t("table.receivedStatus") : (st.status || t("table.pending"))}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium">
                                                {st.requested_by_name || t("table.na")}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium">
                                                {st.received_by_name || t("table.na")}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-(--muted-foreground)">
                                                <div>{reqDate ? dayjs(reqDate).format("DD/MM/YYYY") : t("table.na")}</div>
                                                <div className="text-[10px]">{reqDate ? `(${dayjs(reqDate).fromNow()})` : ""}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    href={`/dashboard/money/settlements/${st.id}`}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-(--border) rounded-lg text-xs font-medium hover:bg-(--muted) transition-colors"
                                                >
                                                    {isDone ? t("table.viewHistory") : t("table.acceptFunds")}
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