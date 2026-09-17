// file: app/dashboard/products/[id]/edit/page.jsx

"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, X, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function EditProductPage() {
    const t = useTranslations("dashboard.productEdit");
    const tDetail = useTranslations("dashboard.productDetail");
    const params = useParams();
    const router = useRouter();
    const productId = params.id;
    const fileInputRef = useRef(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [branches, setBranches] = useState([]);
    const [categories, setCategories] = useState([]);
    const [error, setError] = useState(null);

    const [initialState, setInitialState] = useState(null);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [branchId, setBranchId] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [type, setType] = useState("public");
    const [costPrice, setCostPrice] = useState("");
    const [sellingPrice, setSellingPrice] = useState("");
    const [status, setStatus] = useState("active");
    const [stock, setStock] = useState("0");
    const [lowStockThreshold, setLowStockThreshold] = useState("5");

    const [existingPhotos, setExistingPhotos] = useState([]);
    const [newFiles, setNewFiles] = useState([]);
    const [newPreviews, setNewPreviews] = useState([]);
    const [initialPhotoIds, setInitialPhotoIds] = useState([]);
    const [deletingPhotoId, setDeletingPhotoId] = useState(null);
    const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

    const loadData = useCallback(async () => {
        if (!productId) return;
        setIsLoading(true);
        try {
            const [branchRes, categoryRes, productRes] = await Promise.all([
                fetchApi("/api/v1/dashboard/branches").catch(() => ({ data: [] })),
                fetchApi("/api/v1/dashboard/categories").catch(() => ({ data: [] })),
                fetchApi(`/api/v1/dashboard/products/${productId}`),
            ]);

            setBranches(branchRes.data?.branches || branchRes.data || []);
            setCategories(categoryRes.data?.categories || categoryRes.data || []);

            const p = productRes.data?.product || productRes.data || productRes;
            const rawPhotos = productRes.data?.photos || p.photos || [];

            const fetchedName = p.name || "";
            const fetchedDescription = p.description || "";
            const fetchedBranchId = String(p.branch_id ?? p.branchId ?? "");
            const fetchedCategoryId = String(p.category_id ?? p.categoryId ?? "");
            const fetchedType = p.type || "public";
            const fetchedCostPrice = String(p.cost_price ?? p.costPrice ?? "");
            const fetchedSellingPrice = String(p.selling_price ?? p.sellingPrice ?? "");
            const fetchedStatus = p.status || "active";
            const fetchedStock = String(p.stock ?? "0");
            const fetchedLowStockThreshold = String(p.low_stock_threshold ?? p.lowStockThreshold ?? "5");

            setName(fetchedName);
            setDescription(fetchedDescription);
            setBranchId(fetchedBranchId);
            setCategoryId(fetchedCategoryId);
            setType(fetchedType);
            setCostPrice(fetchedCostPrice);
            setSellingPrice(fetchedSellingPrice);
            setStatus(fetchedStatus);
            setStock(fetchedStock);
            setLowStockThreshold(fetchedLowStockThreshold);

            const formattedPhotos = rawPhotos.map(photo => ({
                ...photo,
                productId: photo.product_id ?? photo.productId,
                objectKey: photo.object_key ?? photo.objectKey,
                createdAt: photo.created_at ?? photo.createdAt,
                updatedAt: photo.updated_at ?? photo.updatedAt,
            }));

            setExistingPhotos(formattedPhotos);
            setInitialPhotoIds(formattedPhotos.map(photo => photo.id));

            setInitialState({
                name: fetchedName,
                description: fetchedDescription,
                branchId: fetchedBranchId,
                categoryId: fetchedCategoryId,
                type: fetchedType,
                costPrice: fetchedCostPrice,
                sellingPrice: fetchedSellingPrice,
                status: fetchedStatus,
                stock: fetchedStock,
                lowStockThreshold: fetchedLowStockThreshold,
                photoIds: formattedPhotos.map(photo => photo.id).sort().join(",")
            });

        } catch (err) {
            setError(err.message || t("loadError"));
        } finally {
            setIsLoading(false);
        }
    }, [productId, t]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const isDirty = useMemo(() => {
        if (!initialState) return false;

        const currentPhotoIdsStr = existingPhotos.map(p => p.id).sort().join(",");
        const hasNewPhotos = newFiles.length > 0;
        const photosChanged = currentPhotoIdsStr !== initialState.photoIds || hasNewPhotos;

        const fieldsChanged =
            name !== initialState.name ||
            description !== initialState.description ||
            branchId !== initialState.branchId ||
            categoryId !== initialState.categoryId ||
            type !== initialState.type ||
            costPrice !== initialState.costPrice ||
            sellingPrice !== initialState.sellingPrice ||
            status !== initialState.status ||
            stock !== initialState.stock ||
            lowStockThreshold !== initialState.lowStockThreshold;

        return fieldsChanged || photosChanged;
    }, [initialState, name, description, branchId, categoryId, type, costPrice, sellingPrice, status, stock, lowStockThreshold, existingPhotos, newFiles]);

    const handleNewFilesChange = (e) => {
        const files = Array.from(e.target.files || []);
        const totalCurrentCount = existingPhotos.length + newFiles.length;

        if (totalCurrentCount + files.length > 6) {
            toast.error(t("maxPhotosError"));
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        const validFiles = [];
        const previewsArr = [];

        for (const file of files) {
            if (!file.type.startsWith("image/")) {
                toast.error(t("invalidImageError", { name: file.name }));
                continue;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error(t("sizeError", { name: file.name }));
                continue;
            }
            validFiles.push(file);
            previewsArr.push(URL.createObjectURL(file));
        }

        setNewFiles((prev) => [...prev, ...validFiles]);
        setNewPreviews((prev) => [...prev, ...previewsArr]);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const removeNewFile = (idx) => {
        URL.revokeObjectURL(newPreviews[idx]);
        setNewFiles((prev) => prev.filter((_, i) => i !== idx));
        setNewPreviews((prev) => prev.filter((_, i) => i !== idx));
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const deleteExistingPhoto = async (photoId) => {
        if (type === "public" && (existingPhotos.length + newFiles.length === 1)) {
            toast.error(t("publicPhotoRequired"));
            return;
        }
        setDeletingPhotoId(photoId);
        try {
            await fetchApi(`/api/v1/dashboard/products/${productId}/photos/${photoId}`, {
                method: "DELETE",
            });
            setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
            toast.success(t("photoRemoved"));
        } catch (err) {
            setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
            toast.success(t("photoRemoved"));
        } finally {
            setDeletingPhotoId(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (
            type === "public" &&
            existingPhotos.length + newFiles.length === 0
        ) {
            setError(t("publicPhotoRequired"));
            return;
        }

        setIsSaving(true);

        try {
            const formData = new FormData();

            formData.append("name", name);
            formData.append("description", description);
            formData.append("branchId", branchId);
            formData.append("categoryId", categoryId);
            formData.append("type", type);
            formData.append("costPrice", costPrice || "0");
            formData.append("sellingPrice", sellingPrice || "0");
            formData.append("status", status);
            formData.append("stock", stock !== "" ? stock : "0");
            formData.append("lowStockThreshold", lowStockThreshold !== "" ? lowStockThreshold : "5");

            await fetchApi(
                `/api/v1/dashboard/products/${productId}`,
                {
                    method: "PATCH",
                    body: formData,
                }
            );

            if (newFiles.length > 0) {
                setIsUploadingPhotos(true);

                const photoFormData = new FormData();

                newFiles.forEach((file) => {
                    photoFormData.append("photos", file);
                });

                const uploadRes = await fetchApi(
                    `/api/v1/dashboard/products/${productId}/photos`,
                    {
                        method: "POST",
                        body: photoFormData,
                    }
                );

                const uploadedPhotos = uploadRes.photos || [];

                const formattedPhotos = uploadedPhotos.map((photo) => ({
                    ...photo,
                    productId:
                        photo.product_id ?? photo.productId,
                    objectKey:
                        photo.object_key ?? photo.objectKey,
                    createdAt:
                        photo.created_at ?? photo.createdAt,
                    updatedAt:
                        photo.updated_at ?? photo.updatedAt,
                }));

                setExistingPhotos(formattedPhotos);

                newPreviews.forEach((url) => {
                    URL.revokeObjectURL(url);
                });

                setNewFiles([]);
                setNewPreviews([]);

                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }

                setIsUploadingPhotos(false);
            }

            toast.success(t("updateSuccess"));
            await loadData();

        } catch (error) {
            if (error.code) {
                throw error;
            }

            throw {
                code: "NETWORK_ERROR",
                message:
                    "Network error. Please check your connection and try again.",
                fields: {},
            };
        } finally {
            setIsSaving(false);
            setIsUploadingPhotos(false);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-pulse">
                <div className="flex items-center gap-4 pb-4 border-b border-[var(--border)]">
                    <div className="w-9 h-9 bg-[var(--muted)] rounded-lg" />
                    <div className="space-y-2">
                        <div className="h-5 w-32 bg-[var(--muted)] rounded-md" />
                        <div className="h-3 w-48 bg-[var(--muted)] rounded-md" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-16">
            <div className="flex items-center gap-4 pb-4 border-b border-[var(--border)]">
                <Link
                    href={`/dashboard/products/${productId}`}
                    className="p-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">{t("title")}</h1>
                    <p className="text-xs text-[var(--muted-foreground)]">{t("subtitle")}</p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 rounded-xl flex items-center gap-3 text-[var(--destructive)]">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-xs font-semibold">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4 shadow-xs">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">{t("generalInfo")}</h2>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[var(--foreground)]">{t("productName")} *</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[var(--foreground)]">{t("description")}</label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[var(--foreground)]">{t("branch")} *</label>
                            <select
                                value={branchId}
                                onChange={(e) => setBranchId(e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none"
                            >
                                <option value="">{t("selectBranch")}</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[var(--foreground)]">{t("category")} *</label>
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none"
                            >
                                <option value="">{t("selectCategory")}</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[var(--foreground)]">{t("productType")} *</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none"
                            >
                                <option value="public">{tDetail("typePublic")}</option>
                                <option value="private">{tDetail("typePrivate")}</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4 shadow-xs">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">{t("pricingStatus")}</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[var(--foreground)]">{t("costPrice")}</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={costPrice}
                                onChange={(e) => setCostPrice(e.target.value)}
                                onWheel={(e) => e.currentTarget.blur()}
                                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm font-mono focus:outline-none"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[var(--foreground)]">{t("sellingPrice")} *</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                value={sellingPrice}
                                onChange={(e) => setSellingPrice(e.target.value)}
                                onWheel={(e) => e.currentTarget.blur()}
                                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm font-mono focus:outline-none"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[var(--foreground)]">{t("status")} *</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none"
                            >
                                <option value="active">{tDetail("statusActive")}</option>
                                <option value="inactive">{tDetail("statusInactive")}</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4 shadow-xs">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">{t("inventory")}</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[var(--foreground)]">{t("stock")} *</label>
                            <input
                                type="number"
                                min={0}
                                step={1}
                                required
                                value={stock}
                                onChange={(e) => setStock(e.target.value)}
                                onWheel={(e) => e.currentTarget.blur()}
                                placeholder="0"
                                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm font-mono focus:outline-none"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[var(--foreground)]">{t("lowStockThreshold")} *</label>
                            <input
                                type="number"
                                min={0}
                                step={1}
                                required
                                value={lowStockThreshold}
                                onChange={(e) => setLowStockThreshold(e.target.value)}
                                onWheel={(e) => e.currentTarget.blur()}
                                placeholder="5"
                                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm font-mono focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4 shadow-xs">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">{t("managePhotos")}</h2>

                    <div className="space-y-2">
                        <p className="text-xs text-[var(--muted-foreground)]">{t("existingPhotos")}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                            {existingPhotos.map((photo, idx) => {
                                const isDeleting = deletingPhotoId === photo.id;
                                return (
                                    <div
                                        key={photo.id}
                                        className={`relative group aspect-square rounded-lg border border-[var(--border)] overflow-hidden bg-[var(--muted)] transition-all duration-300 transform ${isDeleting ? "scale-90 opacity-0 animate-pulse" : "scale-100 opacity-100"
                                            }`}
                                    >
                                        <img src={photo.url} alt="" className="w-full h-full object-cover" />
                                        {idx === 0 && !isDeleting && (
                                            <span className="absolute top-1 left-1 bg-[var(--primary)] text-[var(--primary-foreground)] text-[9px] font-bold px-1.5 py-0.5 rounded">
                                                {t("mainTag")}
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            disabled={isDeleting}
                                            onClick={() => deleteExistingPhoto(photo.id)}
                                            className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                                            title="Delete photo"
                                        >
                                            {isDeleting ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                            {existingPhotos.length === 0 && (
                                <p className="text-xs text-[var(--muted-foreground)] italic col-span-full">{t("noExistingPhotos")}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-[var(--border)]">
                        <p className="text-xs text-[var(--muted-foreground)]">{t("addNewPhotos")}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                            {newPreviews.map((src, idx) => (
                                <div key={idx} className="relative group aspect-square rounded-lg border border-[var(--border)] overflow-hidden bg-[var(--muted)] transition-all duration-300 animate-in fade-in zoom-in-95 shadow-sm">
                                    <img src={src} alt="New Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    <button
                                        type="button"
                                        onClick={() => removeNewFile(idx)}
                                        className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}

                            {existingPhotos.length + newFiles.length < 6 && (
                                <label className="border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] rounded-lg aspect-square flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50">
                                    <Upload className="w-5 h-5 animate-bounce" />
                                    <span className="text-[10px] font-medium">{t("addPhoto")}</span>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleNewFilesChange}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                    <Link
                        href={`/dashboard/products/${productId}`}
                        className="px-4 py-2 border border-[var(--border)] rounded-lg text-xs font-medium hover:bg-[var(--muted)]"
                    >
                        {t("cancel")}
                    </Link>
                    <button
                        type="submit"
                        disabled={isSaving || !isDirty}
                        className="inline-flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] px-5 py-2 rounded-lg text-xs font-medium hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {(isSaving || isUploadingPhotos) && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>{isUploadingPhotos ? t("uploadingPhotos") : t("updateProduct")}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}