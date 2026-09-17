// file: app/dashboard/products/page.jsx

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    Package, Plus, Search, Filter, MoreHorizontal, Eye,
    Pencil, Trash2, CheckCircle2, XCircle, AlertCircle,
    ChevronLeft, ChevronRight, RefreshCcw, Loader2, Clock
} from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useTranslations } from "next-intl";

// Dayjs relativeTime plugin ማቀናጀት
dayjs.extend(relativeTime);

// የ dayjs አንፃራዊ ሰዓት (Relative Time) ማስያ
function getRelativeTime(dateString) {
    if (!dateString) return "";
    return dayjs(dateString).fromNow();
}

export default function ProductsPage() {
    const t = useTranslations("dashboard.productsPage");

    const [products, setProducts] = useState([]);
    const [branches, setBranches] = useState([]);
    const [categories, setCategories] = useState([]);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Pagination & Filters
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);

    const [search, setSearch] = useState("");
    const [branchId, setBranchId] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [status, setStatus] = useState("");
    const [type, setType] = useState("");

    // Confirmation dialog state for deletion/status toggle
    const [deleteModalProduct, setDeleteModalProduct] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadFilterOptions = async () => {
        try {
            const [branchRes, categoryRes] = await Promise.all([
                fetchApi("/api/v1/dashboard/available-branches?permission=products.view").catch(() => ({ data: [] })),
                fetchApi("/api/v1/dashboard/categories").catch(() => ({ data: [] })),
            ]);
            setBranches(branchRes.data?.branches || branchRes.data || []);
            setCategories(categoryRes.data?.categories || categoryRes.data || []);
        } catch (err) {
            console.error("Failed to load filter metadata", err);
        }
    };

    const loadProducts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });
            if (search.trim()) queryParams.append("search", search.trim());
            if (branchId) queryParams.append("branchId", branchId);
            if (categoryId) queryParams.append("categoryId", categoryId);
            if (status) queryParams.append("status", status);
            if (type) queryParams.append("type", type);

            const res = await fetchApi(`/api/v1/dashboard/products?${queryParams.toString()}`);

            const rawProducts = res.data?.products || res.data?.data || res.data || [];

            const productData = (Array.isArray(rawProducts) ? rawProducts : []).map(product => ({
                ...product,
                accountId: product.account_id ?? product.accountId,
                branchId: product.branch_id ?? product.branchId,
                branchName: product.branch_name ?? product.branchName,
                categoryId: product.category_id ?? product.categoryId,
                categoryName: product.category_name ?? product.categoryName,
                costPrice: product.cost_price ?? product.costPrice,
                sellingPrice: product.selling_price ?? product.sellingPrice,
                stock: product.stock ?? 0,
                lowStockThreshold: product.low_stock_threshold ?? product.lowStockThreshold ?? 5,
                createdAt: product.created_at ?? product.createdAt,
                updatedAt: product.updated_at ?? product.updatedAt,
                photos: (product.photos || []).map(photo => ({
                    ...photo,
                    productId: photo.product_id ?? photo.productId,
                    objectKey: photo.object_key ?? photo.objectKey,
                    createdAt: photo.created_at ?? photo.createdAt,
                    updatedAt: photo.updated_at ?? photo.updatedAt,
                }))
            }));

            const paginationMeta = res.data?.pagination || res.pagination || { totalPages: 1, total: productData.length };

            setProducts(productData);
            setTotalPages(paginationMeta.totalPages || 1);
            setTotalProducts(paginationMeta.total || productData.length);
        } catch (err) {
            setError(err.message || t("toasts.loadError"));
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, search, branchId, categoryId, status, type, t]);

    useEffect(() => {
        loadFilterOptions();
    }, []);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        loadProducts();
    };

    const handleStatusToggle = async (product) => {
        const nextStatus = product.status === "active" ? "inactive" : "active";
        try {
            await fetchApi(`/api/v1/dashboard/products/${product.id}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status: nextStatus }),
            });
            toast.success(t("toasts.markedStatus", { status: nextStatus }));
            loadProducts();
        } catch (err) {
            toast.error(err.message || t("toasts.statusError"));
        }
    };

    const handleDeleteProduct = async () => {
        if (!deleteModalProduct) return;
        setIsDeleting(true);
        try {
            await fetchApi(`/api/v1/dashboard/products/${deleteModalProduct.id}`, {
                method: "DELETE",
            });
            toast.success(t("toasts.deleteSuccess"));
            setDeleteModalProduct(null);
            loadProducts();
        } catch (err) {
            toast.error(err.message || t("toasts.deleteError"));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6 pb-16">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
                    <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
                        {t("subtitle", { total: totalProducts })}
                    </p>
                </div>
                <Link
                    href="/dashboard/products/create"
                    className="inline-flex items-center justify-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg font-medium text-sm hover:opacity-95 transition-opacity shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    <span>{t("addProduct")}</span>
                </Link>
            </div>

            {/* Search & Filters Toolbar */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 space-y-4 shadow-xs">
                <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                        <input
                            type="text"
                            placeholder={t("searchPlaceholder")}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-[var(--foreground)] rounded-lg text-sm font-medium transition-colors"
                    >
                        {t("search")}
                    </button>
                </form>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[var(--border)]">
                    <select
                        value={branchId}
                        onChange={(e) => { setBranchId(e.target.value); setPage(1); }}
                        className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-xs text-[var(--foreground)] focus:outline-none"
                    >
                        <option value="">{t("allBranches")}</option>
                        {branches.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>

                    <select
                        value={categoryId}
                        onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
                        className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-xs text-[var(--foreground)] focus:outline-none"
                    >
                        <option value="">{t("allCategories")}</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>

                    <select
                        value={status}
                        onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                        className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-xs text-[var(--foreground)] focus:outline-none"
                    >
                        <option value="">{t("allStatuses")}</option>
                        <option value="active">{t("statusActive")}</option>
                        <option value="inactive">{t("statusInactive")}</option>
                    </select>

                    <select
                        value={type}
                        onChange={(e) => { setType(e.target.value); setPage(1); }}
                        className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-xs text-[var(--foreground)] focus:outline-none"
                    >
                        <option value="">{t("allTypes")}</option>
                        <option value="private">{t("typePrivate")}</option>
                        <option value="public">{t("typePublic")}</option>
                    </select>
                </div>
            </div>

            {/* Error state */}
            {error && (
                <div className="p-4 bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 rounded-xl flex items-center justify-between text-[var(--destructive)]">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="text-sm font-semibold">{error}</p>
                    </div>
                    <button
                        onClick={loadProducts}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-xs font-medium rounded-lg hover:bg-[var(--muted)]"
                    >
                        <RefreshCcw className="w-3.5 h-3.5" />
                        <span>{t("retry")}</span>
                    </button>
                </div>
            )}

            {/* Main Content Table / Grid */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
                {isLoading ? (
                    <div className="p-8 space-y-4 animate-pulse">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-12 bg-[var(--muted)] rounded-lg w-full" />
                        ))}
                    </div>
                ) : products.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30 text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                                    <th className="py-3 px-4">{t("table.product")}</th>
                                    <th className="py-3 px-4">{t("table.branch")}</th>
                                    <th className="py-3 px-4">{t("table.category")}</th>
                                    <th className="py-3 px-4">{t("table.pricing")}</th>
                                    <th className="py-3 px-4">{t("table.stock")}</th>
                                    <th className="py-3 px-4">{t("table.type")}</th>
                                    <th className="py-3 px-4">{t("table.createdDate")}</th>
                                    <th className="py-3 px-4">{t("table.status")}</th>
                                    <th className="py-3 px-4 text-right">{t("table.actions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)] text-sm">
                                {products.map((product) => {
                                    const mainPhoto = product.photos?.[0]?.url || "";
                                    const isLowStock = Number(product.stock) <= Number(product.lowStockThreshold);
                                    return (
                                        <tr key={product.id} className="hover:bg-[var(--muted)]/20 transition-colors group">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-[var(--muted)] border border-[var(--border)] overflow-hidden shrink-0 flex items-center justify-center">
                                                        {mainPhoto ? (
                                                            <img src={mainPhoto} alt={product.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Package className="w-4 h-4 text-[var(--muted-foreground)]" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <Link href={`/dashboard/products/${product.id}`} className="font-semibold text-[var(--foreground)] hover:underline">
                                                            {product.name}
                                                        </Link>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-xs text-[var(--muted-foreground)]">
                                                <span className="font-medium text-[var(--foreground)]">{product.branchName || product.branch_name || t("table.na")}</span>
                                            </td>
                                            <td className="py-3 px-4 text-xs text-[var(--muted-foreground)]">
                                                {product.categoryName || product.category_name || product.category?.name || product.categoryId || t("table.na")}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="text-xs font-mono font-medium text-[var(--foreground)]">
                                                    ${Number(product.sellingPrice || 0).toFixed(2)}
                                                </div>
                                                <div className="text-[10px] font-mono text-[var(--muted-foreground)]">
                                                    {t("table.cost")}: ${Number(product.costPrice || 0).toFixed(2)}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`text-xs font-mono font-semibold ${isLowStock ? "text-[var(--destructive)]" : "text-[var(--foreground)]"}`}>
                                                        {product.stock}
                                                    </span>
                                                    {isLowStock && (
                                                        <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-[var(--destructive)]/10 text-[var(--destructive)]">
                                                            {t("table.lowStock")}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${product.type === "public" ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                                                    }`}>
                                                    {product.type === "public" ? t("typePublic") : t("typePrivate")}
                                                </span>
                                            </td>
                                            {/* Created Date & Dayjs Relative Time Column */}
                                            <td className="py-3 px-4 text-xs">
                                                <div className="font-medium text-[var(--foreground)]">
                                                    {product.createdAt ? dayjs(product.createdAt).format("YYYY-MM-DD") : t("table.na")}
                                                </div>
                                                <div className="text-[10px] text-[var(--muted-foreground)] flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{getRelativeTime(product.createdAt)}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <button
                                                    onClick={() => handleStatusToggle(product)}
                                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-opacity hover:opacity-80 ${product.status === "active" ? "bg-[var(--success)]/10 text-[var(--success)]" : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                                                        }`}
                                                    title="Click to toggle status"
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${product.status === "active" ? "bg-[var(--success)]" : "bg-[var(--muted-foreground)]"}`} />
                                                    {product.status === "active" ? t("statusActive") : t("statusInactive")}
                                                </button>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        href={`/dashboard/products/${product.id}`}
                                                        className="p-1.5 hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Link>
                                                    <Link
                                                        href={`/dashboard/products/${product.id}/edit`}
                                                        className="p-1.5 hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-lg transition-colors"
                                                        title="Edit Product"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => setDeleteModalProduct(product)}
                                                        className="p-1.5 hover:bg-[var(--destructive)]/10 text-[var(--muted-foreground)] hover:text-[var(--destructive)] rounded-lg transition-colors"
                                                        title="Delete Product"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-[var(--muted)] flex items-center justify-center mx-auto text-[var(--muted-foreground)]">
                            <Package className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-base">{t("noProducts")}</h3>
                        <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto">
                            {search || branchId || categoryId || status || type
                                ? t("noProductsFilterDesc")
                                : t("noProductsEmptyDesc")}
                        </p>
                    </div>
                )}

                {/* Pagination bar */}
                {!isLoading && totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)]">
                        <span>{t("pageIndicator", { page, totalPages })}</span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                disabled={page === 1}
                                className="p-1.5 border border-[var(--border)] rounded-lg disabled:opacity-40 hover:bg-[var(--muted)]"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                                disabled={page === totalPages}
                                className="p-1.5 border border-[var(--border)] rounded-lg disabled:opacity-40 hover:bg-[var(--muted)]"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModalProduct && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
                        <h3 className="text-lg font-bold text-[var(--foreground)]">{t("deleteModal.title")}</h3>
                        <p className="text-xs text-[var(--muted-foreground)]">
                            {t("deleteModal.description", { name: deleteModalProduct.name })}
                        </p>
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setDeleteModalProduct(null)}
                                className="px-4 py-2 border border-[var(--border)] rounded-lg text-xs font-medium hover:bg-[var(--muted)]"
                            >
                                {t("deleteModal.cancel")}
                            </button>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={handleDeleteProduct}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--destructive)] text-[var(--destructive-foreground)] rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50"
                            >
                                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                <span>{t("deleteModal.delete")}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}