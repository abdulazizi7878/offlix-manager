// File: app/dashboard/products/purchases/page.jsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ShoppingCart, Search, Filter, Eye, AlertCircle,
    RefreshCcw, ChevronLeft, ChevronRight, Clock, X
} from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function PurchasesPage() {
    const router = useRouter();
    const [purchases, setPurchases] = useState([]);
    const [branches, setBranches] = useState([]);
    const [productsList, setProductsList] = useState([]);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Pagination & Filter States
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalPurchasesCount, setTotalPurchasesCount] = useState(0);

    const [search, setSearch] = useState("");
    const [branchId, setBranchId] = useState("");
    const [productId, setProductId] = useState("");
    const [paymentSource, setPaymentSource] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // Load Filter Metadata (Branches and Products for dropdowns)
    const loadFilterOptions = async () => {
        try {
            const [branchRes, productRes] = await Promise.all([
                fetchApi("/api/v1/dashboard/available-branches?permission=products.view").catch(() => ({ data: [] })),
                fetchApi("/api/v1/dashboard/products?limit=100").catch(() => ({ data: [] })),
            ]);
            setBranches(branchRes.data?.branches || branchRes.data || []);
            const rawProds = productRes.data?.products || productRes.data?.data || productRes.data || [];
            setProductsList(Array.isArray(rawProds) ? rawProds : []);
        } catch (err) {
            console.error("Failed to load filter metadata", err);
        }
    };

    // Load Purchases Data matching API structure
    const loadPurchases = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });
            if (search.trim()) queryParams.append("search", search.trim());
            if (branchId) queryParams.append("branchId", branchId);
            if (productId) queryParams.append("productId", productId);
            if (paymentSource) queryParams.append("paymentSource", paymentSource);
            if (dateFrom) queryParams.append("from", dateFrom);
            if (dateTo) queryParams.append("to", dateTo);

            const res = await fetchApi(`/api/v1/dashboard/products/purchases?${queryParams.toString()}`);

            const responseData = res.data?.data || res.data || [];
            const rawPurchases = Array.isArray(responseData) ? responseData : (responseData.data || []);

            const formattedPurchases = rawPurchases.map(item => ({
                ...item,
                productId: item.product_id ?? item.productId,
                productName: item.product_name ?? item.productName ?? item.product?.name,
                branchId: item.branch_id ?? item.branchId,
                branchName: item.branch_name ?? item.branchName ?? item.branch?.name,
                costPrice: Number(item.cost_price ?? item.costPrice ?? 0),
                quantity: Number(item.quantity ?? 0),
                totalCost: Number(item.total_cost ?? item.totalCost ?? ((item.quantity ?? 0) * (item.cost_price ?? item.costPrice ?? 0))),
                paymentSource: item.payment_source ?? item.paymentSource,
                createdBy: item.created_by_name ?? item.created_by ?? item.createdBy ?? item.user?.name,
                createdAt: item.created_at ?? item.createdAt,
            }));

            const paginationMeta = res.data?.pagination || res.pagination || { totalPages: 1, total: formattedPurchases.length };

            setPurchases(formattedPurchases);
            setTotalPages(paginationMeta.totalPages || 1);
            setTotalPurchasesCount(paginationMeta.total || formattedPurchases.length);
        } catch (err) {
            setError(err.message || "Failed to load inventory purchase history.");
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, search, branchId, productId, paymentSource, dateFrom, dateTo]);

    useEffect(() => {
        loadFilterOptions();
    }, []);

    useEffect(() => {
        loadPurchases();
    }, [loadPurchases]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        loadPurchases();
    };

    const handleClearFilters = () => {
        setSearch("");
        setBranchId("");
        setProductId("");
        setPaymentSource("");
        setDateFrom("");
        setDateTo("");
        setPage(1);
    };

    const hasActiveFilters = Boolean(search || branchId || productId || paymentSource || dateFrom || dateTo);

    const summaryMetrics = useMemo(() => {
        const totalCount = totalPurchasesCount;
        const totalQty = purchases.reduce((acc, curr) => acc + curr.quantity, 0);
        const totalAcqCost = purchases.reduce((acc, curr) => acc + curr.totalCost, 0);
        return { totalCount, totalQty, totalAcqCost };
    }, [purchases, totalPurchasesCount]);

    return (
        <div className="space-y-6 pb-16">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-(--border)">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Purchases</h1>
                    <p className="text-sm text-(--muted-foreground) mt-0.5">
                        View and manage your inventory acquisition history.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-(--card) border border-(--border) rounded-xl p-4 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-(--muted-foreground) uppercase tracking-wider">Total Purchases</p>
                        <h3 className="text-2xl font-bold mt-1 font-mono">{summaryMetrics.totalCount}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-(--primary)/10 text-(--primary) flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5" />
                    </div>
                </div>
                <div className="bg-(--card) border border-(--border) rounded-xl p-4 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-(--muted-foreground) uppercase tracking-wider">Total Quantity Acquired</p>
                        <h3 className="text-2xl font-bold mt-1 font-mono">{summaryMetrics.totalQty}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-(--muted) text-(--foreground) flex items-center justify-center">
                        <Filter className="w-5 h-5" />
                    </div>
                </div>
                <div className="bg-(--card) border border-(--border) rounded-xl p-4 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-(--muted-foreground) uppercase tracking-wider">Total Acquisition Cost</p>
                        <h3 className="text-2xl font-bold mt-1 font-mono">${summaryMetrics.totalAcqCost.toFixed(2)}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-(--success)/10 text-(--success) flex items-center justify-center">
                        <span className="font-bold text-lg">$</span>
                    </div>
                </div>
            </div>

            <div className="bg-(--card) border border-(--border) rounded-xl p-4 space-y-4 shadow-xs">
                <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--muted-foreground)" />
                        <input
                            type="text"
                            placeholder="Search product name, branch name, or notes..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-(--background) border border-(--border) rounded-lg text-sm text-(--foreground) focus:outline-none focus:ring-2 focus:ring-(--ring)"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-(--muted) hover:bg-(--muted)/80 text-(--foreground) rounded-lg text-sm font-medium transition-colors"
                    >
                        Search
                    </button>
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-(--destructive)/10 text-(--destructive) hover:bg-(--destructive)/20 rounded-lg text-sm font-medium transition-colors"
                        >
                            <X className="w-4 h-4" />
                            <span>Clear Filters</span>
                        </button>
                    )}
                </form>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-(--border)">
                    <select
                        value={branchId}
                        onChange={(e) => { setBranchId(e.target.value); setPage(1); }}
                        className="px-3 py-1.5 bg-(--background) border border-(--border) rounded-lg text-xs text-(--foreground) focus:outline-none"
                    >
                        <option value="">All Branches</option>
                        {branches.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>

                    <select
                        value={productId}
                        onChange={(e) => { setProductId(e.target.value); setPage(1); }}
                        className="px-3 py-1.5 bg-(--background) border border-(--border) rounded-lg text-xs text-(--foreground) focus:outline-none"
                    >
                        <option value="">All Products</option>
                        {productsList.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>

                    <input
                        type="text"
                        placeholder="Payment Source"
                        value={paymentSource}
                        onChange={(e) => { setPaymentSource(e.target.value); setPage(1); }}
                        className="px-3 py-1.5 bg-(--background) border border-(--border) rounded-lg text-xs text-(--foreground) focus:outline-none"
                    />

                    <input
                        type="date"
                        placeholder="From Date"
                        value={dateFrom}
                        onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                        className="px-3 py-1.5 bg-(--background) border border-(--border) rounded-lg text-xs text-(--foreground) focus:outline-none"
                    />

                    <input
                        type="date"
                        placeholder="To Date"
                        value={dateTo}
                        onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                        className="px-3 py-1.5 bg-(--background) border border-(--border) rounded-lg text-xs text-(--foreground) focus:outline-none"
                    />
                </div>
            </div>

            {error && (
                <div className="p-4 bg-(--destructive)/10 border border-(--destructive)/20 rounded-xl flex items-center justify-between text-(--destructive)">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="text-sm font-semibold">{error}</p>
                    </div>
                    <button
                        onClick={loadPurchases}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-(--background) border border-(--border) text-(--foreground) text-xs font-medium rounded-lg hover:bg-(--muted)"
                    >
                        <RefreshCcw className="w-3.5 h-3.5" />
                        <span>Retry</span>
                    </button>
                </div>
            )}

            <div className="bg-(--card) border border-(--border) rounded-xl overflow-hidden shadow-xs">
                {isLoading ? (
                    <div className="p-8 space-y-4 animate-pulse">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-12 bg-(--muted) rounded-lg w-full" />
                        ))}
                    </div>
                ) : purchases.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-(--border) bg-(--muted)/30 text-[11px] font-semibold text-(--muted-foreground) uppercase tracking-wider">
                                    <th className="py-3 px-4">Product</th>
                                    <th className="py-3 px-4">Branch</th>
                                    <th className="py-3 px-4">Quantity</th>
                                    <th className="py-3 px-4">Cost Price</th>
                                    <th className="py-3 px-4">Total Cost</th>
                                    <th className="py-3 px-4">Payment Source</th>
                                    <th className="py-3 px-4">Created By</th>
                                    <th className="py-3 px-4">Date</th>
                                    <th className="py-3 px-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border) text-sm">
                                {purchases.map((item) => (
                                    <tr
                                        key={item.id}
                                        onClick={() => router.push(`/dashboard/products/purchases/${item.id}`)}
                                        className="hover:bg-(--muted)/20 transition-colors cursor-pointer group"
                                    >
                                        <td className="py-3 px-4 font-semibold text-(--foreground)">
                                            {item.productName || item.productId || "N/A"}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-(--muted-foreground)">
                                            <span className="font-medium text-(--foreground)">{item.branchName || "N/A"}</span>
                                        </td>
                                        <td className="py-3 px-4 font-mono font-semibold">
                                            {item.quantity}
                                        </td>
                                        <td className="py-3 px-4 font-mono text-xs">
                                            ${item.costPrice.toFixed(2)}
                                        </td>
                                        <td className="py-3 px-4 font-mono font-bold text-(--foreground)">
                                            ${item.totalCost.toFixed(2)}
                                        </td>
                                        <td className="py-3 px-4 text-xs">
                                            <span className="inline-flex px-2 py-0.5 rounded bg-(--muted) text-(--muted-foreground) font-mono">
                                                {item.paymentSource || "N/A"}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-xs text-(--muted-foreground)">
                                            {item.createdBy || "System"}
                                        </td>
                                        <td className="py-3 px-4 text-xs">
                                            <div className="font-medium text-(--foreground)">
                                                {item.createdAt ? dayjs(item.createdAt).format("YYYY-MM-DD") : "N/A"}
                                            </div>
                                            <div className="text-[10px] text-(--muted-foreground) flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                <span>{item.createdAt ? dayjs(item.createdAt).fromNow() : ""}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <Link
                                                href={`/dashboard/products/purchases/${item.id}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-1.5 hover:bg-(--muted) text-(--muted-foreground) hover:text-(--foreground) rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-medium"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                                <span className="hidden sm:inline">View</span>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-(--muted) flex items-center justify-center mx-auto text-(--muted-foreground)">
                            <ShoppingCart className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-base">No purchases found</h3>
                        <p className="text-xs text-(--muted-foreground) max-w-sm mx-auto">
                            {hasActiveFilters
                                ? "No purchases match your current filters. Try clearing them to see all records."
                                : "There are no recorded inventory purchases yet."}
                        </p>
                        {hasActiveFilters && (
                            <div className="pt-2">
                                <button
                                    onClick={handleClearFilters}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-xs font-medium"
                                >
                                    <X className="w-4 h-4" />
                                    <span>Clear filters</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {!isLoading && totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-(--border) text-xs text-(--muted-foreground)">
                        <span>Page {page} of {totalPages} (Total: {totalPurchasesCount})</span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                disabled={page === 1}
                                className="p-1.5 border border-(--border) rounded-lg disabled:opacity-40 hover:bg-(--muted)"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                                disabled={page === totalPages}
                                className="p-1.5 border border-(--border) rounded-lg disabled:opacity-40 hover:bg-(--muted)"
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