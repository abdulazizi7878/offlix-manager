// file: app/dashboard/products/create/page.jsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, X, Plus, Loader2, AlertCircle } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";

export default function CreateProductPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [branches, setBranches] = useState([]);
    const [categories, setCategories] = useState([]);
    const [error, setError] = useState(null);

    // Form State
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [description, setDescription] = useState("");
    const [branchId, setBranchId] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [type, setType] = useState("public");
    const [costPrice, setCostPrice] = useState("");
    const [sellingPrice, setSellingPrice] = useState("");
    const [status, setStatus] = useState("active");

    // Photos state
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previews, setPreviews] = useState([]);

    // Load branches and categories on mount
    useEffect(() => {
        async function loadMetadata() {
            try {
                const [branchRes, categoryRes] = await Promise.all([
                    fetchApi("/api/v1/dashboard/branches").catch(() => ({ data: [] })),
                    fetchApi("/api/v1/dashboard/categories").catch(() => ({ data: [] })),
                ]);
                const branchList = branchRes.data?.branches || branchRes.data || [];
                const categoryList = categoryRes.data?.categories || categoryRes.data || [];

                setBranches(branchList);
                setCategories(categoryList);

                if (branchList.length > 0) setBranchId(branchList[0].id);
                if (categoryList.length > 0) setCategoryId(categoryList[0].id);
            } catch (err) {
                console.error("Failed to fetch metadata", err);
            }
        }
        loadMetadata();
    }, []);

    // Auto-generate slug from name
    useEffect(() => {
        if (name) {
            const generated = name
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, "")
                .replace(/[\s_-]+/g, "-")
                .replace(/^-+|-+$/g, "");
            setSlug(generated);
        }
    }, [name]);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (selectedFiles.length + files.length > 6) {
            toast.error("You can upload up to 6 photos.");
            return;
        }

        const validFiles = [];
        const newPreviews = [];

        for (const file of files) {
            if (!file.type.startsWith("image/")) {
                toast.error(`${file.name} is not an image file.`);
                continue;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} exceeds 5MB size limit.`);
                continue;
            }
            validFiles.push(file);
            newPreviews.push(URL.createObjectURL(file));
        }

        setSelectedFiles((prev) => [...prev, ...validFiles]);
        setPreviews((prev) => [...prev, ...newPreviews]);
    };

    const removePhoto = (index) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
        setPreviews((prev) => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Basic validation
        if (name.length < 2 || name.length > 150) {
            setError("Name must be between 2 and 150 characters.");
            return;
        }
        if (type === "public" && selectedFiles.length === 0) {
            setError("Public products must have at least one photo.");
            return;
        }

        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("slug", slug);
            formData.append("description", description);
            formData.append("branchId", branchId);
            formData.append("categoryId", categoryId);
            formData.append("type", type);
            formData.append("costPrice", costPrice || "0");
            formData.append("sellingPrice", sellingPrice || "0");
            formData.append("status", status);

            selectedFiles.forEach((file) => {
                formData.append("photos", file);
            });

            await fetchApi("/api/v1/dashboard/products", {
                method: "POST",
                body: formData,
                // Let browser handle multipart boundary headers automatically
                headers: {},
            });

            toast.success("Product created successfully!");
            router.push("/dashboard/products");
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
                    className="p-2 border border-(--border) rounded-lg hover:bg-(--muted) transition-colors text-(--muted-foreground)"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Create Product</h1>
                    <p className="text-xs text-(--muted-foreground)">Add a new item to your inventory catalog.</p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-(--destructive)/10 border border-(--destructive)/20 rounded-xl flex items-center gap-3 text-(--destructive)">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-xs font-semibold">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info */}
                <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground)">General Information</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-(--foreground)">Product Name *</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Wireless Mechanical Keyboard"
                                className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--ring)"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-(--foreground)">Slug *</label>
                            <input
                                type="text"
                                required
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                placeholder="wireless-mechanical-keyboard"
                                className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-lg text-sm font-mono text-xs focus:outline-none focus:ring-2 focus:ring-(--ring)"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-(--foreground)">Description</label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Detailed product features and description..."
                            className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--ring)"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-(--foreground)">Branch *</label>
                            <select
                                value={branchId}
                                onChange={(e) => setBranchId(e.target.value)}
                                className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-lg text-sm focus:outline-none"
                            >
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
                                className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-lg text-sm focus:outline-none"
                            >
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

                {/* Pricing & Status */}
                <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground)">Pricing & Status</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-(--foreground)">Cost Price ($)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={costPrice}
                                onChange={(e) => setCostPrice(e.target.value)}
                                placeholder="0.00"
                                className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-lg text-sm font-mono focus:outline-none"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-(--foreground)">Selling Price ($) *</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                value={sellingPrice}
                                onChange={(e) => setSellingPrice(e.target.value)}
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

                {/* Product Photos */}
                <div className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-(--muted-foreground)">Product Photos (Max 6)</h2>
                        <span className="text-xs text-(--muted-foreground)">{selectedFiles.length}/6 uploaded</span>
                    </div>

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
                                    onClick={() => removePhoto(idx)}
                                    className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}

                        {selectedFiles.length < 6 && (
                            <label className="border-2 border-dashed border-(--border) hover:border-(--primary) rounded-lg aspect-square flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors text-(--muted-foreground) hover:text-(--foreground)">
                                <Upload className="w-5 h-5" />
                                <span className="text-[10px] font-medium">Add Photo</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleFileChange}
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
                        className="inline-flex items-center gap-2 bg-(--primary) text-(--primary-foreground) px-5 py-2 rounded-lg text-xs font-medium hover:opacity-95 disabled:opacity-50"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>Save Product</span>
                    </button>
                </div>
            </form>
        </div>
    );
}