// file: app/dashboard/users/create/page.jsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, Check, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function CreateUserPage() {
    const t = useTranslations("dashboard.createUserPage");
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ name: "", phone: "", email: "" });
    const [errors, setErrors] = useState({});
    const [createdResult, setCreatedResult] = useState(null);
    const [copied, setCopied] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setErrors({ name: t("validation.nameRequired") });
            return;
        }
        if (!formData.phone.trim()) {
            setErrors({ phone: t("validation.phoneRequired") });
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            const payload = {
                name: formData.name.trim(),
                phone: formData.phone.trim(),
            };
            if (formData.email.trim()) {
                payload.email = formData.email.trim();
            }

            const res = await fetchApi("/api/v1/dashboard/users", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            toast.success(t("messages.createdSuccess"));
            const userData = res.data?.user || res.data?.employee || res.data;
            const tempPassword = res.data?.temporaryPassword || res.data?.tempPassword || res.data?.password;

            setCreatedResult({
                user: userData,
                temporaryPassword: tempPassword,
            });
            router.refresh();
        } catch (err) {
            if (err.fields) {
                setErrors(err.fields);
            } else {
                toast.error(err.message || t("messages.createFailed"));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyPassword = () => {
        if (createdResult?.temporaryPassword) {
            navigator.clipboard.writeText(createdResult.temporaryPassword);
            setCopied(true);
            toast.success(t("messages.copiedSuccess"));
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (createdResult) {
        return (
            <div className="max-w-xl mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/users"
                        className="p-2 border border-(--border) rounded-lg text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted) transition-colors"
                        aria-label={t("backAria")}
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{t("success.title")}</h1>
                        <p className="text-sm text-(--muted-foreground)">{t("success.subtitle")}</p>
                    </div>
                </div>

                <div className="bg-(--card) border border-(--border) rounded-xl p-6 shadow-xs space-y-6">
                    <div className="p-4 bg-(--warning)/10 border border-(--warning)/20 rounded-xl flex items-start gap-3 text-(--warning-foreground, --foreground)">
                        <ShieldAlert className="w-5 h-5 text-(--warning) shrink-0 mt-0.5" />
                        <div className="space-y-1 text-xs">
                            <p className="font-semibold text-sm">{t("success.warningTitle")}</p>
                            <p className="text-(--muted-foreground)">
                                {t("success.warningDescription")}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("success.employeeName")}</span>
                            <p className="text-sm font-medium mt-0.5">{createdResult.user?.name}</p>
                        </div>

                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("success.phoneNumber")}</span>
                            <p className="text-sm font-mono mt-0.5">{createdResult.user?.phone}</p>
                        </div>

                        {createdResult.user?.email && (
                            <div>
                                <span className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("success.emailAddress")}</span>
                                <p className="text-sm mt-0.5">{createdResult.user?.email}</p>
                            </div>
                        )}

                        {createdResult.temporaryPassword && (
                            <div className="p-4 bg-(--muted)/50 border border-(--border) rounded-xl space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">{t("success.generatedPassword")}</span>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="font-mono text-base font-bold bg-(--background) px-3 py-1.5 border border-(--border) rounded-lg select-all">
                                        {createdResult.temporaryPassword}
                                    </span>
                                    <button
                                        onClick={handleCopyPassword}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
                                    >
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        <span>{copied ? t("success.copied") : t("success.copyPassword")}</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-(--border) flex items-center justify-between">
                        <Link
                            href="/dashboard/users"
                            className="px-4 py-2 border border-(--border) rounded-lg text-sm font-medium hover:bg-(--muted) transition-colors"
                        >
                            {t("success.returnToList")}
                        </Link>
                        <Link
                            href={`/dashboard/users/${createdResult.user?.id || ""}`}
                            className="px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                            {t("success.viewDetails")}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Link
                    href="/dashboard/users"
                    className="p-2 border border-(--border) rounded-lg text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted) transition-colors"
                    aria-label={t("backAria")}
                >
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
                    <p className="text-sm text-(--muted-foreground)">{t("subtitle")}</p>
                </div>
            </div>

            <div className="bg-(--card) border border-(--border) rounded-xl p-6 shadow-xs">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label={t("form.fullName")}
                        placeholder={t("form.fullNamePlaceholder")}
                        value={formData.name}
                        onChange={(e) => {
                            setFormData({ ...formData, name: e.target.value });
                            if (errors.name) setErrors({ ...errors, name: null });
                        }}
                        error={errors.name}
                        disabled={isLoading}
                        required
                    />

                    <Input
                        label={t("form.phone")}
                        placeholder={t("form.phonePlaceholder")}
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => {
                            setFormData({ ...formData, phone: e.target.value });
                            if (errors.phone) setErrors({ ...errors, phone: null });
                        }}
                        error={errors.phone}
                        disabled={isLoading}
                        required
                    />

                    <Input
                        label={t("form.email")}
                        placeholder={t("form.emailPlaceholder")}
                        type="email"
                        value={formData.email}
                        onChange={(e) => {
                            setFormData({ ...formData, email: e.target.value });
                            if (errors.email) setErrors({ ...errors, email: null });
                        }}
                        error={errors.email}
                        disabled={isLoading}
                    />

                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-(--border)">
                        <Link
                            href="/dashboard/users"
                            className="px-4 py-2 border border-(--border) text-(--foreground) text-sm font-medium rounded-lg hover:bg-(--muted) transition-colors"
                        >
                            {t("form.cancel")}
                        </Link>
                        <Button type="submit" isLoading={isLoading}>
                            {t("form.submit")}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}