// file: app/dashboard/branches/[id]/page.jsx

"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Power, GitBranch, AlertCircle, RefreshCcw } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";

export default function BranchDetailsPage({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();

  const [branch, setBranch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isActioning, setIsActioning] = useState(false);

  const fetchBranchDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchApi(`/api/v1/dashboard/branches/${id}`);
      setBranch(res.data?.branch || res.data);
    } catch (err) {
      setError(err.message || "Failed to load branch details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchBranchDetails();
  }, [id]);

  const handleStatusToggle = async () => {
    if (!branch) return;
    const nextStatus = branch.status === "active" ? "inactive" : "active";
    setIsActioning(true);
    try {
      await fetchApi(`/api/v1/dashboard/branches/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      toast.success(`Branch status updated to ${nextStatus}.`);
      fetchBranchDetails();
    } catch (err) {
      toast.error(err.message || "Failed to update status.");
    } finally {
      setIsActioning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="h-8 bg-(--muted)/40 rounded-lg w-1/3 animate-pulse" />
        <div className="h-64 bg-(--muted)/40 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !branch) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-(--card) border border-(--border) rounded-xl text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-(--destructive) mx-auto" />
        <h1 className="text-lg font-semibold">Unable to load branch</h1>
        <p className="text-xs text-(--muted-foreground)">{error || "Branch not found."}</p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard/branches"
            className="px-4 py-2 border border-(--border) rounded-lg text-sm font-medium hover:bg-(--muted)"
          >
            Back to Branches
          </Link>
          <button
            onClick={fetchBranchDetails}
            className="px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-sm font-medium hover:opacity-90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isActive = branch.status === "active";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/branches"
            className="p-2 border border-(--border) rounded-lg text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted) transition-colors"
            aria-label="Back to branches"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{branch.name}</h1>
            <p className="text-sm text-(--muted-foreground)">Branch overview and details.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/branches/${id}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-(--border) bg-(--card) text-(--foreground) rounded-lg text-sm font-medium hover:bg-(--muted) transition-colors"
          >
            <Pencil className="w-4 h-4" />
            <span>Edit</span>
          </Link>
          <button
            disabled={isActioning}
            onClick={handleStatusToggle}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive 
                ? "bg-(--destructive)/10 text-(--destructive) hover:bg-(--destructive)/20" 
                : "bg-(--success)/10 text-(--success) hover:bg-(--success)/20"
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{isActive ? "Deactivate" : "Activate"}</span>
          </button>
        </div>
      </div>

      <div className="bg-(--card) border border-(--border) rounded-xl p-6 shadow-xs space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Status</span>
            <div className="mt-1">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                isActive ? "bg-(--success)/10 text-(--success)" : "bg-(--muted) text-(--muted-foreground)"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-(--success)" : "bg-(--muted-foreground)"}`} />
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Branch ID</span>
            <p className="mt-1 text-sm font-mono">{branch.id}</p>
          </div>

          <div className="sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Description</span>
            <p className="mt-1 text-sm text-(--foreground)">
              {branch.description || "No description provided for this branch."}
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Created At</span>
            <p className="mt-1 text-xs text-(--muted-foreground)">
              {branch.created_at ? new Date(branch.created_at).toLocaleString() : "N/A"}
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Updated At</span>
            <p className="mt-1 text-xs text-(--muted-foreground)">
              {branch.updated_at ? new Date(branch.updated_at).toLocaleString() : "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}