// file: app/dashboard/settings/components/organization-settings.jsx

"use client";

import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api/client";
import { Building2, Users, UserPlus, Shield, Loader2, CheckCircle2, AlertTriangle, Key } from "lucide-react";
import dayjs from "dayjs";

export default function OrganizationSettings() {
    const [activeSubTab, setActiveSubTab] = useState("branches");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [orgData, setOrgData] = useState({
        branches: [],
        team: [],
        invitations: [],
        permissions: [],
    });

    // Modal / Action states
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteForm, setInviteForm] = useState({ identifier: "", branchId: "", role: "" });
    const [inviteLoading, setInviteLoading] = useState(false);

    useEffect(() => {
        loadOrgSettings();
    }, []);

    const loadOrgSettings = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchApi("/api/v1/settings/organization");
            const data = res.data || res;
            setOrgData({
                branches: data.branches || [],
                team: data.team || data.members || [],
                invitations: data.invitations || [],
                permissions: data.permissions || [],
            });
        } catch (err) {
            setError(err.message || "Failed to load organization settings.");
        } finally {
            setLoading(false);
        }
    };

    const handleSendInvite = async (e) => {
        e.preventDefault();
        setInviteLoading(true);
        try {
            await fetchApi("/api/v1/settings/organization/invitations", {
                method: "POST",
                body: JSON.stringify(inviteForm),
            });
            setShowInviteModal(false);
            setInviteForm({ identifier: "", branchId: "", role: "" });
            loadOrgSettings();
        } catch (err) {
            alert(err.message || "Failed to send invitation.");
        } finally {
            setInviteLoading(false);
        }
    };

    const handleRevokeInvite = async (invitationId) => {
        if (!confirm("Are you sure you want to revoke this invitation?")) return;
        try {
            await fetchApi(`/api/v1/settings/organization/invitations/${invitationId}`, {
                method: "DELETE",
            });
            loadOrgSettings();
        } catch (err) {
            alert(err.message || "Failed to revoke invitation.");
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
            {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-sm font-medium">
                    {error}
                </div>
            )}

            {/* Sub-navigation for Organization */}
            <div className="flex flex-wrap items-center gap-2 bg-(--card) border border-(--border) p-2 rounded-2xl shadow-xs">
                {[
                    { id: "branches", label: "Branches", icon: Building2, count: orgData.branches.length },
                    { id: "team", label: "Team Members", icon: Users, count: orgData.team.length },
                    { id: "invitations", label: "Invitations", icon: UserPlus, count: orgData.invitations.length },
                    { id: "permissions", label: "Permissions", icon: Shield, count: orgData.permissions.length },
                ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeSubTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${isActive
                                    ? "bg-(--primary) text-(--primary-foreground)"
                                    : "bg-(--muted)/40 hover:bg-(--muted) text-(--foreground)"
                                }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{tab.label}</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? "bg-black/20 text-white" : "bg-(--border) text-(--foreground)"}`}>
                                {tab.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* 1. Branches Section */}
            {activeSubTab === "branches" && (
                <div className="bg-(--card) border border-(--border) rounded-2xl shadow-xs overflow-hidden">
                    <div className="p-6 border-b border-(--border) flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-(--foreground)">Organization Branches</h2>
                            <p className="text-xs text-(--muted-foreground)">Manage your business locations and operating branches</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-(--border) bg-(--muted)/30 text-xs font-medium text-(--muted-foreground)">
                                    <th className="py-3 px-6">Branch Name</th>
                                    <th className="py-3 px-6">Location / Address</th>
                                    <th className="py-3 px-6">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border) text-sm">
                                {orgData.branches.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center text-xs text-(--muted-foreground)">
                                            No branches found.
                                        </td>
                                    </tr>
                                ) : (
                                    orgData.branches.map((b) => (
                                        <tr key={b.id || b._id} className="hover:bg-(--muted)/20 transition-colors">
                                            <td className="py-3.5 px-6 font-medium text-xs text-(--foreground)">{b.name}</td>
                                            <td className="py-3.5 px-6 text-xs text-(--muted-foreground)">{b.address || "—"}</td>
                                            <td className="py-3.5 px-6 text-xs">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                    Active
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 2. Team Section */}
            {activeSubTab === "team" && (
                <div className="bg-(--card) border border-(--border) rounded-2xl shadow-xs overflow-hidden">
                    <div className="p-6 border-b border-(--border) flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-(--foreground)">Team Members</h2>
                            <p className="text-xs text-(--muted-foreground)">Active employees and administrative staff</p>
                        </div>
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-(--primary) text-(--primary-foreground) rounded-xl text-xs font-semibold"
                        >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Invite Employee</span>
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-(--border) bg-(--muted)/30 text-xs font-medium text-(--muted-foreground)">
                                    <th className="py-3 px-6">Name</th>
                                    <th className="py-3 px-6">Contact (Email/Phone)</th>
                                    <th className="py-3 px-6">Branch</th>
                                    <th className="py-3 px-6">Role / Permissions</th>
                                    <th className="py-3 px-6">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border) text-sm">
                                {orgData.team.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-xs text-(--muted-foreground)">
                                            No team members found.
                                        </td>
                                    </tr>
                                ) : (
                                    orgData.team.map((member) => (
                                        <tr key={member.id || member._id} className="hover:bg-(--muted)/20 transition-colors">
                                            <td className="py-3.5 px-6 font-medium text-xs text-(--foreground)">{member.fullName || member.name}</td>
                                            <td className="py-3.5 px-6 text-xs text-(--muted-foreground) font-mono">
                                                {member.email || member.phone || member.username}
                                            </td>
                                            <td className="py-3.5 px-6 text-xs text-(--muted-foreground)">{member.branchName || "All Branches"}</td>
                                            <td className="py-3.5 px-6 text-xs text-(--muted-foreground)">{member.role || member.permissionSummary || "Staff"}</td>
                                            <td className="py-3.5 px-6 text-xs">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                    {member.status || "Active"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 3. Invitations Section */}
            {activeSubTab === "invitations" && (
                <div className="bg-(--card) border border-(--border) rounded-2xl shadow-xs overflow-hidden">
                    <div className="p-6 border-b border-(--border) flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-(--foreground)">Pending & Active Invitations</h2>
                            <p className="text-xs text-(--muted-foreground)">Established Offlix invitation codes and registration tokens</p>
                        </div>
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-(--primary) text-(--primary-foreground) rounded-xl text-xs font-semibold"
                        >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Invite Employee</span>
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-(--border) bg-(--muted)/30 text-xs font-medium text-(--muted-foreground)">
                                    <th className="py-3 px-6">Identifier (Phone/Email/Username)</th>
                                    <th className="py-3 px-6">Branch</th>
                                    <th className="py-3 px-6">Verification Code</th>
                                    <th className="py-3 px-6">Expiration</th>
                                    <th className="py-3 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border) text-sm">
                                {orgData.invitations.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-xs text-(--muted-foreground)">
                                            No active invitations.
                                        </td>
                                    </tr>
                                ) : (
                                    orgData.invitations.map((inv) => (
                                        <tr key={inv.id || inv._id} className="hover:bg-(--muted)/20 transition-colors">
                                            <td className="py-3.5 px-6 font-medium text-xs text-(--foreground) font-mono">{inv.identifier}</td>
                                            <td className="py-3.5 px-6 text-xs text-(--muted-foreground)">{inv.branchName || "—"}</td>
                                            <td className="py-3.5 px-6 text-xs font-mono font-bold text-(--primary)">{inv.code || inv.verificationCode}</td>
                                            <td className="py-3.5 px-6 text-xs text-(--muted-foreground)">
                                                {inv.expiresAt ? dayjs(inv.expiresAt).format("YYYY-MM-DD HH:mm") : "—"}
                                            </td>
                                            <td className="py-3.5 px-6 text-right">
                                                <button
                                                    onClick={() => handleRevokeInvite(inv.id || inv._id)}
                                                    className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg text-xs font-medium transition-colors"
                                                >
                                                    Revoke
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 4. Permissions Section */}
            {activeSubTab === "permissions" && (
                <div className="bg-(--card) border border-(--border) rounded-2xl p-6 shadow-xs space-y-4">
                    <div>
                        <h2 className="text-base font-bold text-(--foreground)">System Permissions</h2>
                        <p className="text-xs text-(--muted-foreground)">Structured feature and domain permissions returned by the backend</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        {orgData.permissions.length === 0 ? (
                            <p className="text-xs text-(--muted-foreground) py-4">No permissions defined.</p>
                        ) : (
                            orgData.permissions.map((group, idx) => (
                                <div key={idx} className="p-4 bg-(--muted)/10 border border-(--border) rounded-xl space-y-2">
                                    <div className="text-sm font-bold text-(--foreground) flex items-center gap-2">
                                        <Key className="w-4 h-4 text-(--primary)" />
                                        <span>{group.category || group.domain || "General"}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {(group.permissions || group.items || [group]).map((perm, pIdx) => (
                                            <span key={pIdx} className="px-2 py-1 bg-(--muted) text-(--foreground) rounded-lg text-[11px] font-mono">
                                                {typeof perm === "string" ? perm : perm.name || perm.key}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-(--card) border border-(--border) rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                        <h3 className="text-lg font-bold text-(--foreground)">Invite Employee</h3>
                        <p className="text-xs text-(--muted-foreground)">
                            Enter employee phone, username, or email. They can log in and verify using the generated code.
                        </p>
                        <form onSubmit={handleSendInvite} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-(--foreground)">Identifier (Phone/Email/Username)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. +251911223344"
                                    value={inviteForm.identifier}
                                    onChange={(e) => setInviteForm({ ...inviteForm, identifier: e.target.value })}
                                    className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-sm text-(--foreground) focus:outline-none focus:border-(--primary)"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-(--foreground)">Branch</label>
                                <select
                                    value={inviteForm.branchId}
                                    onChange={(e) => setInviteForm({ ...inviteForm, branchId: e.target.value })}
                                    className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-xl text-sm text-(--foreground) focus:outline-none focus:border-(--primary)"
                                >
                                    <option value="">Select Branch</option>
                                    {orgData.branches.map((b) => (
                                        <option key={b.id || b._id} value={b.id || b._id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    className="px-4 py-2 bg-(--muted) text-(--foreground) rounded-xl text-xs font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={inviteLoading}
                                    className="px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-xl text-xs font-semibold"
                                >
                                    {inviteLoading ? "Sending..." : "Send Invitation"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}