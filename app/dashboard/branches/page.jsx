// file: app/dashboard/branches/page.jsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, GitBranch, MoreHorizontal, Pencil, Power, AlertCircle, RefreshCcw } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";

export default function BranchesOverviewPage() {
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const fetchBranches = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchApi("/api/v1/dashboard/branches");
      setBranches(res.data?.branches || res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load branches.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleStatusToggle = async (branch) => {
    const nextStatus = branch.status === "active" ? "inactive" : "active";
    setActionLoadingId(branch.id);
    try {
      await fetchApi(`/api/v1/dashboard/branches/${branch.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      toast.success(`Branch status updated to ${nextStatus}.`);
      fetchBranches();
    } catch (err) {
      toast.error(err.message || "Failed to update branch status.");
    } finally {
      setActionLoadingId(null);
      setOpenMenuId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-(--border)">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Branches</h1>
          <p className="text-sm text-(--muted-foreground) mt-1">
            Manage the locations connected to your business.
          </p>
        </div>
        <Link
          href="/dashboard/branches/create"
          className="inline-flex items-center justify-center gap-2 bg-(--primary) text-(--primary-foreground) px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-(--ring)"
        >
          <Plus className="w-4 h-4" />
          <span>Create branch</span>
        </Link>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-(--destructive)/10 border border-(--destructive)/20 rounded-xl flex items-center justify-between text-(--destructive)">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Unable to load branches</p>
              <p className="text-xs opacity-90">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchBranches}
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
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-16 bg-(--muted)/40 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && branches.length === 0 && (
        <div className="p-12 text-center bg-(--card) border border-(--border) rounded-xl space-y-4">
          <div className="mx-auto w-12 h-12 bg-(--muted) text-(--muted-foreground) rounded-full flex items-center justify-center">
            <GitBranch className="w-6 h-6" />
          </div>
          <div className="max-w-sm mx-auto space-y-1">
            <h2 className="text-lg font-semibold">No branches yet</h2>
            <p className="text-xs text-(--muted-foreground)">
              Create your first branch to start organizing your business locations.
            </p>
          </div>
          <Link
            href="/dashboard/branches/create"
            className="inline-flex items-center gap-2 bg-(--primary) text-(--primary-foreground) px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span>Create branch</span>
          </Link>
        </div>
      )}

      {/* Branches Table */}
      {!isLoading && !error && branches.length > 0 && (
        <div className="bg-(--card) border border-(--border) rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-(--muted)/50 border-b border-(--border) text-(--muted-foreground) text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Updated</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border)">
                {branches.map((branch) => {
                  const isActive = branch.status === "active";
                  const isActioning = actionLoadingId === branch.id;

                  return (
                    <tr key={branch.id} className="hover:bg-(--muted)/30 transition-colors">
                      <td className="px-6 py-4 font-medium">
                        <Link href={`/dashboard/branches/${branch.id}`} className="hover:underline text-(--foreground)">
                          {branch.name}
                        </Link>
                        {branch.description && (
                          <p className="text-xs text-(--muted-foreground) truncate max-w-xs mt-0.5">
                            {branch.description}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          isActive 
                            ? "bg-(--success)/10 text-(--success)" 
                            : "bg-(--muted) text-(--muted-foreground)"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-(--success)" : "bg-(--muted-foreground)"}`} />
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-(--muted-foreground)">
                        {branch.updated_at ? new Date(branch.updated_at).toLocaleDateString() : "Recently"}
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/branches/${branch.id}/edit`}
                            className="p-1.5 text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted) rounded-lg transition-colors"
                            title="Edit branch"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          
                          <div className="relative">
                            <button
                              onClick={() => setOpenMenuId(openMenuId === branch.id ? null : branch.id)}
                              className="p-1.5 text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted) rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-(--ring)"
                              aria-label="Actions menu"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {openMenuId === branch.id && (
                              <div className="absolute right-0 mt-2 w-44 bg-(--card) border border-(--border) rounded-xl shadow-lg py-1 z-20 text-xs">
                                <Link
                                  href={`/dashboard/branches/${branch.id}`}
                                  className="block px-4 py-2 text-left hover:bg-(--muted) text-(--foreground)"
                                  onClick={() => setOpenMenuId(null)}
                                >
                                  View details
                                </Link>
                                <button
                                  disabled={isActioning}
                                  onClick={() => handleStatusToggle(branch)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-(--muted) text-(--foreground) disabled:opacity-50"
                                >
                                  <Power className="w-3.5 h-3.5" />
                                  <span>{isActive ? "Deactivate" : "Activate"}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}