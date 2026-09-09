// file: app/dashboard/branches/page.jsx

"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { Plus, GitBranch, MoreHorizontal, Pencil, Power, AlertCircle, RefreshCcw, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";

export default function BranchesOverviewPage() {
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const fetchBranches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (status) queryParams.append("status", status);

      const res = await fetchApi(`/api/v1/dashboard/branches?${queryParams.toString()}`);

      // Since the API returns { success: true, data: [...] } directly as an array:
      const rawBranches = Array.isArray(res.data) ? res.data : (res.data?.branches || res.data?.data || []);

      setBranches(rawBranches);
      setTotalPages(Math.ceil(rawBranches.length / limit) || 1);
    } catch (err) {
      setError(err.message || "Failed to load branches.");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, status]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  // UseMemo hook for instant client-side searching and status filtering
  const filteredBranches = useMemo(() => {
    return branches.filter((branch) => {
      const matchesSearch = search.trim() === "" ||
        branch.name?.toLowerCase().includes(search.toLowerCase()) ||
        branch.description?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = status === "" || branch.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [branches, search, status]);

  // Handle clicking outside to close the dropdown menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-(--border)">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-(--primary)/10 text-(--primary) rounded-xl">
            <GitBranch className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Branches</h1>
            <p className="text-sm text-(--muted-foreground) mt-0.5">
              Manage the locations connected to your business. ({filteredBranches.length} total)
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/branches/create"
          className="inline-flex items-center justify-center gap-2 bg-(--primary) text-(--primary-foreground) px-4 py-2 rounded-lg font-medium text-sm hover:opacity-95 transition-opacity focus:outline-none focus:ring-2 focus:ring-(--ring) shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create branch</span>
        </Link>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="bg-(--card) border border-(--border) rounded-xl p-4 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--muted-foreground)" />
            <input
              type="text"
              placeholder="Search branches by name, description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-(--background) border border-(--border) rounded-lg text-sm text-(--foreground) focus:outline-none focus:ring-2 focus:ring-(--ring)"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-(--border)">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-1.5 bg-(--background) border border-(--border) rounded-lg text-xs text-(--foreground) focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
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

      {/* Branches Table / Content Container */}
      <div className="bg-(--card) border border-(--border) rounded-xl shadow-xs overflow-hidden">
        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="p-8 space-y-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-(--muted) rounded-lg w-full" />
            ))}
          </div>
        ) : filteredBranches.length > 0 ? (
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
                {filteredBranches.map((branch) => {
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
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isActive
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

                          <div className="relative" ref={openMenuId === branch.id ? menuRef : null}>
                            <button
                              onClick={() => setOpenMenuId(openMenuId === branch.id ? null : branch.id)}
                              className="p-1.5 text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted) rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-(--ring)"
                              aria-label="Actions menu"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {openMenuId === branch.id && (
                              <div className="absolute right-0 bottom-full mb-1 w-44 bg-(--card) border border-(--border) rounded-xl shadow-lg py-1 z-50 text-xs">
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
        ) : (
          <div className="p-12 text-center space-y-3">
            <div className="mx-auto w-12 h-12 bg-(--muted) text-(--muted-foreground) rounded-full flex items-center justify-center">
              <GitBranch className="w-6 h-6" />
            </div>
            <div className="max-w-sm mx-auto space-y-1">
              <h2 className="text-lg font-semibold">No branches found</h2>
              <p className="text-xs text-(--muted-foreground)">
                {search || status
                  ? "Try changing your search or filters."
                  : "Create your first branch to start organizing your business locations."}
              </p>
            </div>
            {!search && !status && (
              <div className="pt-2">
                <Link
                  href="/dashboard/branches/create"
                  className="inline-flex items-center gap-2 bg-(--primary) text-(--primary-foreground) px-4 py-2 rounded-lg font-medium text-sm hover:opacity-95 transition-opacity"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create branch</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Pagination bar */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-(--border) text-xs text-(--muted-foreground)">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-1.5 border border-(--border) rounded-lg disabled:opacity-40 hover:bg-(--muted)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="p-1.5 border border-(--border) rounded-lg disabled:opacity-40 hover:bg-(--muted)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}