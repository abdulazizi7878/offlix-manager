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
  TrendingUp,
  DollarSign,
  Package,
  ShoppingCart,
  Building2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
  FileText,
  ArrowRight,
  ShieldAlert,
  Wallet,
  CreditCard,
  Layers,
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
  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 10);

  // Sub-pagination states
  const productsPage = Number(searchParams.get("productsPage") || 1);
  const alertsPage = Number(searchParams.get("alertsPage") || 1);
  const salesPage = Number(searchParams.get("salesPage") || 1);

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
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      params.append("productsPage", productsPage.toString());
      params.append("alertsPage", alertsPage.toString());
      params.append("salesPage", salesPage.toString());

      const res = await fetchApi(`/api/v1/dashboard/overview?${params.toString()}`);
      const payload = res?.data?.data || res?.data || res || {};
      setData(payload);
    } catch (err) {
      setError(err?.message || t("loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [period, branchId, date, from, to, page, limit, productsPage, alertsPage, salesPage, t]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const handlePeriodChange = (newPeriod) => {
    const todayStr = dayjs().format("YYYY-MM-DD");
    let newDate = date;
    if (newPeriod === "today" && !date) {
      newDate = todayStr;
    }
    updateQueryParams({ period: newPeriod, date: newDate, page: 1 });
  };

  const handleBranchChange = (newBranchId) => {
    updateQueryParams({ branchId: newBranchId, page: 1 });
  };

  const handleRefresh = () => {
    loadOverview();
  };

  // Safe destructuring across all potential API response structures
  const summary = data?.summary || {};
  const salesData = data?.sales || {};
  const purchasesData = data?.purchases?.summary || {};
  const inventoryData = data?.inventory?.summary || {};
  const moneyData = data?.money || {};
  const receivablesData = data?.receivables || {};
  const payablesData = data?.payables || {};
  const settlementsData = data?.settlements || {};
  const branchPerformance = Array.isArray(data?.branches) ? data.branches : [];

  const alertsList = Array.isArray(data?.inventory?.alerts)
    ? data.inventory.alerts
    : Array.isArray(data?.inventory?.alerts?.items)
      ? data.inventory.alerts.items
      : [];

  const topProductsList = Array.isArray(data?.sales?.topProducts)
    ? data.sales.topProducts
    : Array.isArray(data?.sales?.topProducts?.items)
      ? data.sales.topProducts.items
      : [];

  const recentSalesList = Array.isArray(data?.sales?.recent)
    ? data.sales.recent
    : Array.isArray(data?.sales?.recent?.items)
      ? data.sales.recent.items
      : [];

  const paymentStatusList = Array.isArray(salesData?.byPaymentStatus)
    ? salesData.byPaymentStatus
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

      {/* 2. Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title={t("kpis.revenue")}
          value={`${Number(summary.revenue || 0).toLocaleString()} ${t("birr")}`}
          icon={DollarSign}
          isLoading={isLoading}
        />
        <KpiCard
          title={t("kpis.salesCount")}
          value={Number(summary.salesCount || 0).toLocaleString()}
          icon={ShoppingCart}
          isLoading={isLoading}
        />
        <KpiCard
          title={t("kpis.unitsSold")}
          value={Number(summary.unitsSold || 0).toLocaleString()}
          icon={Package}
          isLoading={isLoading}
        />
        <KpiCard
          title={t("kpis.estimatedProfit")}
          value={`${Number(summary.estimatedProfit || 0).toLocaleString()} ${t("birr")}`}
          subtitle={t("kpis.estimatedProfitSubtitle")}
          icon={TrendingUp}
          isLoading={isLoading}
          highlight
        />
        <KpiCard
          title={t("kpis.estimatedCogs")}
          value={`${Number(summary.estimatedCogs || 0).toLocaleString()} ${t("birr")}`}
          icon={Layers}
          isLoading={isLoading}
        />
      </div>

      {/* 3. Sales Analytics & Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--foreground)]">
              {t("salesTrend.title")}
            </h2>
            <span className="text-xs text-[var(--muted-foreground)]">
              {t("salesTrend.subtitle")}
            </span>
          </div>
          <div className="h-64 flex items-center justify-center border border-dashed border-[var(--border)] rounded-xl bg-[var(--muted)]/10">
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className="text-center space-y-1">
                <TrendingUp className="w-8 h-8 text-[var(--muted-foreground)] mx-auto opacity-40" />
                <p className="text-xs text-[var(--muted-foreground)]">
                  {t("salesTrend.totalRevenue")}{" "}
                  <span className="font-semibold text-[var(--foreground)]">
                    {Number(summary.revenue || 0).toLocaleString()} {t("birr")}
                  </span>
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {t("salesTrend.totalUnitsSold")}{" "}
                  <span className="font-semibold text-[var(--foreground)]">
                    {Number(summary.unitsSold || 0).toLocaleString()}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[var(--foreground)]">
            {t("paymentBreakdown.title")}
          </h2>
          <div className="space-y-3 pt-2">
            {paymentStatusList.length > 0 ? (
              paymentStatusList.map((item, i) => (
                <PaymentStatusRow
                  key={i}
                  label={item.status || item.paymentStatus || "paid"}
                  count={item.count}
                  amount={item.amount}
                  color={item.status === 'paid' ? 'bg-emerald-500' : item.status === 'partial' ? 'bg-amber-500' : 'bg-rose-500'}
                  t={t}
                />
              ))
            ) : (
              <p className="text-xs text-[var(--muted-foreground)] text-center py-4">
                {t("paymentBreakdown.noBreakdown")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 4. Products Section (Top-selling products) */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-xs overflow-hidden">
        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--foreground)]">
              {t("topProducts.title")}
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              {t("topProducts.subtitle")}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30 text-xs font-medium text-[var(--muted-foreground)]">
                <th className="py-3 px-6">{t("topProducts.colName")}</th>
                <th className="py-3 px-6 text-right">{t("topProducts.colUnits")}</th>
                <th className="py-3 px-6 text-right">{t("topProducts.colRevenue")}</th>
                <th className="py-3 px-6 text-right">{t("topProducts.colProfit")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs text-[var(--muted-foreground)]">
                    {t("topProducts.loading")}
                  </td>
                </tr>
              ) : topProductsList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs text-[var(--muted-foreground)]">
                    {t("topProducts.noProducts")}
                  </td>
                </tr>
              ) : (
                topProductsList.map((prod, idx) => (
                  <tr key={prod.id || prod._id || idx} className="hover:bg-[var(--muted)]/20 transition-colors">
                    <td className="py-3.5 px-6 font-medium text-xs text-[var(--foreground)]">
                      {prod.name || prod.productName || "Unnamed Product"}
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono text-xs">
                      {Number(prod.unitsSold || prod.quantity || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono text-xs font-semibold text-[var(--primary)]">
                      {Number(prod.revenue || 0).toLocaleString()} {t("birr")}
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono text-xs text-emerald-600 dark:text-emerald-400">
                      {Number(prod.estimatedProfit || prod.profit || 0).toLocaleString()} {t("birr")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Purchases Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[var(--foreground)]">
            {t("purchases.title")}
          </h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            {t("purchases.subtitle")}
          </p>
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-[var(--muted)]/20 rounded-xl border border-[var(--border)]">
              <span className="text-[11px] text-[var(--muted-foreground)]">
                {t("purchases.count")}
              </span>
              <div className="text-lg font-bold font-mono text-[var(--foreground)]">
                {Number(purchasesData.purchaseCount || 0).toLocaleString()}
              </div>
            </div>
            <div className="p-3 bg-[var(--muted)]/20 rounded-xl border border-[var(--border)]">
              <span className="text-[11px] text-[var(--muted-foreground)]">
                {t("purchases.units")}
              </span>
              <div className="text-lg font-bold font-mono text-[var(--foreground)]">
                {Number(purchasesData.unitsPurchased || 0).toLocaleString()}
              </div>
            </div>
            <div className="p-3 bg-[var(--muted)]/20 rounded-xl border border-[var(--border)]">
              <span className="text-[11px] text-[var(--muted-foreground)]">
                {t("purchases.cost")}
              </span>
              <div className="text-sm font-bold font-mono text-[var(--primary)] truncate">
                {Number(purchasesData.purchaseCost || 0).toLocaleString()} {t("birr")}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[var(--foreground)]">
            {t("purchases.trendTitle")}
          </h2>
          <div className="h-32 flex items-center justify-center border border-dashed border-[var(--border)] rounded-xl bg-[var(--muted)]/10">
            <span className="text-xs text-[var(--muted-foreground)]">
              {Array.isArray(data?.purchases?.trend) && data.purchases.trend.length
                ? `${data.purchases.trend.length} ${t("purchases.logged")}`
                : t("purchases.chartFallback")}
            </span>
          </div>
        </div>
      </div>

      {/* 6. Inventory Section & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[var(--foreground)]">
            {t("inventory.valuationTitle")}
          </h2>
          <div className="space-y-3 pt-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
              <span className="text-[var(--muted-foreground)]">
                {t("inventory.totalProducts")}
              </span>
              <span className="font-mono font-semibold">{Number(inventoryData.productCount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
              <span className="text-[var(--muted-foreground)]">
                {t("inventory.totalUnits")}
              </span>
              <span className="font-mono font-semibold">{Number(inventoryData.totalUnits || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
              <span className="text-[var(--muted-foreground)]">
                {t("inventory.costValue")}
              </span>
              <span className="font-mono font-semibold text-[var(--primary)]">
                {Number(inventoryData.inventoryCostValue || 0).toLocaleString()} {t("birr")}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
              <span className="text-[var(--muted-foreground)]">
                {t("inventory.retailValue")}
              </span>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                {Number(inventoryData.inventoryRetailValue || 0).toLocaleString()} {t("birr")}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
              <span className="text-rose-500">
                {t("inventory.outOfStock")}
              </span>
              <span className="font-mono font-semibold text-rose-500">{Number(inventoryData.outOfStockCount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-amber-500">
                {t("inventory.lowStock")}
              </span>
              <span className="font-mono font-semibold text-amber-500">{Number(inventoryData.lowStockCount || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-xs overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[var(--border)]">
            <h2 className="text-base font-bold text-[var(--foreground)]">
              {t("inventory.alertsTitle")}
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              {t("inventory.alertsSubtitle")}
            </p>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30 text-xs font-medium text-[var(--muted-foreground)]">
                  <th className="py-3 px-6">{t("topProducts.colName")}</th>
                  <th className="py-3 px-6">{t("inventory.colBranch")}</th>
                  <th className="py-3 px-6 text-center">{t("inventory.colStock")}</th>
                  <th className="py-3 px-6 text-center">{t("inventory.colThreshold")}</th>
                  <th className="py-3 px-6">{t("inventory.colAlertType")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-[var(--muted-foreground)]">
                      {t("inventory.loadingAlerts")}
                    </td>
                  </tr>
                ) : alertsList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-[var(--muted-foreground)]">
                      {t("inventory.noAlerts")}
                    </td>
                  </tr>
                ) : (
                  alertsList.map((alert, idx) => (
                    <tr key={alert.id || alert._id || idx} className="hover:bg-[var(--muted)]/20 transition-colors">
                      <td className="py-3.5 px-6 font-medium text-xs text-[var(--foreground)]">
                        {alert.name || alert.productName}
                      </td>
                      <td className="py-3.5 px-6 text-xs text-[var(--muted-foreground)] font-mono">
                        {alert.branchId || "—"}
                      </td>
                      <td className="py-3.5 px-6 text-center font-mono text-xs font-bold">
                        {alert.stock ?? 0}
                      </td>
                      <td className="py-3.5 px-6 text-center font-mono text-xs text-[var(--muted-foreground)]">
                        {alert.lowStockThreshold ?? 5}
                      </td>
                      <td className="py-3.5 px-6 text-xs">
                        {alert.alertType === "out_of_stock" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20">
                            <ShieldAlert className="w-3 h-3" /> {t("inventory.outOfStock")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            <AlertTriangle className="w-3 h-3" /> {t("inventory.lowStock")}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 7. Recent Sales */}
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

      {/* 8. Money Summary */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-[var(--foreground)]">
            {t("money.title")}
          </h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            {t("money.subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-1">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {t("money.moneyIn")}
            </span>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {Number(moneyData.moneyIn || 0).toLocaleString()} {t("birr")}
            </div>
          </div>
          <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl space-y-1">
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
              {t("money.moneyOut")}
            </span>
            <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
              {Number(moneyData.moneyOut || 0).toLocaleString()} {t("birr")}
            </div>
          </div>
          <div className="p-4 bg-[var(--muted)]/20 border border-[var(--border)] rounded-xl space-y-1">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              {t("money.netFlow")}
            </span>
            <div className="text-xl font-bold font-mono text-[var(--foreground)]">
              {Number(moneyData.netMoneyFlow || 0).toLocaleString()} {t("birr")}
            </div>
          </div>
        </div>
      </div>

      {/* 9. Receivables and Payables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-[var(--foreground)]">
              {t("receivables.title")}
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              {t("receivables.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-[var(--muted)]/25 rounded-xl border border-[var(--border)]">
              <span className="text-[11px] text-[var(--muted-foreground)]">
                {t("receivables.openCount")}
              </span>
              <div className="text-lg font-bold font-mono text-[var(--foreground)]">
                {Number(receivablesData.openCount || 0).toLocaleString()}
              </div>
            </div>
            <div className="p-3 bg-[var(--muted)]/25 rounded-xl border border-[var(--border)]">
              <span className="text-[11px] text-[var(--muted-foreground)]">
                {t("receivables.outstanding")}
              </span>
              <div className="text-sm font-bold font-mono text-[var(--primary)] truncate">
                {Number(receivablesData.outstandingAmount || 0).toLocaleString()} {t("birr")}
              </div>
            </div>
            <div className="p-3 bg-[var(--muted)]/25 rounded-xl border border-[var(--border)]">
              <span className="text-[11px] text-[var(--muted-foreground)]">
                {t("receivables.overdue")}
              </span>
              <div className="text-lg font-bold font-mono text-rose-500">
                {Number(receivablesData.overdueCount || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-[var(--foreground)]">
              {t("payables.title")}
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              {t("payables.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-[var(--muted)]/25 rounded-xl border border-[var(--border)]">
              <span className="text-[11px] text-[var(--muted-foreground)]">
                {t("payables.openCount")}
              </span>
              <div className="text-lg font-bold font-mono text-[var(--foreground)]">
                {Number(payablesData.openCount || 0).toLocaleString()}
              </div>
            </div>
            <div className="p-3 bg-[var(--muted)]/25 rounded-xl border border-[var(--border)]">
              <span className="text-[11px] text-[var(--muted-foreground)]">
                {t("payables.outstanding")}
              </span>
              <div className="text-sm font-bold font-mono text-[var(--primary)] truncate">
                {Number(payablesData.outstandingAmount || 0).toLocaleString()} {t("birr")}
              </div>
            </div>
            <div className="p-3 bg-[var(--muted)]/25 rounded-xl border border-[var(--border)]">
              <span className="text-[11px] text-[var(--muted-foreground)]">
                {t("payables.overdue")}
              </span>
              <div className="text-lg font-bold font-mono text-rose-500">
                {Number(payablesData.overdueCount || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 10. Settlement Section */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-[var(--foreground)]">
            {t("settlements.title")}
          </h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            {t("settlements.subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
          <div className="p-4 bg-[var(--muted)]/20 border border-[var(--border)] rounded-xl space-y-1">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              {t("settlements.pendingCount")}
            </span>
            <div className="text-xl font-bold font-mono text-amber-500">
              {Number(settlementsData.pendingCount || 0).toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-[var(--muted)]/20 border border-[var(--border)] rounded-xl space-y-1">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              {t("settlements.requestedCount")}
            </span>
            <div className="text-xl font-bold font-mono text-[var(--foreground)]">
              {Number(settlementsData.requestedCount || 0).toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-[var(--muted)]/20 border border-[var(--border)] rounded-xl space-y-1">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              {t("settlements.receivedCount")}
            </span>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {Number(settlementsData.receivedCount || 0).toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-[var(--muted)]/20 border border-[var(--border)] rounded-xl space-y-1">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              {t("settlements.pendingAmount")}
            </span>
            <div className="text-xl font-bold font-mono text-[var(--primary)]">
              {Number(settlementsData.pendingAmount || 0).toLocaleString()} {t("birr")}
            </div>
          </div>
        </div>
      </div>

      {/* 11. Branch Performance */}
      {!branchId && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-xs overflow-hidden">
          <div className="p-6 border-b border-[var(--border)]">
            <h2 className="text-base font-bold text-[var(--foreground)]">
              {t("branchPerformance.title")}
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              {t("branchPerformance.subtitle")}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30 text-xs font-medium text-[var(--muted-foreground)]">
                  <th className="py-3 px-6">{t("branchPerformance.colBranchName")}</th>
                  <th className="py-3 px-6 text-center">{t("branchPerformance.colSalesCount")}</th>
                  <th className="py-3 px-6 text-right">{t("branchPerformance.colRevenue")}</th>
                  <th className="py-3 px-6 text-right">{t("branchPerformance.colUnitsSold")}</th>
                  <th className="py-3 px-6 text-right">{t("branchPerformance.colCogs")}</th>
                  <th className="py-3 px-6 text-right">{t("branchPerformance.colProfit")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-[var(--muted-foreground)]">
                      {t("branchPerformance.loading")}
                    </td>
                  </tr>
                ) : branchPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-[var(--muted-foreground)]">
                      {t("branchPerformance.noData")}
                    </td>
                  </tr>
                ) : (
                  branchPerformance.map((branch, idx) => (
                    <tr key={branch.branchId || branch.id || idx} className="hover:bg-[var(--muted)]/20 transition-colors">
                      <td className="py-3.5 px-6 font-medium text-xs text-[var(--foreground)]">
                        {branch.branchName || branch.name}
                      </td>
                      <td className="py-3.5 px-6 text-center font-mono text-xs">
                        {Number(branch.salesCount || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono text-xs font-semibold text-[var(--primary)]">
                        {Number(branch.revenue || 0).toLocaleString()} {t("birr")}
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono text-xs">
                        {Number(branch.unitsSold || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono text-xs text-[var(--muted-foreground)]">
                        {Number(branch.estimatedCogs || 0).toLocaleString()} {t("birr")}
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {Number(branch.estimatedProfit || 0).toLocaleString()} {t("birr")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function KpiCard({ title, value, subtitle, icon: Icon, isLoading, highlight }) {
  return (
    <div className={`bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-xs space-y-2 ${highlight ? "ring-1 ring-[var(--primary)]/50" : ""}`}>
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

function PaymentStatusRow({ label, count, amount, color, t }) {
  return (
    <div className="flex items-center justify-between p-3 bg-[var(--muted)]/10 border border-[var(--border)] rounded-xl">
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
        <span className="text-xs font-medium text-[var(--foreground)] capitalize">
          {t(`status.${label}`)}
        </span>
      </div>
      <div className="text-right font-mono">
        <div className="text-xs font-bold text-[var(--foreground)]">
          {Number(amount || 0).toLocaleString()} {t("birr")}
        </div>
        <div className="text-[10px] text-[var(--muted-foreground)]">
          {Number(count || 0)} {t("paymentBreakdown.transactions")}
        </div>
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