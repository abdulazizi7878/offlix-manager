"use client";

import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { Building2, Users, UserPlus, Shield, Loader2, Key } from "lucide-react";
import dayjs from "dayjs";
import { useTranslations } from "next-intl";

export default function OrganizationSettings() {
    const t = useTranslations("dashboard.organizationSettings");
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
            setError(err.message || t("loadError"));
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
                    { id: "branches", label: t("tabs.branches"), icon: Building2, count: orgData.branches.length },
                    { id: "team", label: t("tabs.team"), icon: Users, count: orgData.employees.length },
                    { id: "memberships", label: t("tabs.memberships"), icon: UserPlus, count: orgData.memberships.length },
                    { id: "permissions", label: t("tabs.permissions"), icon: Shield, count: orgData.permissions.length },
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
                            <h2 className="text-base font-bold text-(--foreground)">{t("branches.title")}</h2>
                            <p className="text-xs text-(--muted-foreground)">{t("branches.subtitle")}</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-(--border) bg-(--muted)/30 text-xs font-medium text-(--muted-foreground)">
                                    <th className="py-3 px-6">{t("branches.table.name")}</th>
                                    <th className="py-3 px-6">{t("branches.table.description")}</th>
                                    <th className="py-3 px-6">{t("branches.table.status")}</th>
                                    <th className="py-3 px-6">{t("branches.table.createdAt")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border) text-sm">
                                {orgData.branches.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-xs text-(--muted-foreground)">
                                            {t("branches.table.noData")}
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
                            <h2 className="text-base font-bold text-(--foreground)">{t("team.title")}</h2>
                            <p className="text-xs text-(--muted-foreground)">{t("team.subtitle")}</p>
                        </div>
                        <button
                            onClick={() => router.push("/dashboard/users/create")}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-(--primary) text-(--primary-foreground) rounded-xl text-xs font-semibold cursor-pointer"
                        >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>{t("team.inviteBtn")}</span>
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-(--border) bg-(--muted)/30 text-xs font-medium text-(--muted-foreground)">
                                    <th className="py-3 px-6">{t("team.table.name")}</th>
                                    <th className="py-3 px-6">{t("team.table.email")}</th>
                                    <th className="py-3 px-6">{t("team.table.phone")}</th>
                                    <th className="py-3 px-6">{t("team.table.username")}</th>
                                    <th className="py-3 px-6">{t("team.table.joinedDate")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border) text-sm">
                                {orgData.employees.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-xs text-(--muted-foreground)">
                                            {t("team.table.noData")}
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
                            <h2 className="text-base font-bold text-(--foreground)">{t("memberships.title")}</h2>
                            <p className="text-xs text-(--muted-foreground)">{t("memberships.subtitle")}</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-(--border) bg-(--muted)/30 text-xs font-medium text-(--muted-foreground)">
                                    <th className="py-3 px-6">{t("memberships.table.userName")}</th>
                                    <th className="py-3 px-6">{t("memberships.table.branchName")}</th>
                                    <th className="py-3 px-6">{t("memberships.table.contactEmail")}</th>
                                    <th className="py-3 px-6">{t("memberships.table.status")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-(--border) text-sm">
                                {orgData.memberships.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-xs text-(--muted-foreground)">
                                            {t("memberships.table.noData")}
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
                        <h2 className="text-base font-bold text-(--foreground)">{t("permissions.title")}</h2>
                        <p className="text-xs text-(--muted-foreground)">{t("permissions.subtitle")}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                        {orgData.permissions.length === 0 ? (
                            <p className="text-xs text-(--muted-foreground) py-4">{t("permissions.noData")}</p>
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