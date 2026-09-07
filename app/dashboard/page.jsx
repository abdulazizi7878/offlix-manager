// file: app/dashboard/page.jsx

import Link from "next/link";
import { GitBranch, Plus, ArrowRight, ShieldCheck, Building2 } from "lucide-react";

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-(--border)">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-(--muted-foreground) mt-1">
            Welcome back. Manage your business branches and operations from one central place.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/branches/create"
            className="inline-flex items-center gap-2 bg-(--primary) text-(--primary-foreground) px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-(--ring)"
          >
            <Plus className="w-4 h-4" />
            <span>Create Branch</span>
          </Link>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Branches Card */}
        <div className="p-6 bg-(--card) text-(--card-foreground) border border-(--border) rounded-xl shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-(--muted) text-(--primary) rounded-lg">
              <GitBranch className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-(--muted) text-(--muted-foreground) rounded-full">
              Active Module
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Branches</h2>
            <p className="text-xs text-(--muted-foreground) mt-1">
              Manage physical locations, view operating statuses, and update branch info.
            </p>
          </div>
          <div className="pt-4 border-t border-(--border) flex items-center justify-between">
            <Link
              href="/dashboard/branches"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-(--primary) hover:underline focus:outline-none focus:ring-2 focus:ring-(--ring) rounded-sm"
            >
              <span>View all branches</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Security / System Status Card */}
        <div className="p-6 bg-(--card) text-(--card-foreground) border border-(--border) rounded-xl shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-(--muted) text-(--success) rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-(--muted) text-(--muted-foreground) rounded-full">
              Secure
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Access Control</h2>
            <p className="text-xs text-(--muted-foreground) mt-1">
              Authenticated securely via session tokens and encrypted HTTP-only cookies.
            </p>
          </div>
          <div className="pt-4 border-t border-(--border) flex items-center justify-between text-xs text-(--muted-foreground)">
            <span>Session Active</span>
            <span className="w-2 h-2 rounded-full bg-(--success)"></span>
          </div>
        </div>

        {/* Enterprise Organization Card */}
        <div className="p-6 bg-(--card) text-(--card-foreground) border border-(--border) rounded-xl shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-(--muted) text-(--primary) rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-(--muted) text-(--muted-foreground) rounded-full">
              Offlix Core
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Business Network</h2>
            <p className="text-xs text-(--muted-foreground) mt-1">
              Your centralized management workspace for multi-branch tracking and administration.
            </p>
          </div>
          <div className="pt-4 border-t border-(--border) flex items-center justify-between text-xs text-(--muted-foreground)">
            <span>Ready for operations</span>
          </div>
        </div>

      </div>
    </div>
  );
}