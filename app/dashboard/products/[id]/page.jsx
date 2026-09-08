// file: app/dashboard/products/[id]/page.jsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft, Pencil, Trash2, Package, Tag, Building2,
    DollarSign, CheckCircle2, XCircle, AlertCircle, Loader2
} from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.id;

    const [product, setProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

    const loadProduct = useCallback(async () => {
        if (!productId) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetchApi(`/api/v1/dashboard/products/${productId}`);
            const p = res.data?.product || res.data || res;

            // Map fields to match your backend and JSON schema format
            const mappedProduct = {
                ...p,
                accountId: p.account_id ?? p.accountId,
                branchId: p.branch_id ?? p.branchId,
                branchName: p.branch_name ?? p.branchName,
                categoryId: p.category_id ?? p.categoryId,
                categoryName: p.category_name ?? p.categoryName,
                costPrice: p.cost_price ?? p.costPrice,
                sellingPrice: p.selling_price ?? p.sellingPrice,
                stock: p.stock ?? 0,
                lowStockThreshold: p.low_stock_threshold ?? p.lowStockThreshold ?? 5,
                createdAt: p.created_at ?? p.createdAt,
                updatedAt: p.updated_at ?? p.updatedAt,
                photos: (p.photos || []).map(photo => ({
                    ...photo,
                    productId: photo.product_id ?? photo.productId,
                    objectKey: photo.object_key ?? photo.objectKey,
                    createdAt: photo.created_at ?? photo.createdAt,
                    updatedAt: photo.updated_at ?? photo.updatedAt,
                }))
            };

            setProduct(mappedProduct);
        } catch (err) {
            setError(err.message || "Failed to load product details.");
        } finally {
            setIsLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        loadProduct();
    }, [loadProduct]);

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this product?")) return;
        setIsDeleting(true);
        try {
            await fetchApi(`/api/v1/dashboard/products/${productId}`, {
                method: "DELETE",
            });
            toast.success("Product deleted successfully");
            router.push("/dashboard/products");
        } catch (err) {
            toast.error(err.message || "Failed to delete product.");
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-pulse">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between pb-4 border-b border-(--border)">
                    <div className="flex items-center gap-4">
                        <div className="w-9 h-9 bg-(--muted) rounded-lg" />
                        <div className="space-y-2">
                            <div className="h-5 w-40 bg-(--muted) rounded-md" />
                            <div className="h-3 w-28 bg-(--muted) rounded-md" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-16 bg-(--muted) rounded-lg" />
                        <div className="h-8 w-20 bg-(--muted) rounded-lg" />
                    </div>
                </div>

                {/* Main Content Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <div className="aspect-square w-full bg-(--muted) rounded-xl" />
                        <div className="grid grid-cols-5 gap-2">
                            <div className="aspect-square bg-(--muted) rounded-lg" />
                            <div className="aspect-square bg-(--muted) rounded-lg" />
                        </div>
                    </div>

                    <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-6 shadow-xs flex flex-col justify-between">
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <div className="h-5 w-16 bg-(--muted) rounded-full" />
                                <div className="h-5 w-12 bg-(--muted) rounded" />
                            </div>
                            <div className="space-y-2 pt-2">
                                <div className="h-3 w-24 bg-(--muted) rounded" />
                                <div className="h-12 w-full bg-(--muted) rounded-lg" />
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-(--border)">
                                <div className="space-y-1">
                                    <div className="h-3 w-16 bg-(--muted) rounded" />
                                    <div className="h-4 w-24 bg-(--muted) rounded" />
                                </div>
                                <div className="space-y-1">
                                    <div className="h-3 w-16 bg-(--muted) rounded" />
                                    <div className="h-4 w-24 bg-(--muted) rounded" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-(--border)">
                                <div className="space-y-1">
                                    <div className="h-3 w-20 bg-(--muted) rounded" />
                                    <div className="h-6 w-16 bg-(--muted) rounded" />
                                </div>
                                <div className="space-y-1">
                                    <div className="h-3 w-20 bg-(--muted) rounded" />
                                    <div className="h-6 w-16 bg-(--muted) rounded" />
                                </div>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-(--border) flex justify-between">
                            <div className="h-3 w-28 bg-(--muted) rounded" />
                            <div className="h-3 w-28 bg-(--muted) rounded" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="max-w-4xl mx-auto p-6 space-y-4">
                <div className="p-4 bg-(--destructive)/10 border border-(--destructive)/20 rounded-xl flex items-center gap-3 text-(--destructive)">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-semibold">{error || "Product not found."}</p>
                </div>
                <Link
                    href="/dashboard/products"
                    className="inline-flex items-center gap-2 text-xs font-medium text-(--muted-foreground) hover:text-(--foreground)"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Products</span>
                </Link>
            </div>
        );
    }

    const photos = product.photos || [];
    const activePhoto = photos[selectedPhotoIndex]?.url || "";

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-16">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-(--border)">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/products"
                        className="p-2 border border-(--border) rounded-lg hover:bg-(--muted) text-(--muted-foreground) transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">{product.name}</h1>
                        <p className="text-xs font-mono text-(--muted-foreground)">Slug: {product.slug}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href={`/dashboard/products/${productId}/edit`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-(--border) hover:bg-(--muted) rounded-lg text-xs font-medium transition-colors"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit</span>
                    </Link>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-(--destructive)/10 hover:bg-(--destructive)/20 text-(--destructive) rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                        {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        <span>Delete</span>
                    </button>
                </div>
            </div>

            {/* Main Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Photo Gallery Viewer */}
                <div className="space-y-3">
                    <div className="aspect-square rounded-xl border border-(--border) bg-(--muted) overflow-hidden flex items-center justify-center">
                        {activePhoto ? (
                            <img src={activePhoto} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <Package className="w-12 h-12 text-(--muted-foreground)" />
                        )}
                    </div>
                    {photos.length > 1 && (
                        <div className="grid grid-cols-5 gap-2">
                            {photos.map((photo, idx) => (
                                <button
                                    key={photo.id}
                                    onClick={() => setSelectedPhotoIndex(idx)}
                                    className={`aspect-square rounded-lg border overflow-hidden bg-(--muted) transition-all ${selectedPhotoIndex === idx ? "ring-2 ring-(--primary) border-transparent" : "border-(--border) opacity-70 hover:opacity-100"
                                        }`}
                                >
                                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Metadata Card */}
                <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-6 shadow-xs flex flex-col justify-between">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${product.status === "active" ? "bg-(--success)/10 text-(--success)" : "bg-(--muted) text-(--muted-foreground)"
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${product.status === "active" ? "bg-(--success)" : "bg-(--muted-foreground)"}`} />
                                {product.status}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-(--primary)/10 text-(--primary) text-[10px] font-mono uppercase font-semibold">
                                {product.type}
                            </span>
                        </div>

                        <div>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Description</h3>
                            <p className="text-sm text-(--foreground) mt-1">
                                {product.description || "No description provided."}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-(--border)">
                            <div>
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground) flex items-center gap-1">
                                    <Building2 className="w-3.5 h-3.5" /> Branch
                                </span>
                                <p className="text-sm font-medium text-(--foreground) mt-0.5">
                                    {product.branchName || product.branch_name || "N/A"}
                                </p>
                            </div>
                            <div>
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground) flex items-center gap-1">
                                    <Tag className="w-3.5 h-3.5" /> Category
                                </span>
                                <p className="text-sm font-medium text-(--foreground) mt-0.5">
                                    {product.categoryName || product.category_name || "N/A"}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-(--border)">
                            <div>
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground)">Cost Price</span>
                                <p className="text-base font-mono font-semibold text-(--foreground) mt-0.5">
                                    ${Number(product.costPrice || 0).toFixed(2)}
                                </p>
                            </div>
                            <div>
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground)">Selling Price</span>
                                <p className="text-base font-mono font-semibold text-(--primary) mt-0.5">
                                    ${Number(product.sellingPrice || 0).toFixed(2)}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-(--border)">
                            <div>
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground)">Stock</span>
                                <p className="text-base font-mono font-semibold text-(--foreground) mt-0.5">
                                    {product.stock}
                                </p>
                            </div>
                            <div>
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground)">Low Stock Threshold</span>
                                <p className="text-base font-mono font-semibold text-(--muted-foreground) mt-0.5">
                                    {product.lowStockThreshold}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-(--border) text-[11px] font-mono text-(--muted-foreground) flex justify-between">
                        <span>Created: {new Date(product.createdAt).toLocaleDateString()}</span>
                        <span>Updated: {new Date(product.updatedAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}