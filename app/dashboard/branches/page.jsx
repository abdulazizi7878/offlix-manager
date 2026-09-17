// file: app/dashboard/branches/page.jsx

"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { Plus, GitBranch, MoreHorizontal, Pencil, Power, AlertCircle, RefreshCcw, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function BranchesOverviewPage() {
  const t = useTranslations("dashboard.branchesPage");

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

      const rawBranches = Array.isArray(res.data) ? res.data : (res.data?.branches || res.data?.data || []);

      setBranches(rawBranches);
      setTotalPages(Math.ceil(rawBranches.length / limit) || 1);
    } catch (err) {
      setError(err.message || t("loadError"));
    } Object.finally?.() || setIsLoading(false);
  }, [page, limit, status, t]);

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
      toast.success(t("statusUpdatedSuccess", { status: nextStatus }));
      fetchBranches();
    } catch (err) {
      toast.error(err.message || t("statusUpdateError"));
    } finally {
      setActionLoadingId(null);
      setOpenMenuId(null);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl">
            <GitBranch className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
              {t("subtitle", { total: filteredBranches.length })}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/branches/create"
          className="inline-flex items-center justify-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg font-medium text-sm hover:opacity-95 transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--ring)] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t("createBranch")}</span>
        </Link>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--border)]">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-xs text-[var(--foreground)] focus:outline-none"
          >
            <option value="">{t("statusFilter.all")}</option>
            <option value="active">{t("statusFilter.active")}</option>
            <option value="inactive">{t("statusFilter.inactive")}</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 rounded-xl flex items-center justify-between text-[var(--destructive)]">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">{t("errorTitle")}</p>
              <p className="text-xs opacity-90">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchBranches}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-xs font-medium rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>{t("retry")}</span>
          </button>
        </div>
      )}

      {/* Branches Table / Content Container */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-[var(--muted)] rounded-lg w-full" />
            ))}
          </div>
        ) : filteredBranches.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--muted)]/50 border-b border-[var(--border)] text-[var(--muted-foreground)] text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">{t("colName")}</th>
                  <th className="px-6 py-3.5">{t("colStatus")}</th>
                  <th className="px-6 py-3.5">{t("colUpdated")}</th>
                  <th className="px-6 py-3.5 text-right">{t("colActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredBranches.map((branch) => {
                  const isActive = branch.status === "active";
                  const isActioning = actionLoadingId === branch.id;

                  return (
                    <tr key={branch.id} className="hover:bg-[var(--muted)]/30 transition-colors">
                      <td className="px-6 py-4 font-medium">
                        <Link href={`/dashboard/branches/${branch.id}`} className="hover:underline text-[var(--foreground)]">
                          {branch.name}
                        </Link>
                        {branch.description && (
                          <p className="text-xs text-[var(--muted-foreground)] truncate max-w-xs mt-0.5">
                            {branch.description}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isActive
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-[var(--muted-foreground)]"}`} />
                          {isActive ? t("statusActive") : t("statusInactive")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-[var(--muted-foreground)]">
                        {branch.updated_at ? new Date(branch.updated_at).toLocaleDateString() : t("recently")}
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/branches/${branch.id}/edit`}
                            className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
                            title={t("editBranch")}
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>

                          <div className="relative" ref={openMenuId === branch.id ? menuRef : null}>
                            <button
                              onClick={() => setOpenMenuId(openMenuId === branch.id ? null : branch.id)}
                              className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                              aria-label={t("actionsMenu")}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {openMenuId === branch.id && (
                              <div className="absolute right-0 bottom-full mb-1 w-44 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg py-1 z-50 text-xs">
                                <Link
                                  href={`/dashboard/branches/${branch.id}`}
                                  className="block px-4 py-2 text-left hover:bg-[var(--muted)] text-[var(--foreground)]"
                                  onClick={() => setOpenMenuId(null)}
                                >
                                  {t("viewDetails")}
                                </Link>
                                <button
                                  disabled={isActioning}
                                  onClick={() => handleStatusToggle(branch)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-[var(--muted)] text-[var(--foreground)] disabled:opacity-50"
                                >
                                  <Power className="w-3.5 h-3.5" />
                                  <span>{isActive ? t("deactivate") : t("activate")}</span>
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
            <div className="mx-auto w-12 h-12 bg-[var(--muted)] text-[var(--muted-foreground)] rounded-full flex items-center justify-center">
              <GitBranch className="w-6 h-6" />
            </div>
            <div className="max-w-sm mx-auto space-y-1">
              <h2 className="text-lg font-semibold">{t("emptyTitle")}</h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                {search || status
                  ? t("emptyFilterDesc")
                  : t("emptyInitialDesc")}
              </p>
            </div>
            {!search && !status && (
              <div className="pt-2">
                <Link
                  href="/dashboard/branches/create"
                  className="inline-flex items-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg font-medium text-sm hover:opacity-95 transition-opacity"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t("createBranch")}</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Pagination Bar */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)]">
            <span>{t("pagination", { page, totalPages })}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-1.5 border border-[var(--border)] rounded-lg disabled:opacity-40 hover:bg-[var(--muted)]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="p-1.5 border border-[var(--border)] rounded-lg disabled:opacity-40 hover:bg-[var(--muted)]"
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