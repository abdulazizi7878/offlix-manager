// file: app/dashboard/settings/components/organization-settings.jsx

"use client";

import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { Building2, Users, UserPlus, Shield, Loader2, Key } from "lucide-react";
import dayjs from "dayjs";

export default function OrganizationSettings() {
    const router = useRouter();
    const [activeSubTab, setActiveSubTab] = useState("branches");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [orgData, setOrgData] = useState({
        branches: [],
        employees: [],
        memberships: [],
        permissions: [],
        membershipPermissions: [],
    });

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
                employees: data.employees || [],
                memberships: data.memberships || [],
                permissions: data.permissions || [],
                membershipPermissions: data.membershipPermissions || [],
            });
        } catch (err) {
            setError(err.message || "Failed to load organization settings.");
        } finally {
            setLoading(false);
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
                    { id: "team", label: "Team Members", icon: Users, count: orgData.employees.length },
                    { id: "memberships", label: "Memberships", icon: UserPlus, count: orgData.memberships.length },
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
                                    <th className="py-3 px-6">Description</th>
                                    <th className="py-3 px-6">Status</th>
                                    <th className="py-3 px-6">Created At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border) text-sm">
                                {orgData.branches.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-xs text-(--muted-foreground)">
                                            No branches found.
                                        </td>
                                    </tr>
                                ) : (
                                    orgData.branches.map((b) => (
                                        <tr key={b.id} className="hover:bg-(--muted)/20 transition-colors">
                                            <td className="py-3.5 px-6 font-medium text-xs text-(--foreground)">{b.name}</td>
                                            <td className="py-3.5 px-6 text-xs text-(--muted-foreground)">{b.description || "—"}</td>
                                            <td className="py-3.5 px-6 text-xs">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 capitalize">
                                                    {b.status}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-6 text-xs text-(--muted-foreground)">
                                                {dayjs(b.createdAt).format("YYYY-MM-DD HH:mm")}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 2. Team Members Section */}
            {activeSubTab === "team" && (
                <div className="bg-(--card) border border-(--border) rounded-2xl shadow-xs overflow-hidden">
                    <div className="p-6 border-b border-(--border) flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-(--foreground)">Team Employees</h2>
                            <p className="text-xs text-(--muted-foreground)">Active employees and administrative staff registered in the system</p>
                        </div>
                        <button
                            onClick={() => router.push("/dashboard/users/create")}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-(--primary) text-(--primary-foreground) rounded-xl text-xs font-semibold cursor-pointer"
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
                                    <th className="py-3 px-6">Email</th>
                                    <th className="py-3 px-6">Phone</th>
                                    <th className="py-3 px-6">Username</th>
                                    <th className="py-3 px-6">Joined Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border) text-sm">
                                {orgData.employees.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-xs text-(--muted-foreground)">
                                            No employees found.
                                        </td>
                                    </tr>
                                ) : (
                                    orgData.employees.map((emp) => (
                                        <tr key={emp.id} className="hover:bg-(--muted)/20 transition-colors">
                                            <td className="py-3.5 px-6 font-medium text-xs text-(--foreground)">{emp.name}</td>
                                            <td className="py-3.5 px-6 text-xs text-(--muted-foreground) font-mono">{emp.email}</td>
                                            <td className="py-3.5 px-6 text-xs text-(--muted-foreground) font-mono">{emp.phone}</td>
                                            <td className="py-3.5 px-6 text-xs text-(--muted-foreground)">{emp.username || "—"}</td>
                                            <td className="py-3.5 px-6 text-xs text-(--muted-foreground)">
                                                {dayjs(emp.createdAt).format("YYYY-MM-DD HH:mm")}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 3. Memberships Section */}
            {activeSubTab === "memberships" && (
                <div className="bg-(--card) border border-(--border) rounded-2xl shadow-xs overflow-hidden">
                    <div className="p-6 border-b border-(--border) flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-(--foreground)">Branch Memberships</h2>
                            <p className="text-xs text-(--muted-foreground)">Mapping of employees assigned to specific store branches</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-(--border) bg-(--muted)/30 text-xs font-medium text-(--muted-foreground)">
                                    <th className="py-3 px-6">User Name</th>
                                    <th className="py-3 px-6">Branch Name</th>
                                    <th className="py-3 px-6">Contact Email</th>
                                    <th className="py-3 px-6">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border) text-sm">
                                {orgData.memberships.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-xs text-(--muted-foreground)">
                                            No memberships found.
                                        </td>
                                    </tr>
                                ) : (
                                    orgData.memberships.map((m) => (
                                        <tr key={m.id} className="hover:bg-(--muted)/20 transition-colors">
                                            <td className="py-3.5 px-6 font-medium text-xs text-(--foreground)">{m.userName}</td>
                                            <td className="py-3.5 px-6 text-xs text-(--foreground) font-semibold">{m.branchName}</td>
                                            <td className="py-3.5 px-6 text-xs text-(--muted-foreground) font-mono">{m.userEmail}</td>
                                            <td className="py-3.5 px-6 text-xs">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 capitalize">
                                                    {m.status}
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

            {/* 4. Permissions Section */}
            {activeSubTab === "permissions" && (
                <div className="bg-(--card) border border-(--border) rounded-2xl p-6 shadow-xs space-y-4">
                    <div>
                        <h2 className="text-base font-bold text-(--foreground)">System Permissions</h2>
                        <p className="text-xs text-(--muted-foreground)">Available system permissions and access keys returned by the API</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                        {orgData.permissions.length === 0 ? (
                            <p className="text-xs text-(--muted-foreground) py-4">No permissions defined.</p>
                        ) : (
                            orgData.permissions.map((perm) => (
                                <div key={perm.id} className="p-3.5 bg-(--muted)/10 border border-(--border) rounded-xl space-y-1">
                                    <div className="text-xs font-bold text-(--foreground) flex items-center gap-2">
                                        <Key className="w-3.5 h-3.5 text-(--primary)" />
                                        <span>{perm.name}</span>
                                    </div>
                                    <p className="text-[11px] text-(--muted-foreground)">{perm.description}</p>
                                    <div className="pt-1">
                                        <span className="px-2 py-0.5 bg-(--muted) text-(--foreground) rounded-md text-[10px] font-mono">
                                            {perm.key}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}