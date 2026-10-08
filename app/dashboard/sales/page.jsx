"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
    Plus,
    Search,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Clock,
    AlertCircle,
    FileText,
} from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function SalesOverviewPage() {
    const t = useTranslations("dashboard.salesPage");
    const router = useRouter();
    const [sales, setSales] = useState([]);
    const [summary, setSummary] = useState({
        totalSales: 0,
        totalRevenue: 0,
        paid: 0,
        partial: 0,
        credit: 0,
    });
    const [branches, setBranches] = useState([]);
    const [employees, setEmployees] = useState([]);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters & Pagination
    const [search, setSearch] = useState("");
    const [branchId, setBranchId] = useState("");
    const [employeeId, setEmployeeId] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("");
    const [selectedDate, setSelectedDate] = useState("");

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const loadFilterOptions = async () => {
        try {
            const [branchesRes, employeesRes] = await Promise.all([
                fetchApi("/api/v1/dashboard/available-branches?permission=sales.view").catch(() => ({ data: [] })),
                fetchApi("/api/v1/dashboard/users").catch(() => ({ data: [] })),
            ]);

            setBranches(
                branchesRes.data?.branches ||
                branchesRes.data ||
                branchesRes ||
                []
            );
            setEmployees(
                employeesRes.data?.users ||
                employeesRes.data ||
                employeesRes ||
                []
            );
        } catch (err) {
            console.error("Failed to load filter options", err);
        }
    };

    const loadSales = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            params.append("page", page.toString());
            params.append("limit", "10");

            if (search) params.append("search", search);
            if (branchId) params.append("branchId", branchId);
            if (employeeId) params.append("employeeId", employeeId);
            if (paymentStatus) params.append("paymentStatus", paymentStatus);

            if (selectedDate) {
                params.append("startDate", selectedDate);
                params.append("endDate", selectedDate);
            }

            const response = await fetchApi(`/api/v1/dashboard/sales?${params.toString()}`);

            const data = response.data || response;
            const salesList = data.sales || data.items || data.data || (Array.isArray(data) ? data : []);
            setSales(salesList);

            if (data.summary) {
                setSummary(data.summary);
            } else {
                const rev = salesList.reduce((acc, s) => acc + Number(s.totalAmount || s.total_amount || 0), 0);
                const pCount = salesList.filter(s => (s.paymentStatus || s.payment_status) === "paid").length;
                const partCount = salesList.filter(s => (s.paymentStatus || s.payment_status) === "partial").length;
                const credCount = salesList.filter(s => (s.paymentStatus || s.payment_status) === "credit").length;

                setSummary({
                    totalSales: salesList.length,
                    totalRevenue: rev,
                    paid: pCount,
                    partial: partCount,
                    credit: credCount,
                });
            }

            const paginationInfo = data.pagination || {};
            setTotalPages(paginationInfo.totalPages || data.totalPages || 1);
            setTotalItems(paginationInfo.total || salesList.length);

        } catch (err) {
            setError(err.message || t("loadError"));
        } finally {
            setIsLoading(false);
        }
    }, [search, branchId, employeeId, paymentStatus, selectedDate, page, t]);

    useEffect(() => {
        loadFilterOptions();
    }, []);

    useEffect(() => {
        loadSales();
    }, [loadSales]);

    const handleSelectToday = () => {
        const todayStr = new Date().toISOString().split("T")[0];
        setSelectedDate(todayStr);
        setPage(1);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "paid":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> {t("statusPaid")}
                    </span>
                );
            case "partial":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <Clock className="w-3 h-3" /> {t("statusPartial")}
                    </span>
                );
            case "credit":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20">
                        <AlertCircle className="w-3 h-3" /> {t("statusCredit")}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-(--muted) text-(--muted-foreground)">
                        {status}
                    </span>
                );
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-16">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
                    <p className="text-sm text-(--muted-foreground)">
                        {t("subtitle")}
                    </p>
                </div>

                <Link
                    href="/dashboard/sales/create"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-(--primary) text-(--primary-foreground) rounded-xl text-sm font-medium hover:opacity-95 transition-opacity shadow-xs"
                >
                    <Plus className="w-4 h-4" />
                    <span>{t("createSale")}</span>
                </Link>
            </div>

            {/* Sales Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-(--card) border border-(--border) rounded-xl p-4 shadow-xs space-y-1">
                    <span className="text-xs font-medium text-(--muted-foreground)">{t("totalSales")}</span>
                    <div className="text-xl font-bold font-mono">{summary.totalSales}</div>
                </div>

                <div className="bg-(--card) border border-(--border) rounded-xl p-4 shadow-xs space-y-1">
                    <span className="text-xs font-medium text-(--muted-foreground)">{t("totalRevenue")}</span>
                    <div className="text-xl font-bold font-mono text-(--primary)">
                        {Number(summary.totalRevenue || 0).toLocaleString()} {t("birr")}
                    </div>
                </div>

                <div className="bg-(--card) border border-(--border) rounded-xl p-4 shadow-xs space-y-1">
                    <span className="text-xs font-medium text-(--muted-foreground)">{t("paid")}</span>
                    <div className="text-xl font-bold font-mono text-emerald-500">{summary.paid}</div>
                </div>

                <div className="bg-(--card) border border-(--border) rounded-xl p-4 shadow-xs space-y-1">
                    <span className="text-xs font-medium text-(--muted-foreground)">{t("partial")}</span>
                    <div className="text-xl font-bold font-mono text-amber-500">{summary.partial}</div>
                </div>

                <div className="bg-(--card) border border-(--border) rounded-xl p-4 shadow-xs space-y-1">
                    <span className="text-xs font-medium text-(--muted-foreground)">{t("credit")}</span>
                    <div className="text-xl font-bold font-mono text-rose-500">{summary.credit}</div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-(--card) border border-(--border) rounded-xl p-4 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--muted-foreground)" />
                        <input
                            type="text"
                            placeholder={t("searchPlaceholder")}
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="w-full pl-9 pr-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-(--border)">
                    <select
                        value={branchId}
                        onChange={(e) => {
                            setBranchId(e.target.value);
                            setPage(1);
                        }}
                        className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--background) text-(--foreground) focus:outline-none focus:border-(--primary)"
                    >
                        <option value="">{t("allBranches")}</option>
                        {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={employeeId}
                        onChange={(e) => {
                            setEmployeeId(e.target.value);
                            setPage(1);
                        }}
                        className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--background) text-(--foreground) focus:outline-none focus:border-(--primary)"
                    >
                        <option value="">{t("allEmployees")}</option>
                        {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                                {emp.name || emp.username}
                            </option>
                        ))}
                    </select>

                    <select
                        value={paymentStatus}
                        onChange={(e) => {
                            setPaymentStatus(e.target.value);
                            setPage(1);
                        }}
                        className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--background) text-(--foreground) focus:outline-none focus:border-(--primary)"
                    >
                        <option value="">{t("allPaymentStatuses")}</option>
                        <option value="paid">{t("statusPaid")}</option>
                        <option value="partial">{t("statusPartial")}</option>
                        <option value="credit">{t("statusCredit")}</option>
                    </select>

                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => {
                                setSelectedDate(e.target.value);
                                setPage(1);
                            }}
                            className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                        />
                        {selectedDate && (
                            <button
                                onClick={() => {
                                    setSelectedDate("");
                                    setPage(1);
                                }}
                                className="text-xs text-(--muted-foreground) hover:text-(--foreground) underline shrink-0 cursor-pointer"
                            >
                                {t("clear")}
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-end pt-2 border-t border-(--border)">
                    <button
                        onClick={handleSelectToday}
                        className="px-3 py-1.5 bg-(--muted) hover:bg-(--muted)/80 text-(--foreground) rounded-xl text-xs font-medium transition-colors border border-(--border) cursor-pointer"
                    >
                        {t("selectToday")}
                    </button>
                </div>
            </div>

            {/* Content Table */}
            <div className="bg-(--card) border border-(--border) rounded-xl shadow-xs overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center space-y-3">
                        <div className="w-6 h-6 border-2 border-(--primary) border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-xs text-(--muted-foreground)">{t("loading")}</p>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center space-y-3 text-(--destructive)">
                        <AlertCircle className="w-8 h-8 mx-auto" />
                        <p className="text-sm font-semibold">{error}</p>
                        <button
                            onClick={loadSales}
                            className="px-3 py-1.5 bg-(--muted) text-(--foreground) rounded-lg text-xs font-medium hover:opacity-80 cursor-pointer"
                        >
                            {t("tryAgain")}
                        </button>
                    </div>
                ) : sales.length === 0 ? (
                    <div className="p-12 text-center space-y-3">
                        <FileText className="w-10 h-10 text-(--muted-foreground) mx-auto opacity-40" />
                        <h3 className="text-sm font-semibold">{t("noSalesFound")}</h3>
                        <p className="text-xs text-(--muted-foreground)">
                            {t("noSalesDesc")}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-(--border) bg-(--muted)/30 text-xs font-medium text-(--muted-foreground)">
                                    <th className="py-3 px-4">{t("colSaleIdDate")}</th>
                                    <th className="py-3 px-4">{t("colBranch")}</th>
                                    <th className="py-3 px-4">{t("colCustomer")}</th>
                                    <th className="py-3 px-4">{t("colEmployee")}</th>
                                    <th className="py-3 px-4 text-right">{t("colTotal")}</th>
                                    <th className="py-3 px-4">{t("colStatus")}</th>
                                    <th className="py-3 px-4 text-right">{t("colActions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border) text-sm">
                                {sales.map((sale) => {
                                    const id = sale.id || sale._id;
                                    const dateStr = sale.createdAt || sale.created_at || sale.date;

                                    const branchName = sale.branch_name || sale.branchName || sale.branch?.name || "—";
                                    const customer = sale.customerName || sale.customer_name || t("walkIn");
                                    const empName = sale.employee_name || sale.employeeName || sale.employee?.name || sale.employee?.username || "—";

                                    const total = Number(sale.totalAmount || sale.total_amount || 0);
                                    const status = sale.paymentStatus || sale.payment_status || "paid";

                                    const relativeTime = dateStr ? dayjs(dateStr).fromNow() : "";

                                    return (
                                        <tr
                                            key={id}
                                            onClick={() => router.push(`/dashboard/sales/${id}`)}
                                            className="hover:bg-(--muted)/20 transition-colors cursor-pointer"
                                        >
                                            <td className="py-3 px-4 font-mono">
                                                <div className="font-semibold text-xs text-(--primary) hover:underline">
                                                    #{String(id).slice(-8)}
                                                </div>
                                                <div className="text-[11px] text-(--muted-foreground)" title={dateStr ? new Date(dateStr).toLocaleString() : ""}>
                                                    {relativeTime}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-xs">
                                                {branchName}
                                            </td>
                                            <td className="py-3 px-4 text-xs font-medium">
                                                {customer}
                                            </td>
                                            <td className="py-3 px-4 text-xs text-(--muted-foreground)">
                                                {empName}
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono font-semibold text-xs">
                                                {total.toLocaleString()} {t("birr")}
                                            </td>
                                            <td className="py-3 px-4">
                                                {getStatusBadge(status)}
                                            </td>
                                            <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                <Link
                                                    href={`/dashboard/sales/${id}`}
                                                    className="inline-flex items-center px-2.5 py-1 bg-(--muted) hover:bg-(--muted)/80 text-(--foreground) rounded-lg text-xs font-medium transition-colors"
                                                >
                                                    {t("view")}
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-(--border) flex items-center justify-between">
                        <span className="text-xs text-(--muted-foreground)">
                            Page <span className="font-semibold text-(--foreground)">{page}</span> of{" "}
                            <span className="font-semibold text-(--foreground)">{totalPages}</span> ({totalItems} items)
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                disabled={page === 1 || isLoading}
                                className="inline-flex items-center gap-1 px-3 py-1.5 border border-(--border) rounded-lg text-xs font-medium hover:bg-(--muted) disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                <span>Previous</span>
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                                disabled={page === totalPages || isLoading}
                                className="inline-flex items-center gap-1 px-3 py-1.5 border border-(--border) rounded-lg text-xs font-medium hover:bg-(--muted) disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                <span>Next</span>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}