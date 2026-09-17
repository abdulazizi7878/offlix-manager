"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, Landmark, Wallet, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";

export default function CreateAccountPage() {
    const t = useTranslations("dashboard.createMoneyAccountPage");
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        type: "cash",
        name: "",
        bankName: "",
        accountIdentifier: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error(t("messages.nameRequired"));
            return;
        }

        setLoading(true);
        try {
            const payload = {
                type: formData.type,
                name: formData.name,
                ...(formData.type === "bank" && {
                    bankName: formData.bankName,
                    accountIdentifier: formData.accountIdentifier
                })
            };

            await fetchApi("/api/v1/dashboard/money/accounts", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            toast.success(t("messages.createSuccess"));
            router.push("/dashboard/money/accounts");
            router.refresh();
        } catch (err) {
            toast.error(err.message || t("messages.createError"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/money/accounts"
                    className="p-2 rounded-lg bg-(--muted) text-(--muted-foreground) hover:text-(--foreground) transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                    <h2 className="text-xl font-bold tracking-tight">{t("title")}</h2>
                    <p className="text-sm text-(--muted-foreground)">{t("subtitle")}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-(--card) border border-(--border) rounded-xl p-6 space-y-6 shadow-xs">
                {/* Account Type Selection */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-(--muted-foreground) uppercase tracking-wider">{t("accountType")}</label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, type: "cash" }))}
                            className={`flex items-center justify-center gap-2.5 p-3.5 rounded-lg border text-sm font-medium transition-all ${formData.type === "cash"
                                ? "border-(--primary) bg-(--primary)/10 text-(--primary)"
                                : "border-(--border) text-(--muted-foreground) hover:border-(--muted-foreground)"
                                }`}
                        >
                            <Wallet className="w-4 h-4" />
                            <span>{t("cashAccount")}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, type: "bank" }))}
                            className={`flex items-center justify-center gap-2.5 p-3.5 rounded-lg border text-sm font-medium transition-all ${formData.type === "bank"
                                ? "border-(--primary) bg-(--primary)/10 text-(--primary)"
                                : "border-(--border) text-(--muted-foreground) hover:border-(--muted-foreground)"
                                }`}
                        >
                            <Landmark className="w-4 h-4" />
                            <span>{t("bankAccount")}</span>
                        </button>
                    </div>
                </div>

                {/* Account Name */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-(--muted-foreground) uppercase tracking-wider">{t("accountName")}</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder={t("namePlaceholder")}
                        required
                        className="w-full px-3.5 py-2.5 rounded-lg bg-(--background) border border-(--border) text-sm focus:outline-none focus:ring-2 focus:ring-(--primary)"
                    />
                </div>

                {/* Bank-Specific Fields */}
                {formData.type === "bank" && (
                    <div className="space-y-4 pt-2 border-t border-(--border)">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-(--muted-foreground) uppercase tracking-wider">{t("bankName")}</label>
                            <input
                                type="text"
                                name="bankName"
                                value={formData.bankName}
                                onChange={handleChange}
                                placeholder={t("bankNamePlaceholder")}
                                required={formData.type === "bank"}
                                className="w-full px-3.5 py-2.5 rounded-lg bg-(--background) border border-(--border) text-sm focus:outline-none focus:ring-2 focus:ring-(--primary)"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-(--muted-foreground) uppercase tracking-wider">{t("accountIdentifier")}</label>
                            <input
                                type="text"
                                name="accountIdentifier"
                                value={formData.accountIdentifier}
                                onChange={handleChange}
                                placeholder={t("identifierPlaceholder")}
                                required={formData.type === "bank"}
                                className="w-full px-3.5 py-2.5 rounded-lg bg-(--background) border border-(--border) text-sm focus:outline-none focus:ring-2 focus:ring-(--primary)"
                            />
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-(--border)">
                    <Link
                        href="/dashboard/money/accounts"
                        className="px-4 py-2 rounded-lg bg-(--muted) text-(--muted-foreground) font-medium text-sm hover:text-(--foreground) transition-colors"
                    >
                        {t("cancel")}
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-(--primary) text-(--primary-foreground) font-medium text-sm hover:opacity-95 disabled:opacity-50 transition-opacity"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>{t("createAccount")}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}