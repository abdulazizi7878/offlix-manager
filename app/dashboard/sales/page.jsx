// file: app/dashboard/sales/page.jsx

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Plus,
    Search,
    Filter,
    Calendar,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    CheckCircle2,
    Clock,
    AlertCircle,
    FileText,
    TrendingUp,
    DollarSign,
    Building2,
    User,
} from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function SalesOverviewPage() {
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
            if (search) params.append("search", search);
            if (branchId) params.append("branchId", branchId);
            if (employeeId) params.append("employeeId", employeeId);
            if (paymentStatus) params.append("paymentStatus", paymentStatus);

            if (selectedDate) {
                params.append("startDate", selectedDate);
                params.append("endDate", selectedDate);
            }

            params.append("page", page.toString());

            const response = await fetchApi(`/api/v1/dashboard/sales?${params.toString()}`);

            const data = response.data || response;
            setSales(data.sales || data.items || data || []);

            if (data.summary) {
                setSummary(data.summary);
            } else {
                const list = data.sales || data.items || data || [];
                const rev = list.reduce((acc, s) => acc + Number(s.totalAmount || s.total_amount || 0), 0);
                const pCount = list.filter(s => (s.paymentStatus || s.payment_status) === "paid").length;
                const partCount = list.filter(s => (s.paymentStatus || s.payment_status) === "partial").length;
                const credCount = list.filter(s => (s.paymentStatus || s.payment_status) === "credit").length;

                setSummary({
                    totalSales: list.length,
                    totalRevenue: rev,
                    paid: pCount,
                    partial: partCount,
                    credit: credCount,
                });
            }

            if (data.totalPages) {
                setTotalPages(data.totalPages);
            }
        } catch (err) {
            setError(err.message || "Failed to load sales data.");
        } finally {
            setIsLoading(false);
        }
    }, [search, branchId, employeeId, paymentStatus, selectedDate, page]);

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
                        <CheckCircle2 className="w-3 h-3" /> Paid
                    </span>
                );
            case "partial":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <Clock className="w-3 h-3" /> Partial
                    </span>
                );
            case "credit":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20">
                        <AlertCircle className="w-3 h-3" /> Credit
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
                    <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
                    <p className="text-sm text-(--muted-foreground)">
                        Manage transactions, track payments, and review sales records.
                    </p>
                </div>

                <Link
                    href="/dashboard/sales/create"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-(--primary) text-(--primary-foreground) rounded-xl text-sm font-medium hover:opacity-95 transition-opacity shadow-xs"
                >
                    <Plus className="w-4 h-4" />
                    <span>Create Sale</span>
                </Link>
            </div>

            {/* Sales Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-(--card) border border-(--border) rounded-xl p-4 shadow-xs space-y-1">
                    <span className="text-xs font-medium text-(--muted-foreground)">Total Sales</span>
                    <div className="text-xl font-bold font-mono">{summary.totalSales}</div>
                </div>

                <div className="bg-(--card) border border-(--border) rounded-xl p-4 shadow-xs space-y-1">
                    <span className="text-xs font-medium text-(--muted-foreground)">Total Revenue</span>
                    <div className="text-xl font-bold font-mono text-(--primary)">
                        {Number(summary.totalRevenue || 0).toLocaleString()} birr
                    </div>
                </div>

                <div className="bg-(--card) border border-(--border) rounded-xl p-4 shadow-xs space-y-1">
                    <span className="text-xs font-medium text-(--muted-foreground)">Paid</span>
                    <div className="text-xl font-bold font-mono text-emerald-500">{summary.paid}</div>
                </div>

                <div className="bg-(--card) border border-(--border) rounded-xl p-4 shadow-xs space-y-1">
                    <span className="text-xs font-medium text-(--muted-foreground)">Partial</span>
                    <div className="text-xl font-bold font-mono text-amber-500">{summary.partial}</div>
                </div>

                <div className="bg-(--card) border border-(--border) rounded-xl p-4 shadow-xs space-y-1">
                    <span className="text-xs font-medium text-(--muted-foreground)">Credit</span>
                    <div className="text-xl font-bold font-mono text-rose-500">{summary.credit}</div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-(--card) border border-(--border) rounded-xl p-4 shadow-xs space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--muted-foreground)" />
                        <input
                            type="text"
                            placeholder="Search customer, ID..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="w-full pl-9 pr-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                        />
                    </div>

                    <select
                        value={branchId}
                        onChange={(e) => {
                            setBranchId(e.target.value);
                            setPage(1);
                        }}
                        className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-slate-900 text-slate-100 focus:outline-none focus:border-(--primary)"
                    >
                        <option value="" className="bg-slate-900 text-slate-100 py-2">All Branches</option>
                        {branches.map((b) => (
                            <option key={b.id} value={b.id} className="bg-slate-900 text-slate-100 py-2">
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
                        className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-slate-900 text-slate-100 focus:outline-none focus:border-(--primary)"
                    >
                        <option value="" className="bg-slate-900 text-slate-100 py-2">All Employees</option>

                        {employees.map((emp) => (
                            <option key={emp.id} value={emp.id} className="bg-slate-900 text-slate-100 py-2">
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
                        className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-slate-900 text-slate-100 focus:outline-none focus:border-(--primary)"
                    >
                        <option value="" className="bg-slate-900 text-slate-100 py-2">All Payment Statuses</option>
                        <option value="paid" className="bg-slate-900 text-slate-100 py-2">Paid</option>
                        <option value="partial" className="bg-slate-900 text-slate-100 py-2">Partial</option>
                        <option value="credit" className="bg-slate-900 text-slate-100 py-2">Credit</option>
                    </select>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-(--border)">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-xs text-(--muted-foreground) shrink-0 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> Date Filter:
                        </span>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => {
                                setSelectedDate(e.target.value);
                                setPage(1);
                            }}
                            className="px-3 py-1.5 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                        />
                        {selectedDate && (
                            <button
                                onClick={() => {
                                    setSelectedDate("");
                                    setPage(1);
                                }}
                                className="text-xs text-(--muted-foreground) hover:text-(--foreground) underline ml-1"
                            >
                                Clear Date
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                            onClick={handleSelectToday}
                            className="px-3 py-1.5 bg-(--muted) hover:bg-(--muted)/80 text-(--foreground) rounded-xl text-xs font-medium transition-colors border border-(--border)"
                        >
                            Select Today
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Table */}
            <div className="bg-(--card) border border-(--border) rounded-xl shadow-xs overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center space-y-3">
                        <div className="w-6 h-6 border-2 border-(--primary) border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-xs text-(--muted-foreground)">Loading sales records...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center space-y-3 text-(--destructive)">
                        <AlertCircle className="w-8 h-8 mx-auto" />
                        <p className="text-sm font-semibold">{error}</p>
                        <button
                            onClick={loadSales}
                            className="px-3 py-1.5 bg-(--muted) text-(--foreground) rounded-lg text-xs font-medium hover:opacity-80"
                        >
                            Try Again
                        </button>
                    </div>
                ) : sales.length === 0 ? (
                    <div className="p-12 text-center space-y-3">
                        <FileText className="w-10 h-10 text-(--muted-foreground) mx-auto opacity-40" />
                        <h3 className="text-sm font-semibold">No sales found</h3>
                        <p className="text-xs text-(--muted-foreground)">
                            Try clearing filters or record a new sale transaction.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-(--border) bg-(--muted)/30 text-xs font-medium text-(--muted-foreground)">
                                    <th className="py-3 px-4">Sale ID / Date</th>
                                    <th className="py-3 px-4">Branch</th>
                                    <th className="py-3 px-4">Customer</th>
                                    <th className="py-3 px-4">Employee</th>
                                    <th className="py-3 px-4 text-right">Total</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border) text-sm">
                                {sales.map((sale) => {
                                    const id = sale.id || sale._id;
                                    const dateStr = sale.createdAt || sale.created_at || sale.date;

                                    const branchName = sale.branch_name || sale.branchName || sale.branch?.name || "—";
                                    const customer = sale.customerName || sale.customer_name || "Walk-in";
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
                                                {total.toLocaleString()} birr
                                            </td>
                                            <td className="py-3 px-4">
                                                {getStatusBadge(status)}
                                            </td>
                                            <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                <Link
                                                    href={`/dashboard/sales/${id}`}
                                                    className="inline-flex items-center px-2.5 py-1 bg-(--muted) hover:bg-(--muted)/80 text-(--foreground) rounded-lg text-xs font-medium transition-colors"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="p-4 border-t border-(--border) flex items-center justify-between">
                        <span className="text-xs text-(--muted-foreground)">
                            Page {page} of {totalPages}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                disabled={page === 1}
                                className="p-1.5 border border-(--border) rounded-lg hover:bg-(--muted) disabled:opacity-40 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                                disabled={page === totalPages}
                                className="p-1.5 border border-(--border) rounded-lg hover:bg-(--muted) disabled:opacity-40 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}