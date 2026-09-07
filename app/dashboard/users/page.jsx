// file: app/dashboard/users/page.jsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Users, MoreHorizontal, Pencil, AlertCircle, RefreshCcw, ChevronLeft, ChevronRight, CheckCircle2, XCircle, UserCheck, ShieldCheck, Mail, Phone, Calendar } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";

export default function UsersOverviewPage() {
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false });
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);

    const fetchUsers = async (page = 1) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetchApi(`/api/v1/dashboard/users?page=${page}&limit=10`);
            const data = res.data || {};
            setUsers(data.users || []);
            if (data.pagination) {
                setPagination(data.pagination);
            }
        } catch (err) {
            setError(err.message || "Failed to load employees.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(currentPage);
    }, [currentPage]);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-(--border)">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-(--primary)/10 text-(--primary) rounded-xl">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
                        <p className="text-sm text-(--muted-foreground) mt-0.5">
                            Manage employees belonging to your business account.
                        </p>
                    </div>
                </div>
                <Link
                    href="/dashboard/users/create"
                    className="inline-flex items-center justify-center gap-2 bg-(--primary) text-(--primary-foreground) px-4 py-2 rounded-lg font-medium text-sm hover:opacity-95 transition-opacity focus:outline-none focus:ring-2 focus:ring-(--ring)"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add employee</span>
                </Link>
            </div>

            {/* Error State */}
            {error && (
                <div className="p-4 bg-(--destructive)/10 border border-(--destructive)/20 rounded-xl flex items-center justify-between text-(--destructive)">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold">Unable to load employees</p>
                            <p className="text-xs opacity-90">{error}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => fetchUsers(currentPage)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-(--background) border border-(--border) text-(--foreground) text-xs font-medium rounded-lg hover:bg-(--muted) transition-colors"
                    >
                        <RefreshCcw className="w-3.5 h-3.5" />
                        <span>Retry</span>
                    </button>
                </div>
            )}

            {/* Loading Skeleton */}
            {isLoading && !error && (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((n) => (
                        <div key={n} className="h-16 bg-(--muted)/40 rounded-xl animate-pulse" />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && users.length === 0 && (
                <div className="p-12 text-center bg-(--card) border border-(--border) rounded-xl space-y-4">
                    <div className="mx-auto w-12 h-12 bg-(--muted) text-(--muted-foreground) rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6" />
                    </div>
                    <div className="max-w-sm mx-auto space-y-1">
                        <h2 className="text-lg font-semibold">No employees yet</h2>
                        <p className="text-xs text-(--muted-foreground)">
                            Add your first employee to start managing your team members.
                        </p>
                    </div>
                    <Link
                        href="/dashboard/users/create"
                        className="inline-flex items-center gap-2 bg-(--primary) text-(--primary-foreground) px-4 py-2 rounded-lg font-medium text-sm hover:opacity-95 transition-opacity"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add employee</span>
                    </Link>
                </div>
            )}

            {/* Users Table */}
            {!isLoading && !error && users.length > 0 && (
                <div className="space-y-4">
                    <div className="bg-(--card) border border-(--border) rounded-xl shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-(--muted)/50 border-b border-(--border) text-(--muted-foreground) text-xs font-semibold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3.5">Name</th>
                                        <th className="px-6 py-3.5">Phone</th>
                                        <th className="px-6 py-3.5">Email</th>
                                        <th className="px-6 py-3.5">Verified</th>
                                        <th className="px-6 py-3.5">Created</th>
                                        <th className="px-6 py-3.5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-(--border)">
                                    {users.map((user) => {
                                        const isVerified = Boolean(user.email_verified_at || user.is_verified);

                                        return (
                                            <tr key={user.id} className="hover:bg-(--muted)/30 transition-colors">
                                                <td className="px-6 py-4 font-medium">
                                                    <Link href={`/dashboard/users/${user.id}`} className="flex items-center gap-3 hover:underline text-(--foreground)">
                                                        <div className="w-8 h-8 rounded-full bg-(--primary)/10 text-(--primary) flex items-center justify-center font-semibold text-xs shrink-0">
                                                            {user.name ? user.name.charAt(0).toUpperCase() : <Users className="w-3.5 h-3.5" />}
                                                        </div>
                                                        <span className="truncate">{user.name}</span>
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-mono text-(--muted-foreground)">
                                                    <div className="flex items-center gap-1.5">
                                                        <Phone className="w-3.5 h-3.5 text-(--muted-foreground)/70 shrink-0" />
                                                        <span>{user.phone}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-(--muted-foreground)">
                                                    <div className="flex items-center gap-1.5">
                                                        <Mail className="w-3.5 h-3.5 text-(--muted-foreground)/70 shrink-0" />
                                                        <span className="truncate">{user.email || "No email"}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isVerified
                                                        ? "bg-(--success)/10 text-(--success)"
                                                        : "bg-(--muted) text-(--muted-foreground)"
                                                        }`}>
                                                        {isVerified ? <ShieldCheck className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                                        {isVerified ? "Verified" : "Unverified"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-(--muted-foreground)">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5 text-(--muted-foreground)/70 shrink-0" />
                                                        <span>{user.created_at ? new Date(user.created_at).toLocaleDateString() : "Recently"}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            href={`/dashboard/users/${user.id}`}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-(--border) rounded-lg text-xs font-medium text-(--foreground) hover:bg-(--muted) transition-colors"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                            <span>View / Edit</span>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination Controls */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-2">
                            <p className="text-xs text-(--muted-foreground)">
                                Page <span className="font-semibold text-(--foreground)">{pagination.page}</span> of <span className="font-semibold text-(--foreground)">{pagination.totalPages}</span> ({pagination.total} total)
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                    disabled={!pagination.hasPreviousPage && currentPage === 1}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-(--border) bg-(--card) text-xs font-medium rounded-lg disabled:opacity-50 hover:bg-(--muted) transition-colors"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                    <span>Previous</span>
                                </button>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(p + 1, pagination.totalPages))}
                                    disabled={!pagination.hasNextPage && currentPage >= pagination.totalPages}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-(--border) bg-(--card) text-xs font-medium rounded-lg disabled:opacity-50 hover:bg-(--muted) transition-colors"
                                >
                                    <span>Next</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}