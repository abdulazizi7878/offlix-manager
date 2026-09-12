// file: app/dashboard/settings/components/security-settings.jsx

"use client";

import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api/client";
import { Shield, Key, Laptop, Loader2, CheckCircle2, Lock, Trash2 } from "lucide-react";
import dayjs from "dayjs";

export default function SecuritySettings() {
    const [loading, setLoading] = useState(true);
    const [savingPassword, setSavingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState(null);
    const [passwordSuccess, setPasswordSuccess] = useState(null);

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        loadSecurityData();
    }, []);

    const loadSecurityData = async () => {
        setLoading(true);
        try {
            const res = await fetchApi("/api/v1/settings/security");
            const data = res.data || res;
            setSessions(data.sessions || []);
        } catch (err) {
            // Handle or ignore if sessions endpoint varies
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError("New passwords do not match.");
            return;
        }

        setSavingPassword(true);
        setPasswordError(null);
        setPasswordSuccess(null);

        try {
            await fetchApi("/api/v1/settings/security/password", {
                method: "POST",
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword,
                }),
            });
            setPasswordSuccess("Password updated successfully.");
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
            setPasswordError(err.message || "Failed to update password.");
        } finally {
            setSavingPassword(false);
        }
    };

    const handleRevokeSession = async (sessionId) => {
        if (!confirm("Are you sure you want to revoke this session?")) return;
        try {
            await fetchApi(`/api/v1/settings/security/sessions/${sessionId}`, {
                method: "DELETE",
            });
            loadSecurityData();
        } catch (err) {
            alert(err.message || "Failed to revoke session.");
        }
    };

    const handleRevokeAllOtherSessions = async () => {
        if (!confirm("Are you sure you want to revoke all other active sessions?")) return;
        try {
            await fetchApi("/api/v1/settings/security/sessions/revoke-others", {
                method: "POST",
            });
            loadSecurityData();
        } catch (err) {
            alert(err.message || "Failed to revoke sessions.");
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
            {/* 1. Change Password */}
            <div className="bg-(--card) border border-(--border) rounded-2xl p-6 shadow-xs space-y-4">
                <div>
                    <h2 className="text-base font-bold text-(--foreground)">Change Password</h2>
                    <p className="text-xs text-(--muted-foreground)">Ensure your account is using a secure password</p>
                </div>

                {passwordError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs font-medium">
                        {passwordError}
                    </div>
                )}
                {passwordSuccess && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> {passwordSuccess}
                    </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-xl">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-(--foreground)">Current Password</label>
                        <input
                            type="password"
                            required
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-sm text-(--foreground) focus:outline-none focus:border-(--primary)"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-(--foreground)">New Password</label>
                        <input
                            type="password"
                            required
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-sm text-(--foreground) focus:outline-none focus:border-(--primary)"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-(--foreground)">Confirm New Password</label>
                        <input
                            type="password"
                            required
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-sm text-(--foreground) focus:outline-none focus:border-(--primary)"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={savingPassword}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-xl text-xs font-semibold hover:opacity-95 transition-opacity disabled:opacity-50"
                    >
                        {savingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Update Password</span>
                    </button>
                </form>
            </div>

            {/* 2. Active Sessions */}
            <div className="bg-(--card) border border-(--border) rounded-2xl shadow-xs overflow-hidden">
                <div className="p-6 border-b border-(--border) flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-(--foreground)">Active Sessions</h2>
                        <p className="text-xs text-(--muted-foreground)">Manage and revoke active browser or device sessions</p>
                    </div>
                    {sessions.length > 1 && (
                        <button
                            onClick={handleRevokeAllOtherSessions}
                            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl text-xs font-medium transition-colors"
                        >
                            Revoke All Other Sessions
                        </button>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-(--border) bg-(--muted)/30 text-xs font-medium text-(--muted-foreground)">
                                <th className="py-3 px-6">Device / Session Info</th>
                                <th className="py-3 px-6">IP Address</th>
                                <th className="py-3 px-6">Expiration</th>
                                <th className="py-3 px-6 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-(--border) text-sm">
                            {sessions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-xs text-(--muted-foreground)">
                                        No active sessions found or session list unavailable.
                                    </td>
                                </tr>
                            ) : (
                                sessions.map((session) => (
                                    <tr key={session.id || session._id} className="hover:bg-(--muted)/20 transition-colors">
                                        <td className="py-3.5 px-6 font-medium text-xs text-(--foreground) flex items-center gap-2">
                                            <Laptop className="w-4 h-4 text-(--muted-foreground)" />
                                            <div>
                                                <div>{session.device || session.userAgent || "Web Browser"}</div>
                                                {session.isCurrent && (
                                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Current Session</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-6 text-xs text-(--muted-foreground) font-mono">{session.ipAddress || "—"}</td>
                                        <td className="py-3.5 px-6 text-xs text-(--muted-foreground)">
                                            {session.expiresAt ? dayjs(session.expiresAt).format("YYYY-MM-DD HH:mm") : "—"}
                                        </td>
                                        <td className="py-3.5 px-6 text-right">
                                            {!session.isCurrent && (
                                                <button
                                                    onClick={() => handleRevokeSession(session.id || session._id)}
                                                    className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg text-xs font-medium transition-colors"
                                                >
                                                    Revoke
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}