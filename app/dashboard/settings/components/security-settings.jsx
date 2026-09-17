"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api/client";
import { Laptop, Loader2, CheckCircle2 } from "lucide-react";
import dayjs from "dayjs";
import { useTranslations } from "next-intl";

export default function SecuritySettings() {
    const t = useTranslations("dashboard.securitySettings");
    const [loading, setLoading] = useState(true);
    const [savingPassword, setSavingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState(null);
    const [passwordSuccess, setPasswordSuccess] = useState(null);
    const [sessionActionId, setSessionActionId] = useState(null);
    const [revokingOthers, setRevokingOthers] = useState(false);

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);

    useEffect(() => {
        loadSecurityData();
    }, []);

    const loadSecurityData = async () => {
        setLoading(true);

        try {
            const res = await fetchApi("/api/v1/settings/security");
            const data = res.data || res;

            setSessions(data.sessions || []);
            setCurrentSessionId(data.currentSessionId || null);
        } catch (err) {
            console.error("Failed to load security settings:", err);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        setPasswordError(null);
        setPasswordSuccess(null);

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError(t("passwordMismatch"));
            return;
        }

        setSavingPassword(true);

        try {
            await fetchApi("/api/v1/settings/security", {
                method: "PATCH",
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword,
                    confirmPassword: passwordForm.confirmPassword,
                }),
            });

            setPasswordSuccess(t("passwordSuccess"));

            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });

            await loadSecurityData();
        } catch (err) {
            setPasswordError(err.message || t("passwordUpdateError"));
        } finally {
            setSavingPassword(false);
        }
    };

    const handleRevokeSession = async (sessionId) => {
        if (!sessionId) return;

        if (!confirm(t("revokeConfirm"))) {
            return;
        }

        setSessionActionId(sessionId);

        try {
            await fetchApi("/api/v1/settings/security", {
                method: "DELETE",
                body: JSON.stringify({
                    sessionId,
                }),
            });

            await loadSecurityData();
        } catch (err) {
            alert(err.message || t("revokeError"));
        } finally {
            setSessionActionId(null);
        }
    };

    const handleRevokeAllOtherSessions = async () => {
        if (!currentSessionId) {
            alert(t("noCurrentSession"));
            return;
        }

        if (!confirm(t("revokeAllConfirm"))) {
            return;
        }

        setRevokingOthers(true);

        try {
            await fetchApi("/api/v1/settings/security", {
                method: "DELETE",
                body: JSON.stringify({
                    confirm: true,
                }),
            });

            await loadSecurityData();
        } catch (err) {
            alert(err.message || t("revokeAllError"));
        } finally {
            setRevokingOthers(false);
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
        <div className="space-y-6">
            {/* Change Password */}
            <div className="bg-(--card) border border-(--border) rounded-2xl p-6 shadow-xs space-y-4">
                <div>
                    <h2 className="text-base font-bold text-(--foreground)">
                        {t("changePassword.title")}
                    </h2>

                    <p className="text-xs text-(--muted-foreground)">
                        {t("changePassword.subtitle")}
                    </p>
                </div>

                {passwordError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs font-medium">
                        {passwordError}
                    </div>
                )}

                {passwordSuccess && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        {passwordSuccess}
                    </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-xl">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-(--foreground)">
                            {t("changePassword.currentPassword")}
                        </label>

                        <input
                            type="password"
                            required
                            value={passwordForm.currentPassword}
                            onChange={(e) =>
                                setPasswordForm((prev) => ({
                                    ...prev,
                                    currentPassword: e.target.value,
                                }))
                            }
                            className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-sm text-(--foreground) focus:outline-none focus:border-(--primary)"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-(--foreground)">
                            {t("changePassword.newPassword")}
                        </label>

                        <input
                            type="password"
                            required
                            minLength={8}
                            value={passwordForm.newPassword}
                            onChange={(e) =>
                                setPasswordForm((prev) => ({
                                    ...prev,
                                    newPassword: e.target.value,
                                }))
                            }
                            className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-sm text-(--foreground) focus:outline-none focus:border-(--primary)"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-(--foreground)">
                            {t("changePassword.confirmPassword")}
                        </label>

                        <input
                            type="password"
                            required
                            minLength={8}
                            value={passwordForm.confirmPassword}
                            onChange={(e) =>
                                setPasswordForm((prev) => ({
                                    ...prev,
                                    confirmPassword: e.target.value,
                                }))
                            }
                            className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-sm text-(--foreground) focus:outline-none focus:border-(--primary)"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={savingPassword}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-xl text-xs font-semibold hover:opacity-95 transition-opacity disabled:opacity-50"
                    >
                        {savingPassword && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        )}

                        <span>
                            {savingPassword
                                ? t("changePassword.updating")
                                : t("changePassword.updateBtn")}
                        </span>
                    </button>
                </form>
            </div>

            {/* Active Sessions */}
            <div className="bg-(--card) border border-(--border) rounded-2xl shadow-xs overflow-hidden">
                <div className="p-6 border-b border-(--border) flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-base font-bold text-(--foreground)">
                            {t("sessions.title")}
                        </h2>

                        <p className="text-xs text-(--muted-foreground)">
                            {t("sessions.subtitle")}
                        </p>
                    </div>

                    {sessions.length > 1 && (
                        <button
                            type="button"
                            onClick={handleRevokeAllOtherSessions}
                            disabled={revokingOthers}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
                        >
                            {revokingOthers && (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            )}

                            {revokingOthers
                                ? t("sessions.revoking")
                                : t("sessions.revokeAllBtn")}
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-(--border) bg-(--muted)/30 text-xs font-medium text-(--muted-foreground)">
                                <th className="py-3 px-6">{t("sessions.table.device")}</th>
                                <th className="py-3 px-6">{t("sessions.table.created")}</th>
                                <th className="py-3 px-6">{t("sessions.table.expiration")}</th>
                                <th className="py-3 px-6 text-right">{t("sessions.table.action")}</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-(--border) text-sm">
                            {sessions.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="py-8 text-center text-xs text-(--muted-foreground)"
                                    >
                                        {t("sessions.table.noData")}
                                    </td>
                                </tr>
                            ) : (
                                sessions.map((session) => {
                                    const isCurrent = session.id === currentSessionId;

                                    return (
                                        <tr
                                            key={session.id}
                                            className="hover:bg-(--muted)/20 transition-colors"
                                        >
                                            <td className="py-3.5 px-6 font-medium text-xs text-(--foreground)">
                                                <div className="flex items-center gap-2">
                                                    <Laptop className="w-4 h-4 text-(--muted-foreground)" />

                                                    <div>
                                                        <div>{t("sessions.browserDevice")}</div>

                                                        {isCurrent && (
                                                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                                                {t("sessions.currentSession")}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-6 text-xs text-(--muted-foreground)">
                                                {session.createdAt
                                                    ? dayjs(session.createdAt).format("YYYY-MM-DD HH:mm")
                                                    : "—"}
                                            </td>

                                            <td className="py-3.5 px-6 text-xs text-(--muted-foreground)">
                                                {session.expiresAt
                                                    ? dayjs(session.expiresAt).format("YYYY-MM-DD HH:mm")
                                                    : "—"}
                                            </td>

                                            <td className="py-3.5 px-6 text-right">
                                                {!isCurrent && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRevokeSession(session.id)}
                                                        disabled={sessionActionId === session.id}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                                                    >
                                                        {sessionActionId === session.id && (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        )}

                                                        {t("sessions.revokeBtn")}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}