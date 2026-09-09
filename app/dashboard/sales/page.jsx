// file: app/dashboard/sales/page.jsx

"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ShoppingCart, Plus, AlertCircle, Search, Filter, Store, ArrowUpDown, ChevronDown } from "lucide-react";
import { fetchApi } from "@/lib/api/client";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

export default function SalesOverviewPage() {
    const [sales, setSales] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter and Search States
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'paid', 'partial'
    const [branchFilter, setBranchFilter] = useState("all"); // 'all', or specific branch name
    const [sortBy, setSortBy] = useState("newest"); // 'newest', 'oldest', 'amount-high', 'amount-low'

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

    // Extract unique branch names for the branch filter dropdown
    const availableBranches = useMemo(() => {
        const branches = sales.map((sale) => sale.branchName || sale.branch_name).filter(Boolean);
        return Array.from(new Set(branches));
    }, [sales]);

    // Filter and Sort Logic
    const filteredSales = useMemo(() => {
        return sales
            .filter((sale) => {
                const customer = (sale.customerName || sale.customer_name || "Walk-in Customer").toLowerCase();
                const branchName = sale.branchName || sale.branch_name || "";
                const branch = branchName.toLowerCase();
                const employee = (sale.employeeName || sale.employee_name || "").toLowerCase();
                const id = (sale.id || "").toLowerCase();

                const query = searchQuery.toLowerCase();
                const matchesSearch = customer.includes(query) || branch.includes(query) || employee.includes(query) || id.includes(query);

                const status = sale.paymentStatus || sale.payment_status;
                const matchesStatus = statusFilter === "all" || status === statusFilter;

                const matchesBranch = branchFilter === "all" || branchName === branchFilter;

                return matchesSearch && matchesStatus && matchesBranch;
            })
            .sort((a, b) => {
                const dateA = new Date(a.createdAt || a.created_at || 0);
                const dateB = new Date(b.createdAt || b.created_at || 0);
                const amountA = Number(a.totalAmount || a.total_amount || 0);
                const amountB = Number(b.totalAmount || b.total_amount || 0);

                if (sortBy === "newest") return dateB - dateA;
                if (sortBy === "oldest") return dateA - dateB;
                if (sortBy === "amount-high") return amountB - amountA;
                if (sortBy === "amount-low") return amountA - amountB;
                return 0;
            });
    }, [sales, searchQuery, statusFilter, branchFilter, sortBy]);

    // Calculate Summary Metrics
    const totalRevenue = useMemo(() => {
        return sales.reduce((acc, curr) => acc + Number(curr.totalAmount || curr.total_amount || 0), 0);
    }, [sales]);

    const totalPaid = useMemo(() => {
        return sales.reduce((acc, curr) => acc + Number(curr.paidAmount || curr.paid_amount || 0), 0);
    }, [sales]);

    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-pulse">
                <div className="flex justify-between pb-4 border-b border-(--border)">
                    <div className="h-8 w-40 bg-(--muted) rounded-md" />
                    <div className="h-8 w-28 bg-(--muted) rounded-md" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="h-24 bg-(--muted) rounded-xl" />
                    <div className="h-24 bg-(--muted) rounded-xl" />
                    <div className="h-24 bg-(--muted) rounded-xl" />
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
                    <h1 className="text-xl font-bold tracking-tight">Sales History & Overview</h1>
                    <p className="text-xs text-(--muted-foreground)">Track business sales, payment statuses, revenue, and branch transactions.</p>
                </div>
                <Link
                    href="/dashboard/sales/create"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-(--primary) text-(--primary-foreground) rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Sale</span>
                </Link>
            </div>

            {/* Quick Metrics Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-(--card) border border-(--border) rounded-xl p-4 space-y-1 shadow-xs">
                    <span className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Total Recorded Sales</span>
                    <p className="text-2xl font-mono font-bold">{sales.length}</p>
                </div>
                <div className="bg-(--card) border border-(--border) rounded-xl p-4 space-y-1 shadow-xs">
                    <span className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Total Revenue</span>
                    <p className="text-2xl font-mono font-bold text-(--primary)">{totalRevenue.toLocaleString()} birr</p>
                </div>
                <div className="bg-(--card) border border-(--border) rounded-xl p-4 space-y-1 shadow-xs">
                    <span className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Total Received Cash</span>
                    <p className="text-2xl font-mono font-bold text-emerald-600">{totalPaid.toLocaleString()} birr</p>
                </div>
            </div>

            {/* Filter and Search Bar Controls with Fixed Dark Mode Select Options */}
            <div className="bg-(--card) border border-(--border) rounded-xl p-4 flex flex-col md:flex-row items-center gap-3 shadow-xs">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--muted-foreground)" />
                    <input
                        type="text"
                        placeholder="Search by customer, branch, employee, or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-(--muted)/30 border border-(--border) rounded-xl text-xs focus:outline-none focus:border-(--primary) transition-colors"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                    {/* Modern Branch Filter */}
                    <div className="relative group">
                        <div className="flex items-center gap-2 px-3.5 py-2.5 bg-(--muted)/30 border border-(--border) rounded-xl text-xs hover:border-(--primary)/55 transition-colors cursor-pointer">
                            <Store className="w-3.5 h-3.5 text-(--muted-foreground)" />
                            <span className="font-medium text-(--foreground)">
                                {branchFilter === "all" ? "All Branches" : branchFilter}
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 text-(--muted-foreground) ml-1" />
                        </div>
                        <select
                            value={branchFilter}
                            onChange={(e) => setBranchFilter(e.target.value)}
                            aria-label="Filter by branch"
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full bg-slate-900 text-slate-100"
                        >
                            <option value="all" className="bg-slate-900 text-slate-100 py-2">All Branches</option>
                            {availableBranches.map((branch) => (
                                <option key={branch} value={branch} className="bg-slate-900 text-slate-100 py-2">{branch}</option>
                            ))}
                        </select>
                    </div>

                    {/* Modern Status Filter */}
                    <div className="relative group">
                        <div className="flex items-center gap-2 px-3.5 py-2.5 bg-(--muted)/30 border border-(--border) rounded-xl text-xs hover:border-(--primary)/50 transition-colors cursor-pointer">
                            <Filter className="w-3.5 h-3.5 text-(--muted-foreground)" />
                            <span className="font-medium text-(--foreground) capitalize">
                                {statusFilter === "all" ? "All Statuses" : statusFilter}
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 text-(--muted-foreground) ml-1" />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            aria-label="Filter by payment status"
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full bg-slate-900 text-slate-100"
                        >
                            <option value="all" className="bg-slate-900 text-slate-100 py-2">All Statuses</option>
                            <option value="paid" className="bg-slate-900 text-slate-100 py-2">Paid</option>
                            <option value="partial" className="bg-slate-900 text-slate-100 py-2">Partial</option>
                        </select>
                    </div>

                    {/* Modern Sort Dropdown */}
                    <div className="relative group">
                        <div className="flex items-center gap-2 px-3.5 py-2.5 bg-(--muted)/30 border border-(--border) rounded-xl text-xs hover:border-(--primary)/50 transition-colors cursor-pointer">
                            <ArrowUpDown className="w-3.5 h-3.5 text-(--muted-foreground)" />
                            <span className="font-medium text-(--foreground)">
                                {sortBy === "newest" && "Newest First"}
                                {sortBy === "oldest" && "Oldest First"}
                                {sortBy === "amount-high" && "Amount: High to Low"}
                                {sortBy === "amount-low" && "Amount: Low to High"}
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 text-(--muted-foreground) ml-1" />
                        </div>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            aria-label="Sort sales"
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full bg-slate-900 text-slate-100"
                        >
                            <option value="newest" className="bg-slate-900 text-slate-100 py-2">Newest First</option>
                            <option value="oldest" className="bg-slate-900 text-slate-100 py-2">Oldest First</option>
                            <option value="amount-high" className="bg-slate-900 text-slate-100 py-2">Amount: High to Low</option>
                            <option value="amount-low" className="bg-slate-900 text-slate-100 py-2">Amount: Low to High</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Sales List */}
            {filteredSales.length === 0 ? (
                <div className="bg-(--card) border border-(--border) rounded-xl p-12 text-center space-y-3">
                    <ShoppingCart className="w-10 h-10 mx-auto text-(--muted-foreground)" />
                    <h2 className="text-sm font-semibold">No matching sales found</h2>
                    <p className="text-xs text-(--muted-foreground)">Try adjusting your search query, branch filter, or status options.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {filteredSales.map((sale) => {
                        const rawDate = sale.createdAt || sale.created_at;
                        const paymentStatus = sale.paymentStatus || sale.payment_status;
                        const totalAmount = Number(sale.totalAmount || sale.total_amount || 0);
                        const paidAmount = Number(sale.paidAmount || sale.paid_amount || 0);
                        const remainingAmount = Number(sale.remainingAmount || sale.remaining_amount || 0);
                        const itemCount = sale.itemCount || sale.item_count || 1;

                        return (
                            <Link
                                key={sale.id}
                                href={`/dashboard/sales/${sale.id}`}
                                className="bg-(--card) border border-(--border) rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-(--primary) transition-all shadow-xs"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold">{sale.customerName || sale.customer_name || "Walk-in Customer"}</span>
                                        <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full uppercase ${paymentStatus === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                            {paymentStatus}
                                        </span>
                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-(--muted) text-(--muted-foreground)">
                                            {itemCount} {Number(itemCount) === 1 ? 'item' : 'items'}
                                        </span>
                                    </div>
                                    <p className="text-xs font-mono text-(--muted-foreground)">
                                        Branch: {sale.branchName || sale.branch_name || "N/A"} • By: {sale.employeeName || sale.employee_name || "N/A"} • {dayjs(rawDate).fromNow()} ({dayjs(rawDate).format("MMM D, YYYY")})
                                    </p>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-6 pt-2 md:pt-0 border-t md:border-t-0 border-(--border)">
                                    <div className="text-left md:text-right">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-(--muted-foreground)">Paid / Balance</p>
                                        <p className="text-xs font-mono font-medium">
                                            <span className="text-emerald-600">{paidAmount.toLocaleString()}</span> / <span className="text-amber-600">{remainingAmount.toLocaleString()}</span> birr
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-(--muted-foreground)">Total</p>
                                        <span className="text-base font-mono font-bold text-(--primary)">{totalAmount.toLocaleString()} birr</span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}