// File: app/dashboard/settings/components/account-settings.jsx

"use client";

import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api/client";
import { CheckCircle2, AlertCircle, Loader2, Save } from "lucide-react";
import dayjs from "dayjs";

export default function AccountSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const [account, setAccount] = useState({});
    const [profile, setProfile] = useState({});
    const [subscription, setSubscription] = useState({});
    const [preferences, setPreferences] = useState({});

    // Form states for profile and preferences matching the API structure fields
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
            const res = await fetchApi("/api/v1/settings/account");
            const data = res.data || res;
            setAccount(data.account || {});
            setProfile(data.profile || {});
            setSubscription(data.subscription || {});
            setPreferences(data.preferences || {});

            setFormData({
                name: data.profile?.name || "",
                phone: data.profile?.phone || "",
                username: data.profile?.username || "",
                bio: data.profile?.bio || "",
                currency: data.preferences?.currency || "ETB",
                timezone: data.preferences?.timezone || "Africa/Addis_Ababa",
                dateFormat: data.preferences?.dateFormat || "YYYY-MM-DD",
            });
        } catch (err) {
            setError(err.message || "Failed to load account settings.");
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

            await fetchApi("/api/v1/settings/account", {
                method: "PATCH",
                body: JSON.stringify(payload),
            });

            setSuccessMsg("Account settings updated successfully.");
            setTimeout(() => setSuccessMsg(null), 4000);
        } catch (err) {
            setError(err.message || "Failed to update settings.");
        } finally {
            setSaving(false);
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
        <form onSubmit={handleSave} className="space-y-6">
            {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-sm font-medium">
                    {error}
                </div>
            )}
            {successMsg && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-sm font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> {successMsg}
                </div>
            )}

            {/* 1. Business Information */}
            <div className="bg-(--card) border border-(--border) rounded-2xl p-6 shadow-xs space-y-4">
                <div>
                    <h2 className="text-base font-bold text-(--foreground)">Business Information</h2>
                    <p className="text-xs text-(--muted-foreground)">Core account identification details</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-(--muted-foreground)">Business/Account Name</label>
                        <input
                            type="text"
                            disabled
                            value={account.name || "—"}
                            className="w-full px-3 py-2 bg-(--muted)/30 border border-(--border) rounded-xl text-sm text-(--foreground) opacity-75 cursor-not-allowed"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-(--muted-foreground)">Account Status</label>
                        <input
                            type="text"
                            disabled
                            value={account.status || "active"}
                            className="w-full px-3 py-2 bg-(--muted)/30 border border-(--border) rounded-xl text-sm text-(--foreground) opacity-75 cursor-not-allowed uppercase font-mono text-xs"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-(--muted-foreground)">Creation Date</label>
                        <input
                            type="text"
                            disabled
                            value={account.createdAt ? dayjs(account.createdAt).format("YYYY-MM-DD") : "—"}
                            className="w-full px-3 py-2 bg-(--muted)/30 border border-(--border) rounded-xl text-sm text-(--foreground) opacity-75 cursor-not-allowed font-mono text-xs"
                        />
                    </div>
                </div>
            </div>

            {/* 2. My Profile */}
            <div className="bg-(--card) border border-(--border) rounded-2xl p-6 shadow-xs space-y-4">
                <div>
                    <h2 className="text-base font-bold text-(--foreground)">My Profile</h2>
                    <p className="text-xs text-(--muted-foreground)">Personal user profile and verification status</p>
                </div>

                <div className="flex items-center gap-4 py-2">
                    <div className="w-16 h-16 rounded-full bg-(--primary)/10 border border-(--primary)/20 flex items-center justify-center text-xl font-bold text-(--primary)">
                        {formData.name?.charAt(0) || "U"}
                    </div>
                    <div>
                        <div className="text-sm font-bold text-(--foreground)">{profile.email || "—"}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                            {profile.emailVerifiedAt ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                    <CheckCircle2 className="w-3 h-3" /> Verified Email
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                    <AlertCircle className="w-3 h-3" /> Unverified Email
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-(--foreground)">Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-sm text-(--foreground) focus:outline-none focus:border-(--primary)"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-(--foreground)">Username</label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-sm text-(--foreground) focus:outline-none focus:border-(--primary)"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-(--foreground)">Phone Number</label>
                        <input
                            type="text"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-sm text-(--foreground) focus:outline-none focus:border-(--primary)"
                        />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                        <label className="text-xs font-medium text-(--foreground)">Bio</label>
                        <textarea
                            rows={2}
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-sm text-(--foreground) focus:outline-none focus:border-(--primary)"
                        />
                    </div>
                </div>
            </div>

            {/* 3. Subscription (Read-Only) */}
            <div className="bg-(--card) border border-(--border) rounded-2xl p-6 shadow-xs space-y-4">
                <div>
                    <h2 className="text-base font-bold text-(--foreground)">Subscription</h2>
                    <p className="text-xs text-(--muted-foreground)">Current subscription plan and billing cycle</p>
                </div>
                {subscription ? (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
                        <div className="p-3 bg-(--muted)/20 border border-(--border) rounded-xl">
                            <span className="text-[11px] text-(--muted-foreground)">Current Plan</span>
                            <div className="text-sm font-bold text-(--foreground) mt-0.5">{subscription.planName || subscription.plan || "Standard Plan"}</div>
                        </div>
                        <div className="p-3 bg-(--muted)/20 border border-(--border) rounded-xl">
                            <span className="text-[11px] text-(--muted-foreground)">Status</span>
                            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 uppercase font-mono text-xs">
                                {subscription.status || "Active"}
                            </div>
                        </div>
                        <div className="p-3 bg-(--muted)/20 border border-(--border) rounded-xl">
                            <span className="text-[11px] text-(--muted-foreground)">Start Date</span>
                            <div className="text-sm font-bold font-mono text-(--foreground) mt-0.5 text-xs">
                                {subscription.startDate ? dayjs(subscription.startDate).format("YYYY-MM-DD") : "—"}
                            </div>
                        </div>
                        <div className="p-3 bg-(--muted)/20 border border-(--border) rounded-xl">
                            <span className="text-[11px] text-(--muted-foreground)">Expiration Date</span>
                            <div className="text-sm font-bold font-mono text-(--foreground) mt-0.5 text-xs">
                                {subscription.expirationDate ? dayjs(subscription.expirationDate).format("YYYY-MM-DD") : "—"}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 bg-(--muted)/10 border border-(--border) rounded-xl text-sm text-(--muted-foreground)">
                        No active subscription found.
                    </div>
                )}
            </div>

            {/* 4. Preferences */}
            <div className="bg-(--card) border border-(--border) rounded-2xl p-6 shadow-xs space-y-4">
                <div>
                    <h2 className="text-base font-bold text-(--foreground)">Preferences</h2>
                    <p className="text-xs text-(--muted-foreground)">Regional and localized system formats</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-(--foreground)">Currency</label>
                        <select
                            value={formData.currency}
                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                            className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-sm text-(--foreground) focus:outline-none focus:border-(--primary)"
                        >
                            <option value="ETB">ETB (Ethiopian Birr)</option>
                            <option value="USD">USD ($)</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-(--foreground)">Timezone</label>
                        <select
                            value={formData.timezone}
                            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                            className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-sm text-(--foreground) focus:outline-none focus:border-(--primary)"
                        >
                            <option value="Africa/Addis_Ababa">Africa/Addis_Ababa (EAT)</option>
                            <option value="UTC">UTC</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-(--foreground)">Date Format</label>
                        <select
                            value={formData.dateFormat}
                            onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
                            className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-sm text-(--foreground) focus:outline-none focus:border-(--primary)"
                        >
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                            <option value="MM-DD-YYYY">MM-DD-YYYY</option>
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
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save Changes</span>
                </button>
            </div>
        </form>
    );
}