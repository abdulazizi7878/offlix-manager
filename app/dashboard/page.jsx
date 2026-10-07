// file: app/dashboard/page.jsx
"use client";

import {
  Suspense,
  useEffect,
  useState,
  useCallback,
  useTransition,
} from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DollarSign,
  Package,
  ShoppingCart,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Wallet,
  CreditCard,
  Building2,
} from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { useTranslations } from "next-intl";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("dashboard.overviewPage");

  // Query state from searchParams or defaults
  const period = searchParams.get("period") || "today";
  const branchId = searchParams.get("branchId") || "";
  const date = searchParams.get("date") || "";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  const [data, setData] = useState(null);
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Update URL query parameters helper
  const updateQueryParams = useCallback(
    (newParams) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(newParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  // Fetch available branches for filter
  useEffect(() => {
    fetchApi("/api/v1/dashboard/available-branches?permission=branches.view")
      .then((res) => {
        const branchList =
          res?.data?.branches ||
          res?.branches ||
          res?.data ||
          (Array.isArray(res) ? res : []);
        setBranches(Array.isArray(branchList) ? branchList : []);
      })
      .catch(() => {
        setBranches([]);
      });
  }, []);

  // Fetch dashboard overview data
  const loadOverview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (period) params.append("period", period);
      if (branchId) params.append("branchId", branchId);
      if (date) params.append("date", date);
      if (from) params.append("from", from);
      if (to) params.append("to", to);

      const res = await fetchApi(`/api/v1/dashboard/overview?${params.toString()}`);
      const payload = res?.data?.data || res?.data || res || {};
      setData(payload);
    } catch (err) {
      setError(err?.message || t("loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [period, branchId, date, from, to, t]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const handlePeriodChange = (newPeriod) => {
    const todayStr = dayjs().format("YYYY-MM-DD");
    let newDate = date;
    if (newPeriod === "today" && !date) {
      newDate = todayStr;
    }
    updateQueryParams({ period: newPeriod, date: newDate });
  };

  const handleBranchChange = (newBranchId) => {
    updateQueryParams({ branchId: newBranchId });
  };

  const handleRefresh = () => {
    loadOverview();
  };

  // Safe destructuring matching new service response
  const moneyData = data?.money || {};
  const salesData = data?.sales || {};
  const receivablesData = data?.receivables || {};
  const payablesData = data?.payables || {};
  const inventoryData = data?.inventory || {};
  const recentSalesList = Array.isArray(data?.recentSales)
    ? data.recentSales
    : Array.isArray(data?.recentSales?.items)
      ? data.recentSales.items
      : Array.isArray(salesData?.recent)
        ? salesData.recent
        : [];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* 1. Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-[var(--card)] border border-[var(--border)] p-6 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            {t("title")}
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            {t("subtitle")}
          </p>
          {data?.period && (
            <p className="text-xs text-[var(--primary)] mt-1 font-medium">
              {t("periodLabel")}: {t(`periods.${data.period.type || period}`)} ({dayjs(data.period.from).format("MMM D, YYYY HH:mm")} - {dayjs(data.period.to).format("MMM D, YYYY HH:mm")})
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Period Selector */}
          <select
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="px-3 py-2 bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-xl text-sm font-medium focus:outline-none focus:border-[var(--primary)]"
          >
            <option value="today">{t("periods.today")}</option>
            <option value="week">{t("periods.week")}</option>
            <option value="month">{t("periods.month")}</option>
            <option value="three_months">{t("periods.three_months")}</option>
            <option value="year">{t("periods.year")}</option>
            <option value="all_time">{t("periods.all_time")}</option>
            <option value="custom">{t("periods.custom")}</option>
          </select>

          {/* Branch Selector */}
          <select
            value={branchId}
            onChange={(e) => handleBranchChange(e.target.value)}
            className="px-3 py-2 bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-xl text-sm font-medium focus:outline-none focus:border-[var(--primary)]"
          >
            <option value="">{t("allBranches")}</option>
            {branches.map((b) => (
              <option key={b.id || b._id} value={b.id || b._id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-[var(--foreground)] rounded-xl text-sm font-medium transition-colors border border-[var(--border)] disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>{t("refresh")}</span>
          </button>
        </div>
      </div>

      {/* Custom Date Controls */}
      {period === "custom" && (
        <div className="flex flex-wrap items-center gap-4 bg-[var(--card)] border border-[var(--border)] p-4 rounded-xl shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              {t("from")}
            </span>
            <input
              type="date"
              value={from}
              onChange={(e) => updateQueryParams({ from: e.target.value })}
              className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              {t("to")}
            </span>
            <input
              type="date"
              value={to}
              onChange={(e) => updateQueryParams({ to: e.target.value })}
              className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl flex items-center justify-between">
          <span className="text-sm font-medium">{error}</span>
          <button onClick={loadOverview} className="px-3 py-1 bg-rose-500 text-white rounded-lg text-xs font-semibold">
            {t("retry")}
          </button>
        </div>
      )}

      {/* 2. Main Priority: Money Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-[var(--primary)]" />
          <h2 className="text-lg font-bold text-[var(--foreground)]">
            {t("money.title")}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            title={t("money.totalBalance")}
            value={`${Number(moneyData.totalBalance || 0).toLocaleString()} ${t("birr")}`}
            icon={DollarSign}
            isLoading={isLoading}
            highlight
          />
          <KpiCard
            title={t("money.liquidBalance")}
            value={`${Number(moneyData.liquidBalance || 0).toLocaleString()} ${t("birr")}`}
            icon={Wallet}
            isLoading={isLoading}
          />
          <KpiCard
            title={t("money.accountsCount")}
            value={Number(moneyData.accountCount || moneyData.accountCount || 0).toLocaleString()}
            icon={CreditCard}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* 3. Secondary High-Level Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales Card */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-[var(--muted-foreground)] border-b border-[var(--border)] pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
              {t("sales.title")}
            </span>
            <ShoppingCart className="w-4 h-4 opacity-70" />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[var(--muted-foreground)]">{t("sales.salesCount")}</span>
              <span className="font-mono font-bold text-sm text-[var(--foreground)]">
                {Number(salesData.salesCount || salesData.count || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--muted-foreground)]">{t("sales.totalSales")}</span>
              <span className="font-mono font-bold text-sm text-[var(--primary)]">
                {Number(salesData.totalSales || salesData.totalAmount || salesData.total || 0).toLocaleString()} {t("birr")}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--muted-foreground)]">{t("sales.unpaidSales")}</span>
              <span className="font-mono font-bold text-sm text-rose-500">
                {Number(salesData.unpaidSales || salesData.unpaidCount || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Receivables Card */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-[var(--muted-foreground)] border-b border-[var(--border)] pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
              {t("receivables.title")}
            </span>
            <DollarSign className="w-4 h-4 opacity-70" />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[var(--muted-foreground)]">{t("receivables.openCount")}</span>
              <span className="font-mono font-bold text-sm text-[var(--foreground)]">
                {Number(receivablesData.openCount || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--muted-foreground)]">{t("receivables.outstanding")}</span>
              <span className="font-mono font-bold text-sm text-[var(--primary)]">
                {Number(receivablesData.outstandingAmount || 0).toLocaleString()} {t("birr")}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--muted-foreground)]">{t("receivables.overdue")}</span>
              <span className="font-mono font-bold text-sm text-rose-500">
                {Number(receivablesData.overdueCount || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Payables Card */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-[var(--muted-foreground)] border-b border-[var(--border)] pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
              {t("payables.title")}
            </span>
            <Building2 className="w-4 h-4 opacity-70" />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[var(--muted-foreground)]">{t("payables.openCount")}</span>
              <span className="font-mono font-bold text-sm text-[var(--foreground)]">
                {Number(payablesData.openCount || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--muted-foreground)]">{t("payables.outstanding")}</span>
              <span className="font-mono font-bold text-sm text-[var(--primary)]">
                {Number(payablesData.outstandingAmount || 0).toLocaleString()} {t("birr")}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--muted-foreground)]">{t("payables.overdue")}</span>
              <span className="font-mono font-bold text-sm text-rose-500">
                {Number(payablesData.overdueCount || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Inventory Card */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-[var(--muted-foreground)] border-b border-[var(--border)] pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
              {t("inventory.title")}
            </span>
            <Package className="w-4 h-4 opacity-70" />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-amber-500 font-medium">{t("inventory.lowStock")}</span>
              <span className="font-mono font-bold text-sm text-amber-500">
                {Number(inventoryData.lowStockCount || inventoryData.lowStock || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-rose-500 font-medium">{t("inventory.outOfStock")}</span>
              <span className="font-mono font-bold text-sm text-rose-500">
                {Number(inventoryData.outOfStockCount || inventoryData.outOfStock || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Recent Sales Table */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-xs overflow-hidden">
        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--foreground)]">
              {t("recentSales.title")}
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              {t("recentSales.subtitle")}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30 text-xs font-medium text-[var(--muted-foreground)]">
                <th className="py-3 px-6">{t("recentSales.colCustomer")}</th>
                <th className="py-3 px-6">{t("recentSales.colBranch")}</th>
                <th className="py-3 px-6 text-right">{t("recentSales.colTotal")}</th>
                <th className="py-3 px-6">{t("recentSales.colStatus")}</th>
                <th className="py-3 px-6">{t("recentSales.colCreatedBy")}</th>
                <th className="py-3 px-6">{t("recentSales.colDate")}</th>
                <th className="py-3 px-6 text-right">{t("recentSales.colAction")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[var(--muted-foreground)]">
                    {t("recentSales.loading")}
                  </td>
                </tr>
              ) : recentSalesList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[var(--muted-foreground)]">
                    {t("recentSales.noSales")}
                  </td>
                </tr>
              ) : (
                recentSalesList.map((sale, idx) => {
                  const id = sale.id || sale._id || idx;
                  const customer = sale.customerName || sale.customer?.name || t("recentSales.walkIn");
                  const branchName = sale.branchName || sale.branch?.name || "—";
                  const total = Number(sale.totalAmount || sale.amount || 0);
                  const status = sale.paymentStatus || "paid";
                  const createdBy = sale.createdByName || sale.createdBy?.name || "—";
                  const dateStr = sale.createdAt;

                  return (
                    <tr key={id} className="hover:bg-[var(--muted)]/20 transition-colors">
                      <td className="py-3.5 px-6 font-medium text-xs text-[var(--foreground)]">
                        {customer}
                      </td>
                      <td className="py-3.5 px-6 text-xs text-[var(--muted-foreground)]">
                        {branchName}
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono text-xs font-semibold">
                        {total.toLocaleString()} {t("birr")}
                      </td>
                      <td className="py-3.5 px-6 text-xs">
                        <StatusBadge status={status} t={t} />
                      </td>
                      <td className="py-3.5 px-6 text-xs text-[var(--muted-foreground)]">
                        {createdBy}
                      </td>
                      <td className="py-3.5 px-6 text-xs text-[var(--muted-foreground)]" title={dateStr ? dayjs(dateStr).format("YYYY-MM-DD HH:mm:ss") : ""}>
                        {dateStr ? dayjs(dateStr).fromNow() : "—"}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <Link
                          href={`/dashboard/sales/${id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-[var(--foreground)] rounded-lg text-xs font-medium transition-colors"
                        >
                          <span>{t("recentSales.view")}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function KpiCard({ title, value, subtitle, icon: Icon, isLoading, highlight }) {
  return (
    <div className={`bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-xs space-y-2 ${highlight ? "ring-1 ring-[var(--primary)]/50 bg-[var(--primary)]/5" : ""}`}>
      <div className="flex items-center justify-between text-[var(--muted-foreground)]">
        <span className="text-xs font-medium">{title}</span>
        {Icon && <Icon className="w-4 h-4 opacity-70" />}
      </div>
      <div>
        {isLoading ? (
          <div className="h-7 w-24 bg-[var(--muted)]/30 rounded animate-pulse my-1" />
        ) : (
          <div className={`text-xl font-bold font-mono tracking-tight ${highlight ? "text-[var(--primary)]" : "text-[var(--foreground)]"}`}>
            {value}
          </div>
        )}
        {subtitle && <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5 leading-tight">{subtitle}</p>}
      </div>
    </div>
  );
}

function StatusBadge({ status, t }) {
  switch (status) {
    case "paid":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" /> {t("status.paid")}
        </span>
      );
    case "partial":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <Clock className="w-3 h-3" /> {t("status.partial")}
        </span>
      );
    case "credit":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20">
          <AlertTriangle className="w-3 h-3" /> {t("status.credit")}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--muted)] text-[var(--muted-foreground)]">
          {t(`status.${status}`)}
        </span>
      );
  }
}

export default function OfflixManagerDashboard() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-6">
          <div className="h-8 w-48 bg-[var(--muted)]/30 rounded animate-pulse" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}