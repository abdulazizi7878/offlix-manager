"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, X, Loader2, AlertCircle } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";

export default function CreateProductPage() {
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
            toast.error("Maximum 6 photos allowed in total.");
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        const validFiles = [];
        const previewsArr = [];

        for (const file of selectedFiles) {
            if (!file.type.startsWith("image/")) {
                toast.error(`${file.name} is not an image.`);
                continue;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} is larger than 5MB.`);
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
            setError("Public products require at least one photo.");
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

            toast.success("Product created successfully!");
            const newProduct = res.data?.product || res.data || res;
            const newId = newProduct?.id;

            if (newId) {
                router.push(`/dashboard/products/${newId}`);
            } else {
                router.push("/dashboard/products");
            }
        } catch (err) {
            setError(err.message || "Failed to create product.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-16">
            <div className="flex items-center gap-4 pb-4 border-b border-(--border)">
                <Link
                    href="/dashboard/products"
                    className="p-2 border border-(--border) rounded-lg hover:bg-(--muted) text-(--muted-foreground) transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Create Product</h1>
                    <p className="text-xs text-(--muted-foreground)">Add a new product to your inventory.</p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-(--destructive)/10 border border-(--destructive)/20 rounded-xl flex items-center gap-3 text-(--destructive)">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-xs font-semibold">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground)">General Information</h2>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-(--foreground)">Product Name *</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Wireless Mouse"
                                className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-lg text-sm focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-(--foreground)">Description</label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Detailed description of the product..."
                            className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-lg text-sm focus:outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-(--foreground)">Branch *</label>
                            <select
                                value={branchId}
                                onChange={(e) => setBranchId(e.target.value)}
                                required
                                className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-lg text-sm focus:outline-none"
                            >
                                <option value="">Select Branch</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-(--foreground)">Category *</label>
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                required
                                className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-lg text-sm focus:outline-none"
                            >
                                <option value="">Select Category</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-(--foreground)">Product Type *</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-lg text-sm focus:outline-none"
                            >
                                <option value="public">Public</option>
                                <option value="private">Private</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground)">Pricing & Status</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-(--foreground)">Cost Price (ETB)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={costPrice}
                                onChange={(e) => setCostPrice(e.target.value)}
                                onWheel={(e) => e.currentTarget.blur()}
                                placeholder="0.00"
                                className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-lg text-sm font-mono focus:outline-none"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-(--foreground)">Selling Price (ETB) *</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                value={sellingPrice}
                                onChange={(e) => setSellingPrice(e.target.value)}
                                onWheel={(e) => e.currentTarget.blur()}
                                placeholder="0.00"
                                className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-lg text-sm font-mono focus:outline-none"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-(--foreground)">Status *</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-lg text-sm focus:outline-none"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground)">Inventory</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-(--foreground)">Stock *</label>
                            <input
                                type="number"
                                min={0}
                                step={1}
                                required
                                value={stock}
                                onChange={(e) => setStock(e.target.value)}
                                onWheel={(e) => e.currentTarget.blur()}
                                placeholder="0"
                                className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-lg text-sm font-mono focus:outline-none"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-(--foreground)">Low Stock Threshold *</label>
                            <input
                                type="number"
                                min={0}
                                step={1}
                                required
                                value={lowStockThreshold}
                                onChange={(e) => setLowStockThreshold(e.target.value)}
                                onWheel={(e) => e.currentTarget.blur()}
                                placeholder="5"
                                className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-lg text-sm font-mono focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                    <div>
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground)">Product Acquisition</h2>
                        <p className="text-xs text-(--muted-foreground) mt-0.5">Record how this branch obtained the product.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <label
                            onClick={() => setIsPurchased(false)}
                            className={`flex flex-col p-3.5 rounded-lg border cursor-pointer transition-colors ${!isPurchased
                                ? "border-(--primary) bg-(--primary)/5"
                                : "border-(--border) hover:bg-(--muted)/50"
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
                                <span className="text-xs font-semibold text-(--foreground)">Added to catalog only</span>
                            </div>
                            <span className="text-[11px] text-(--muted-foreground) mt-1 pl-5">
                                The product is being added without recording an acquisition.
                            </span>
                        </label>

                        <label
                            onClick={() => setIsPurchased(true)}
                            className={`flex flex-col p-3.5 rounded-lg border cursor-pointer transition-colors ${isPurchased
                                ? "border-(--primary) bg-(--primary)/5"
                                : "border-(--border) hover:bg-(--muted)/50"
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
                                <span className="text-xs font-semibold text-(--foreground)">Purchased for this branch</span>
                            </div>
                            <span className="text-[11px] text-(--muted-foreground) mt-1 pl-5">
                                Record this inventory acquisition without changing business money.
                            </span>
                        </label>
                    </div>

                    {isPurchased && (
                        <div className="space-y-4 pt-3 border-t border-(--border) animate-in fade-in duration-200">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-(--foreground)">Payment Source *</label>
                                <select
                                    value={paymentSource}
                                    onChange={(e) => setPaymentSource(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-lg text-sm focus:outline-none"
                                >
                                    <option value="employee_personal">Employee personally</option>
                                    <option value="supplier_credit">Supplier credit</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-(--foreground)">Purchase Notes</label>
                                <textarea
                                    rows={2}
                                    value={purchaseNotes}
                                    onChange={(e) => setPurchaseNotes(e.target.value)}
                                    placeholder="Optional notes about this acquisition..."
                                    className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-lg text-sm focus:outline-none"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground)">Photos</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                        {previews.map((src, idx) => (
                            <div key={idx} className="relative group aspect-square rounded-lg border border-(--border) overflow-hidden bg-(--muted)">
                                <img src={src} alt="Preview" className="w-full h-full object-cover" />
                                {idx === 0 && (
                                    <span className="absolute top-1 left-1 bg-(--primary) text-(--primary-foreground) text-[9px] font-bold px-1.5 py-0.5 rounded">
                                        MAIN
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
                            <label className="border-2 border-dashed border-(--border) hover:border-(--primary) rounded-lg aspect-square flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50">
                                <Upload className="w-5 h-5 animate-bounce" />
                                <span className="text-[10px] font-medium">Add Photo</span>
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
                        className="px-4 py-2 border border-(--border) rounded-lg text-xs font-medium hover:bg-(--muted)"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 bg-(--primary) text-(--primary-foreground) px-5 py-2 rounded-lg text-xs font-medium hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>Create Product</span>
                    </button>
                </div>
            </form>
        </div>
    );
}