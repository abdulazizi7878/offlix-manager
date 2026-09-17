"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api/client";
import {
    CheckCircle2,
    AlertCircle,
    Loader2,
    Save,
    Mail,
    ShieldCheck,
} from "lucide-react";
import dayjs from "dayjs";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function AccountSettings() {
    const t = useTranslations("dashboard.accountSettings");
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [emailChanging, setEmailChanging] = useState(false);

    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const [emailError, setEmailError] = useState(null);

    const [account, setAccount] = useState({});
    const [profile, setProfile] = useState({});
    const [subscription, setSubscription] = useState(null);
    const [preferences, setPreferences] = useState({});

    const [email, setEmail] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        username: "",
        bio: "",
        currency: "ETB",
        timezone: "Africa/Addis_Ababa",
        dateFormat: "YYYY-MM-DD",
    });

    useEffect(() => {
        loadAccountData();
    }, []);

    const loadAccountData = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetchApi(
                "/api/v1/settings/account"
            );

            const data = res.data || res;

            setAccount(data.account || {});
            setProfile(data.profile || {});
            setSubscription(data.subscription || null);
            setPreferences(data.preferences || {});

            setEmail(data.profile?.email || "");

            setFormData({
                name: data.profile?.name || "",
                phone: data.profile?.phone || "",
                username: data.profile?.username || "",
                bio: data.profile?.bio || "",
                currency:
                    data.preferences?.currency || "ETB",
                timezone:
                    data.preferences?.timezone ||
                    "Africa/Addis_Ababa",
                dateFormat:
                    data.preferences?.dateFormat ||
                    "YYYY-MM-DD",
            });
        } catch (err) {
            setError(
                err.message ||
                t("loadError")
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        setSaving(true);
        setError(null);
        setSuccessMsg(null);

        try {
            const payload = {
                profile: {
                    name: formData.name,
                    phone: formData.phone,
                    username: formData.username,
                    bio: formData.bio,
                },

                preferences: {
                    currency: formData.currency,
                    timezone: formData.timezone,
                    dateFormat: formData.dateFormat,
                },
            };

            await fetchApi(
                "/api/v1/settings/account",
                {
                    method: "PATCH",
                    body: JSON.stringify(payload),
                }
            );

            setSuccessMsg(
                t("updateSuccess")
            );

            await loadAccountData();

            setTimeout(() => {
                setSuccessMsg(null);
            }, 4000);
        } catch (err) {
            setError(
                err.message ||
                t("updateError")
            );
        } finally {
            setSaving(false);
        }
    };

    const handleEmailChange = async (e) => {
        e.preventDefault();

        setEmailError(null);
        setSuccessMsg(null);

        const currentEmail =
            profile.email?.trim().toLowerCase() || "";

        const newEmail =
            email.trim().toLowerCase();

        if (!newEmail) {
            setEmailError(
                t("profile.validation.enterEmail")
            );
            return;
        }

        if (newEmail === currentEmail) {
            setEmailError(
                t("profile.validation.alreadyCurrent")
            );
            return;
        }

        setEmailChanging(true);

        try {
            const res = await fetchApi(
                "/api/v1/settings/account/email",
                {
                    method: "POST",
                    body: JSON.stringify({
                        email: newEmail,
                    }),
                }
            );

            const data = res.data || res;

            if (!data.userId) {
                throw new Error(
                    t("profile.validation.verificationSessionFailed")
                );
            }

            if (!data.verificationToken) {
                throw new Error(
                    t("profile.validation.verificationTokenMissing")
                );
            }

            sessionStorage.setItem(
                "offlix_verify_id",
                data.userId
            );

            sessionStorage.setItem(
                "offlix_verify_purpose",
                "email_change"
            );

            sessionStorage.setItem(
                "offlix_email_change_token",
                data.verificationToken
            );

            toast.success(
                t("profile.validation.verificationSent")
            );

            router.push("/verify");
        } catch (err) {
            setEmailError(
                err.message ||
                t("profile.validation.emailChangeFailed")
            );
        } finally {
            setEmailChanging(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 bg-(--card) border border-(--border) rounded-2xl">
                <Loader2 className="w-6 h-6 animate-spin text-(--primary)" />
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSave}
            className="space-y-6"
        >
            {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-sm font-medium">
                    {error}
                </div>
            )}

            {successMsg && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-sm font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {successMsg}
                </div>
            )}

            {/* 1. Business Information */}

            <div className="bg-(--card) border border-(--border) rounded-2xl p-6 shadow-xs space-y-4">
                <div>
                    <h2 className="text-base font-bold text-(--foreground)">
                        {t("businessInfo.title")}
                    </h2>

                    <p className="text-xs text-(--muted-foreground)">
                        {t("businessInfo.subtitle")}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-(--muted-foreground)">
                            {t("businessInfo.accountName")}
                        </label>

                        <input
                            type="text"
                            disabled
                            value={account.name || "—"}
                            className="w-full px-3 py-2 bg-(--muted)/30 border border-(--border) rounded-xl text-sm text-(--foreground) opacity-75 cursor-not-allowed"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-(--muted-foreground)">
                            {t("businessInfo.status")}
                        </label>

                        <input
                            type="text"
                            disabled
                            value={account.status || "active"}
                            className="w-full px-3 py-2 bg-(--muted)/30 border border-(--border) rounded-xl text-sm text-(--foreground) opacity-75 cursor-not-allowed uppercase font-mono text-xs"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-(--muted-foreground)">
                            {t("businessInfo.creationDate")}
                        </label>

                        <input
                            type="text"
                            disabled
                            value={
                                account.createdAt
                                    ? dayjs(
                                        account.createdAt
                                    ).format(
                                        "YYYY-MM-DD"
                                    )
                                    : "—"
                            }
                            className="w-full px-3 py-2 bg-(--muted)/30 border border-(--border) rounded-xl text-sm text-(--foreground) opacity-75 cursor-not-allowed font-mono text-xs"
                        />
                    </div>
                </div>
            </div>

            {/* 2. My Profile */}

            <div className="bg-(--card) border border-(--border) rounded-2xl p-6 shadow-xs space-y-4">
                <div>
                    <h2 className="text-base font-bold text-(--foreground)">
                        {t("profile.title")}
                    </h2>

                    <p className="text-xs text-(--muted-foreground)">
                        {t("profile.subtitle")}
                    </p>
                </div>

                <div className="flex items-center gap-4 py-2">
                    <div className="w-16 h-16 rounded-full bg-(--primary)/10 border border-(--primary)/20 flex items-center justify-center text-xl font-bold text-(--primary)">
                        {formData.name?.charAt(0) || "U"}
                    </div>

                    <div>
                        <div className="text-sm font-bold text-(--foreground)">
                            {profile.email || "—"}
                        </div>

                        <div className="flex items-center gap-1.5 mt-1">
                            {profile.emailVerifiedAt ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {t("profile.verifiedEmail")}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                    <AlertCircle className="w-3 h-3" />
                                    {t("profile.unverifiedEmail")}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Email Change */}

                <div className="pt-4 border-t border-(--border)">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="w-9 h-9 rounded-lg bg-(--primary)/10 flex items-center justify-center shrink-0">
                            <Mail className="w-4 h-4 text-(--primary)" />
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-(--foreground)">
                                {t("profile.emailTitle")}
                            </h3>

                            <p className="text-xs text-(--muted-foreground) mt-0.5">
                                {t("profile.emailSubtitle")}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-(--foreground)">
                                {t("profile.emailLabel")}
                            </label>

                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);

                                    if (emailError) {
                                        setEmailError(null);
                                    }
                                }}
                                className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-sm text-(--foreground) focus:outline-none focus:border-(--primary)"
                                placeholder={t("profile.emailPlaceholder")}
                                disabled={emailChanging}
                            />

                            {emailError && (
                                <p className="text-xs text-rose-500">
                                    {emailError}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={handleEmailChange}
                                disabled={emailChanging}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-xl text-sm font-semibold hover:opacity-95 transition-opacity disabled:opacity-50"
                            >
                                {emailChanging ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <ShieldCheck className="w-4 h-4" />
                                )}

                                <span>
                                    {emailChanging
                                        ? t("profile.sendingCode")
                                        : t("profile.changeEmail")}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-(--foreground)">
                            {t("profile.name")}
                        </label>

                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    name: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-sm text-(--foreground) focus:outline-none focus:border-(--primary)"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-(--foreground)">
                            {t("profile.username")}
                        </label>

                        <input
                            type="text"
                            value={formData.username}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    username:
                                        e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-sm text-(--foreground) focus:outline-none focus:border-(--primary)"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-(--foreground)">
                            {t("profile.phone")}
                        </label>

                        <input
                            type="text"
                            value={formData.phone}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    phone: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-sm text-(--foreground) focus:outline-none focus:border-(--primary)"
                        />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                        <label className="text-xs font-medium text-(--foreground)">
                            {t("profile.bio")}
                        </label>

                        <textarea
                            rows={2}
                            value={formData.bio}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    bio: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-sm text-(--foreground) focus:outline-none focus:border-(--primary)"
                        />
                    </div>
                </div>
            </div>

            {/* 3. Subscription */}

            <div className="bg-(--card) border border-(--border) rounded-2xl p-6 shadow-xs space-y-4">
                <div>
                    <h2 className="text-base font-bold text-(--foreground)">
                        {t("subscription.title")}
                    </h2>

                    <p className="text-xs text-(--muted-foreground)">
                        {t("subscription.subtitle")}
                    </p>
                </div>

                {subscription ? (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
                        <div className="p-3 bg-(--muted)/20 border border-(--border) rounded-xl">
                            <span className="text-[11px] text-(--muted-foreground)">
                                {t("subscription.currentPlan")}
                            </span>

                            <div className="text-sm font-bold text-(--foreground) mt-0.5">
                                {subscription.planName ||
                                    subscription.plan ||
                                    t("subscription.standardPlan")}
                            </div>
                        </div>

                        <div className="p-3 bg-(--muted)/20 border border-(--border) rounded-xl">
                            <span className="text-[11px] text-(--muted-foreground)">
                                {t("subscription.status")}
                            </span>

                            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 uppercase font-mono text-xs">
                                {subscription.status ||
                                    t("subscription.active")}
                            </div>
                        </div>

                        <div className="p-3 bg-(--muted)/20 border border-(--border) rounded-xl">
                            <span className="text-[11px] text-(--muted-foreground)">
                                {t("subscription.startDate")}
                            </span>

                            <div className="text-sm font-bold font-mono text-(--foreground) mt-0.5 text-xs">
                                {subscription.startDate
                                    ? dayjs(
                                        subscription.startDate
                                    ).format(
                                        "YYYY-MM-DD"
                                    )
                                    : "—"}
                            </div>
                        </div>

                        <div className="p-3 bg-(--muted)/20 border border-(--border) rounded-xl">
                            <span className="text-[11px] text-(--muted-foreground)">
                                {t("subscription.expirationDate")}
                            </span>

                            <div className="text-sm font-bold font-mono text-(--foreground) mt-0.5 text-xs">
                                {subscription.expirationDate
                                    ? dayjs(
                                        subscription.expirationDate
                                    ).format(
                                        "YYYY-MM-DD"
                                    )
                                    : "—"}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 bg-(--muted)/10 border border-(--border) rounded-xl text-sm text-(--muted-foreground)">
                        {t("subscription.noSubscription")}
                    </div>
                )}
            </div>

            {/* 4. Preferences */}

            <div className="bg-(--card) border border-(--border) rounded-2xl p-6 shadow-xs space-y-4">
                <div>
                    <h2 className="text-base font-bold text-(--foreground)">
                        {t("preferences.title")}
                    </h2>

                    <p className="text-xs text-(--muted-foreground)">
                        {t("preferences.subtitle")}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-(--foreground)">
                            {t("preferences.currency")}
                        </label>

                        <select
                            value={formData.currency}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    currency:
                                        e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-sm text-(--foreground) focus:outline-none focus:border-(--primary)"
                        >
                            <option value="ETB">
                                {t("preferences.options.etb")}
                            </option>

                            <option value="USD">
                                {t("preferences.options.usd")}
                            </option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-(--foreground)">
                            {t("preferences.timezone")}
                        </label>

                        <select
                            value={formData.timezone}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    timezone:
                                        e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-sm text-(--foreground) focus:outline-none focus:border-(--primary)"
                        >
                            <option value="Africa/Addis_Ababa">
                                {t("preferences.options.addisAbaba")}
                            </option>

                            <option value="UTC">
                                {t("preferences.options.utc")}
                            </option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-(--foreground)">
                            {t("preferences.dateFormat")}
                        </label>

                        <select
                            value={formData.dateFormat}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    dateFormat:
                                        e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-sm text-(--foreground) focus:outline-none focus:border-(--primary)"
                        >
                            <option value="YYYY-MM-DD">
                                YYYY-MM-DD
                            </option>

                            <option value="DD/MM/YYYY">
                                DD/MM/YYYY
                            </option>

                            <option value="MM-DD-YYYY">
                                MM-DD-YYYY
                            </option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-(--primary) text-(--primary-foreground) rounded-xl text-sm font-semibold hover:opacity-95 transition-opacity disabled:opacity-50"
                >
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}

                    <span>{t("saveChanges")}</span>
                </button>
            </div>
        </form>
    );
}