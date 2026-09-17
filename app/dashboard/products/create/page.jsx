// file: app/dashboard/products/create/page.jsx

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, X, Loader2, AlertCircle } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function CreateProductPage() {
    const t = useTranslations("dashboard.createProductPage");
    const router = useRouter();
    const fileInputRef = useRef(null);

    const [isLoading, setIsLoading] = useState(false);
    const [branches, setBranches] = useState([]);
    const [categories, setCategories] = useState([]);
    const [error, setError] = useState(null);

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

    const [isPurchased, setIsPurchased] = useState(false);
    const [paymentSource, setPaymentSource] = useState("employee_personal");
    const [purchaseNotes, setPurchaseNotes] = useState("");

    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);

    useEffect(() => {
        async function fetchDropdownData() {
            try {
                const [branchRes, categoryRes] = await Promise.all([
                    fetchApi("/api/v1/dashboard/available-branches?permission=products.create").catch(() => ({ data: [] })),
                    fetchApi("/api/v1/dashboard/categories").catch(() => ({ data: [] })),
                ]);

                setBranches(branchRes.data?.branches || branchRes.data || []);
                setCategories(categoryRes.data?.categories || categoryRes.data || []);
            } catch (err) {
                console.error("Failed to load branches or categories", err);
            }
        }
        fetchDropdownData();
    }, []);

    const handleFilesChange = (e) => {
        const selectedFiles = Array.from(e.target.files || []);

        if (files.length + selectedFiles.length > 6) {
            toast.error(t("errors.maxPhotos"));
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        const validFiles = [];
        const previewsArr = [];

        for (const file of selectedFiles) {
            if (!file.type.startsWith("image/")) {
                toast.error(t("errors.notAnImage", { name: file.name }));
                continue;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error(t("errors.fileTooLarge", { name: file.name }));
                continue;
            }
            validFiles.push(file);
            previewsArr.push(URL.createObjectURL(file));
        }

        setFiles((prev) => [...prev, ...validFiles]);
        setPreviews((prev) => [...prev, ...previewsArr]);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const removeFile = (idx) => {
        URL.revokeObjectURL(previews[idx]);
        setFiles((prev) => prev.filter((_, i) => i !== idx));
        setPreviews((prev) => prev.filter((_, i) => i !== idx));
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (type === "public" && files.length === 0) {
            setError(t("errors.publicRequiresPhoto"));
            return;
        }

        setIsLoading(true);

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

            if (isPurchased) {
                formData.append(
                    "purchase",
                    JSON.stringify({
                        paymentSource,
                        notes: purchaseNotes || null,
                    })
                );
            }

            files.forEach((file) => {
                formData.append("photos", file);
            });

            const res = await fetchApi("/api/v1/dashboard/products", {
                method: "POST",
                body: formData,
            });

            toast.success(t("successMessage"));
            const newProduct = res.data?.product || res.data || res;
            const newId = newProduct?.id;

            if (newId) {
                router.push(`/dashboard/products/${newId}`);
            } else {
                router.push("/dashboard/products");
            }
        } catch (err) {
            setError(err.message || t("errors.createError"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-16">
            <div className="flex items-center gap-4 pb-4 border-b border-[var(--border)]">
                <Link
                    href="/dashboard/products"
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
                            <label className="text-xs font-medium text-[var(--foreground)]">{t("productNameLabel")}</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t("productNamePlaceholder")}
                                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[var(--foreground)]">{t("descriptionLabel")}</label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t("descriptionPlaceholder")}
                            className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[var(--foreground)]">{t("branchLabel")}</label>
                            <select
                                value={branchId}
                                onChange={(e) => setBranchId(e.target.value)}
                                required
                                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none"
                            >
                                <option value="">{t("selectBranch")}</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[var(--foreground)]">{t("categoryLabel")}</label>
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                required
                                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none"
                            >
                                <option value="">{t("selectCategory")}</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[var(--foreground)]">{t("typeLabel")}</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none"
                            >
                                <option value="public">{t("typePublic")}</option>
                                <option value="private">{t("typePrivate")}</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4 shadow-xs">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">{t("pricingAndStatus")}</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[var(--foreground)]">{t("costPriceLabel")}</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={costPrice}
                                onChange={(e) => setCostPrice(e.target.value)}
                                onWheel={(e) => e.currentTarget.blur()}
                                placeholder={t("costPricePlaceholder")}
                                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm font-mono focus:outline-none"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[var(--foreground)]">{t("sellingPriceLabel")}</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                value={sellingPrice}
                                onChange={(e) => setSellingPrice(e.target.value)}
                                onWheel={(e) => e.currentTarget.blur()}
                                placeholder={t("sellingPricePlaceholder")}
                                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm font-mono focus:outline-none"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[var(--foreground)]">{t("statusLabel")}</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none"
                            >
                                <option value="active">{t("statusActive")}</option>
                                <option value="inactive">{t("statusInactive")}</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4 shadow-xs">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">{t("inventory")}</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[var(--foreground)]">{t("stockLabel")}</label>
                            <input
                                type="number"
                                min={0}
                                step={1}
                                required
                                value={stock}
                                onChange={(e) => setStock(e.target.value)}
                                onWheel={(e) => e.currentTarget.blur()}
                                placeholder={t("stockPlaceholder")}
                                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm font-mono focus:outline-none"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[var(--foreground)]">{t("lowStockThresholdLabel")}</label>
                            <input
                                type="number"
                                min={0}
                                step={1}
                                required
                                value={lowStockThreshold}
                                onChange={(e) => setLowStockThreshold(e.target.value)}
                                onWheel={(e) => e.currentTarget.blur()}
                                placeholder={t("lowStockThresholdPlaceholder")}
                                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm font-mono focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4 shadow-xs">
                    <div>
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">{t("productAcquisition")}</h2>
                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{t("productAcquisitionSub")}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <label
                            onClick={() => setIsPurchased(false)}
                            className={`flex flex-col p-3.5 rounded-lg border cursor-pointer transition-colors ${!isPurchased
                                ? "border-[var(--primary)] bg-[var(--primary)]/5"
                                : "border-[var(--border)] hover:bg-[var(--muted)]/50"
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="acquisition_type"
                                    checked={!isPurchased}
                                    onChange={() => setIsPurchased(false)}
                                    className="accent-[var(--primary)]"
                                />
                                <span className="text-xs font-semibold text-[var(--foreground)]">{t("addedToCatalogOnly")}</span>
                            </div>
                            <span className="text-[11px] text-[var(--muted-foreground)] mt-1 pl-5">
                                {t("addedToCatalogOnlyDesc")}
                            </span>
                        </label>

                        <label
                            onClick={() => setIsPurchased(true)}
                            className={`flex flex-col p-3.5 rounded-lg border cursor-pointer transition-colors ${isPurchased
                                ? "border-[var(--primary)] bg-[var(--primary)]/5"
                                : "border-[var(--border)] hover:bg-[var(--muted)]/50"
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="acquisition_type"
                                    checked={isPurchased}
                                    onChange={() => setIsPurchased(true)}
                                    className="accent-[var(--primary)]"
                                />
                                <span className="text-xs font-semibold text-[var(--foreground)]">{t("purchasedForBranch")}</span>
                            </div>
                            <span className="text-[11px] text-[var(--muted-foreground)] mt-1 pl-5">
                                {t("purchasedForBranchDesc")}
                            </span>
                        </label>
                    </div>

                    {isPurchased && (
                        <div className="space-y-4 pt-3 border-t border-[var(--border)] animate-in fade-in duration-200">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-[var(--foreground)]">{t("paymentSourceLabel")}</label>
                                <select
                                    value={paymentSource}
                                    onChange={(e) => setPaymentSource(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none"
                                >
                                    <option value="employee_personal">{t("paymentSourceEmployee")}</option>
                                    <option value="supplier_credit">{t("paymentSourceSupplier")}</option>
                                    <option value="other">{t("paymentSourceOther")}</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-[var(--foreground)]">{t("purchaseNotesLabel")}</label>
                                <textarea
                                    rows={2}
                                    value={purchaseNotes}
                                    onChange={(e) => setPurchaseNotes(e.target.value)}
                                    placeholder={t("purchaseNotesPlaceholder")}
                                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4 shadow-xs">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">{t("photos")}</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                        {previews.map((src, idx) => (
                            <div key={idx} className="relative group aspect-square rounded-lg border border-[var(--border)] overflow-hidden bg-[var(--muted)]">
                                <img src={src} alt="Preview" className="w-full h-full object-cover" />
                                {idx === 0 && (
                                    <span className="absolute top-1 left-1 bg-[var(--primary)] text-[var(--primary-foreground)] text-[9px] font-bold px-1.5 py-0.5 rounded">
                                        {t("mainTag")}
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => removeFile(idx)}
                                    className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}

                        {files.length < 6 && (
                            <label className="border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] rounded-lg aspect-square flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50">
                                <Upload className="w-5 h-5 animate-bounce" />
                                <span className="text-[10px] font-medium">{t("addPhoto")}</span>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleFilesChange}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                    <Link
                        href="/dashboard/products"
                        className="px-4 py-2 border border-[var(--border)] rounded-lg text-xs font-medium hover:bg-[var(--muted)]"
                    >
                        {t("cancel")}
                    </Link>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] px-5 py-2 rounded-lg text-xs font-medium hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>{t("createProduct")}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}