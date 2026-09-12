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
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Query state from searchParams or defaults
  const period = searchParams.get("period") || "today";
  const branchId = searchParams.get("branchId") || "";
  const date = searchParams.get("date") || "";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 10);

  // Sub-pagination states if needed independently, or driven by searchParams
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
        setBranches(res.data?.branches || res.data || res || []);
      })
      .catch(() => {
        // fallback or silent catch
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
      setData(res.data || res);
    } catch (err) {
      setError(err.message || "Failed to load dashboard overview.");
    } finally {
      setIsLoading(false);
    }
  }, [period, branchId, date, from, to, page, limit, productsPage, alertsPage, salesPage]);

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

  // Summary metrics destructured safely matching the exact API response
  const summary = data?.summary || {};
  const salesData = data?.sales || {};
  const purchasesData = data?.purchases?.summary || {};
  const inventoryData = data?.inventory?.summary || {};
  const moneyData = data?.money || {};
  const receivablesData = data?.receivables || {};
  const payablesData = data?.payables || {};
  const settlementsData = data?.settlements || {};
  const branchPerformance = data?.branches || [];
  const alertsList = data?.inventory?.alerts || {};
  const topProducts = data?.sales?.topProducts || {};
  const recentSalesList = data?.sales?.recent || {};
  const alertsSummary = data?.alerts || {};

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* 1. Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-(--card) border border-(--border) p-6 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-(--foreground)">Overview</h1>
          <p className="text-sm text-(--muted-foreground) mt-1">
            Monitor your business performance and activity.
          </p>
          {data?.period && (
            <p className="text-xs text-(--primary) mt-1 font-medium">
              Period: {data.period.type} ({dayjs(data.period.from).format("MMM D, YYYY HH:mm")} - {dayjs(data.period.to).format("MMM D, YYYY HH:mm")})
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Period Selector */}
          <select
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="px-3 py-2 bg-(--background) text-(--foreground) border border-(--border) rounded-xl text-sm font-medium focus:outline-none focus:border-(--primary)"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="three_months">Last 3 Months</option>
            <option value="year">This Year</option>
            <option value="all_time">All Time</option>
            <option value="custom">Custom Range</option>
          </select>

          {/* Branch Selector */}
          <select
            value={branchId}
            onChange={(e) => handleBranchChange(e.target.value)}
            className="px-3 py-2 bg-(--background) text-(--foreground) border border-(--border) rounded-xl text-sm font-medium focus:outline-none focus:border-(--primary)"
          >
            <option value="">All Branches</option>
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-(--muted) hover:bg-(--muted)/80 text-(--foreground) rounded-xl text-sm font-medium transition-colors border border-(--border) disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Custom Date Controls if custom period selected */}
      {period === "custom" && (
        <div className="flex flex-wrap items-center gap-4 bg-(--card) border border-(--border) p-4 rounded-xl shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-(--muted-foreground)">From:</span>
            <input
              type="date"
              value={from}
              onChange={(e) => updateQueryParams({ from: e.target.value })}
              className="px-3 py-1.5 bg-(--background) border border-(--border) rounded-lg text-sm text-(--foreground) focus:outline-none focus:border-(--primary)"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-(--muted-foreground)">To:</span>
            <input
              type="date"
              value={to}
              onChange={(e) => updateQueryParams({ to: e.target.value })}
              className="px-3 py-1.5 bg-(--background) border border-(--border) rounded-lg text-sm text-(--foreground) focus:outline-none focus:border-(--primary)"
            />
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl flex items-center justify-between">
          <span className="text-sm font-medium">{error}</span>
          <button onClick={loadOverview} className="px-3 py-1 bg-rose-500 text-white rounded-lg text-xs font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* 2. Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Revenue"
          value={`${Number(summary.revenue || 0).toLocaleString()} birr`}
          icon={DollarSign}
          isLoading={isLoading}
        />
        <KpiCard
          title="Sales Count"
          value={Number(summary.salesCount || 0).toLocaleString()}
          icon={ShoppingCart}
          isLoading={isLoading}
        />
        <KpiCard
          title="Units Sold"
          value={Number(summary.unitsSold || 0).toLocaleString()}
          icon={Package}
          isLoading={isLoading}
        />
        <KpiCard
          title="Estimated Profit"
          value={`${Number(summary.estimatedProfit || 0).toLocaleString()} birr`}
          subtitle="Estimated using current product cost prices"
          icon={TrendingUp}
          isLoading={isLoading}
          highlight
        />
        <KpiCard
          title="Estimated COGS"
          value={`${Number(summary.estimatedCogs || 0).toLocaleString()} birr`}
          icon={Layers}
          isLoading={isLoading}
        />
      </div>

      {/* 3. Sales Analytics & Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-(--card) border border-(--border) rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-(--foreground)">Sales Performance Trend</h2>
            <span className="text-xs text-(--muted-foreground)">Revenue & Units Trend</span>
          </div>
          <div className="h-64 flex items-center justify-center border border-dashed border-(--border) rounded-xl bg-(--muted)/10">
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-(--primary) border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className="text-center space-y-1">
                <TrendingUp className="w-8 h-8 text-(--muted-foreground) mx-auto opacity-40" />
                <p className="text-xs text-(--muted-foreground)">
                  Total Revenue: <span className="font-semibold text-(--foreground)">{Number(summary.revenue || 0).toLocaleString()} birr</span>
                </p>
                <p className="text-xs text-(--muted-foreground)">
                  Total Units Sold: <span className="font-semibold text-(--foreground)">{Number(summary.unitsSold || 0).toLocaleString()}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-(--card) border border-(--border) rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-(--foreground)">Payment-Status Breakdown</h2>
          <div className="space-y-3 pt-2">
            {salesData.byPaymentStatus?.length > 0 ? (
              salesData.byPaymentStatus.map((item, i) => (
                <PaymentStatusRow
                  key={i}
                  label={item.status || item.paymentStatus}
                  count={item.count}
                  amount={item.amount}
                  color={item.status === 'paid' ? 'bg-emerald-500' : item.status === 'partial' ? 'bg-amber-500' : 'bg-rose-500'}
                />
              ))
            ) : (
              <p className="text-xs text-(--muted-foreground) text-center py-4">No payment breakdown available</p>
            )}
          </div>
        </div>
      </div>

      {/* 4. Products Section (Top-selling products) */}
      <div className="bg-(--card) border border-(--border) rounded-2xl shadow-xs overflow-hidden">
        <div className="p-6 border-b border-(--border) flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-(--foreground)">Top-Selling Products</h2>
            <p className="text-xs text-(--muted-foreground)">Products ranked by sales volume and revenue</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-(--border) bg-(--muted)/30 text-xs font-medium text-(--muted-foreground)">
                <th className="py-3 px-6">Product Name</th>
                <th className="py-3 px-6 text-right">Units Sold</th>
                <th className="py-3 px-6 text-right">Revenue</th>
                <th className="py-3 px-6 text-right">Estimated Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--border) text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs text-(--muted-foreground)">
                    Loading top products...
                  </td>
                </tr>
              ) : (!topProducts.items || topProducts.items.length === 0) ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs text-(--muted-foreground)">
                    No top-selling products found for this period.
                  </td>
                </tr>
              ) : (
                topProducts.items.map((prod, idx) => (
                  <tr key={prod.id || idx} className="hover:bg-(--muted)/20 transition-colors">
                    <td className="py-3.5 px-6 font-medium text-xs text-(--foreground)">
                      {prod.name || prod.productName}
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono text-xs">
                      {Number(prod.unitsSold || prod.quantity || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono text-xs font-semibold text-(--primary)">
                      {Number(prod.revenue || 0).toLocaleString()} birr
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono text-xs text-emerald-600 dark:text-emerald-400">
                      {Number(prod.estimatedProfit || prod.profit || 0).toLocaleString()} birr
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
        <div className="bg-(--card) border border-(--border) rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-(--foreground)">Purchases Overview</h2>
          <p className="text-xs text-(--muted-foreground)">
            Inventory acquisition records (purchases do not automatically create money transactions).
          </p>
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-(--muted)/20 rounded-xl border border-(--border)">
              <span className="text-[11px] text-(--muted-foreground)">Count</span>
              <div className="text-lg font-bold font-mono text-(--foreground)">{Number(purchasesData.purchaseCount || 0).toLocaleString()}</div>
            </div>
            <div className="p-3 bg-(--muted)/20 rounded-xl border border-(--border)">
              <span className="text-[11px] text-(--muted-foreground)">Units</span>
              <div className="text-lg font-bold font-mono text-(--foreground)">{Number(purchasesData.unitsPurchased || 0).toLocaleString()}</div>
            </div>
            <div className="p-3 bg-(--muted)/20 rounded-xl border border-(--border)">
              <span className="text-[11px] text-(--muted-foreground)">Cost</span>
              <div className="text-sm font-bold font-mono text-(--primary) truncate">{Number(purchasesData.purchaseCost || 0).toLocaleString()} birr</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-(--card) border border-(--border) rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-(--foreground)">Purchase Trend</h2>
          <div className="h-32 flex items-center justify-center border border-dashed border-(--border) rounded-xl bg-(--muted)/10">
            <span className="text-xs text-(--muted-foreground)">
              {data?.purchases?.trend?.length ? `${data.purchases.trend.length} trend periods logged` : 'Purchase acquisition volume chart'}
            </span>
          </div>
        </div>
      </div>

      {/* 6. Inventory Section & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 bg-(--card) border border-(--border) rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-(--foreground)">Inventory Valuation</h2>
          <div className="space-y-3 pt-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-(--border)">
              <span className="text-(--muted-foreground)">Total Products</span>
              <span className="font-mono font-semibold">{Number(inventoryData.productCount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-(--border)">
              <span className="text-(--muted-foreground)">Total Units</span>
              <span className="font-mono font-semibold">{Number(inventoryData.totalUnits || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-(--border)">
              <span className="text-(--muted-foreground)">Cost Value</span>
              <span className="font-mono font-semibold text-(--primary)">{Number(inventoryData.inventoryCostValue || 0).toLocaleString()} birr</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-(--border)">
              <span className="text-(--muted-foreground)">Retail Value</span>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{Number(inventoryData.inventoryRetailValue || 0).toLocaleString()} birr</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-(--border)">
              <span className="text-rose-500">Out of Stock</span>
              <span className="font-mono font-semibold text-rose-500">{Number(inventoryData.outOfStockCount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-amber-500">Low Stock</span>
              <span className="font-mono font-semibold text-amber-500">{Number(inventoryData.lowStockCount || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-(--card) border border-(--border) rounded-2xl shadow-xs overflow-hidden flex flex-col">
          <div className="p-6 border-b border-(--border)">
            <h2 className="text-base font-bold text-(--foreground)">Inventory Alerts</h2>
            <p className="text-xs text-(--muted-foreground)">Prioritizing out-of-stock and low-stock products</p>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-(--border) bg-(--muted)/30 text-xs font-medium text-(--muted-foreground)">
                  <th className="py-3 px-6">Product Name</th>
                  <th className="py-3 px-6">Branch ID</th>
                  <th className="py-3 px-6 text-center">Current Stock</th>
                  <th className="py-3 px-6 text-center">Threshold</th>
                  <th className="py-3 px-6">Alert Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border) text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-(--muted-foreground)">
                      Loading alerts...
                    </td>
                  </tr>
                ) : (!alertsList.items || alertsList.items.length === 0) ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-(--muted-foreground)">
                      No inventory alerts at this time.
                    </td>
                  </tr>
                ) : (
                  alertsList.items.map((alert, idx) => (
                    <tr key={alert.id || idx} className="hover:bg-(--muted)/20 transition-colors">
                      <td className="py-3.5 px-6 font-medium text-xs text-(--foreground)">
                        {alert.name}
                      </td>
                      <td className="py-3.5 px-6 text-xs text-(--muted-foreground) font-mono">
                        {alert.branchId || "—"}
                      </td>
                      <td className="py-3.5 px-6 text-center font-mono text-xs font-bold">
                        {alert.stock ?? 0}
                      </td>
                      <td className="py-3.5 px-6 text-center font-mono text-xs text-(--muted-foreground)">
                        {alert.lowStockThreshold ?? 5}
                      </td>
                      <td className="py-3.5 px-6 text-xs">
                        {alert.alertType === "out_of_stock" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20">
                            <ShieldAlert className="w-3 h-3" /> Out of Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
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
      <div className="bg-(--card) border border-(--border) rounded-2xl shadow-xs overflow-hidden">
        <div className="p-6 border-b border-(--border) flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-(--foreground)">Recent Sales</h2>
            <p className="text-xs text-(--muted-foreground)">Latest recorded transactions across branches</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-(--border) bg-(--muted)/30 text-xs font-medium text-(--muted-foreground)">
                <th className="py-3 px-6">Customer</th>
                <th className="py-3 px-6">Branch</th>
                <th className="py-3 px-6 text-right">Total Amount</th>
                <th className="py-3 px-6">Payment Status</th>
                <th className="py-3 px-6">Created By</th>
                <th className="py-3 px-6">Date (Relative)</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--border) text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-(--muted-foreground)">
                    Loading recent sales...
                  </td>
                </tr>
              ) : (!recentSalesList.items || recentSalesList.items.length === 0) ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-(--muted-foreground)">
                    No recent sales records found.
                  </td>
                </tr>
              ) : (
                recentSalesList.items.map((sale) => {
                  const id = sale.id;
                  const customer = sale.customerName || "Walk-in";
                  const branchName = sale.branchName || "—";
                  const total = Number(sale.totalAmount || 0);
                  const status = sale.paymentStatus || "paid";
                  const createdBy = sale.createdByName || "—";
                  const dateStr = sale.createdAt;

                  return (
                    <tr key={id} className="hover:bg-(--muted)/20 transition-colors">
                      <td className="py-3.5 px-6 font-medium text-xs text-(--foreground)">
                        {customer}
                      </td>
                      <td className="py-3.5 px-6 text-xs text-(--muted-foreground)">
                        {branchName}
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono text-xs font-semibold">
                        {total.toLocaleString()} birr
                      </td>
                      <td className="py-3.5 px-6 text-xs">
                        <StatusBadge status={status} />
                      </td>
                      <td className="py-3.5 px-6 text-xs text-(--muted-foreground)">
                        {createdBy}
                      </td>
                      <td className="py-3.5 px-6 text-xs text-(--muted-foreground)" title={dateStr ? dayjs(dateStr).format("YYYY-MM-DD HH:mm:ss") : ""}>
                        {dateStr ? dayjs(dateStr).fromNow() : "—"}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <Link
                          href={`/dashboard/sales/${id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-(--muted) hover:bg-(--muted)/80 text-(--foreground) rounded-lg text-xs font-medium transition-colors"
                        >
                          <span>View</span>
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
      <div className="bg-(--card) border border-(--border) rounded-2xl p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-(--foreground)">Account-wide money flow</h2>
          <p className="text-xs text-(--muted-foreground)">
            Note: Money transactions are account-scope and exclude internal money transfers.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-1">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Money In</span>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {Number(moneyData.moneyIn || 0).toLocaleString()} birr
            </div>
          </div>
          <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl space-y-1">
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400">Money Out</span>
            <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
              {Number(moneyData.moneyOut || 0).toLocaleString()} birr
            </div>
          </div>
          <div className="p-4 bg-(--muted)/20 border border-(--border) rounded-xl space-y-1">
            <span className="text-xs font-medium text-(--muted-foreground)">Net Money Flow</span>
            <div className="text-xl font-bold font-mono text-(--foreground)">
              {Number(moneyData.netMoneyFlow || 0).toLocaleString()} birr
            </div>
          </div>
        </div>
      </div>

      {/* 9. Receivables and Payables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-(--card) border border-(--border) rounded-2xl p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-(--foreground)">Money owed to the business</h2>
            <p className="text-xs text-(--muted-foreground)">Account-level receivables tracking</p>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-(--muted)/25 rounded-xl border border-(--border)">
              <span className="text-[11px] text-(--muted-foreground)">Open Count</span>
              <div className="text-lg font-bold font-mono text-(--foreground)">{Number(receivablesData.openCount || 0).toLocaleString()}</div>
            </div>
            <div className="p-3 bg-(--muted)/25 rounded-xl border border-(--border)">
              <span className="text-[11px] text-(--muted-foreground)">Outstanding</span>
              <div className="text-sm font-bold font-mono text-(--primary) truncate">{Number(receivablesData.outstandingAmount || 0).toLocaleString()} birr</div>
            </div>
            <div className="p-3 bg-(--muted)/25 rounded-xl border border-(--border)">
              <span className="text-[11px] text-(--muted-foreground)">Overdue</span>
              <div className="text-lg font-bold font-mono text-rose-500">{Number(receivablesData.overdueCount || 0).toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="bg-(--card) border border-(--border) rounded-2xl p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-(--foreground)">Money the business owes</h2>
            <p className="text-xs text-(--muted-foreground)">Account-level payables tracking</p>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-(--muted)/25 rounded-xl border border-(--border)">
              <span className="text-[11px] text-(--muted-foreground)">Open Count</span>
              <div className="text-lg font-bold font-mono text-(--foreground)">{Number(payablesData.openCount || 0).toLocaleString()}</div>
            </div>
            <div className="p-3 bg-(--muted)/25 rounded-xl border border-(--border)">
              <span className="text-[11px] text-(--muted-foreground)">Outstanding</span>
              <div className="text-sm font-bold font-mono text-(--primary) truncate">{Number(payablesData.outstandingAmount || 0).toLocaleString()} birr</div>
            </div>
            <div className="p-3 bg-(--muted)/25 rounded-xl border border-(--border)">
              <span className="text-[11px] text-(--muted-foreground)">Overdue</span>
              <div className="text-lg font-bold font-mono text-rose-500">{Number(payablesData.overdueCount || 0).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 10. Settlement Section */}
      <div className="bg-(--card) border border-(--border) rounded-2xl p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-(--foreground)">Settlements</h2>
          <p className="text-xs text-(--muted-foreground)">Branch-aware settlement activity</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
          <div className="p-4 bg-(--muted)/20 border border-(--border) rounded-xl space-y-1">
            <span className="text-xs font-medium text-(--muted-foreground)">Pending Settlements</span>
            <div className="text-xl font-bold font-mono text-amber-500">{Number(settlementsData.pendingCount || 0).toLocaleString()}</div>
          </div>
          <div className="p-4 bg-(--muted)/20 border border-(--border) rounded-xl space-y-1">
            <span className="text-xs font-medium text-(--muted-foreground)">Requested Settlements</span>
            <div className="text-xl font-bold font-mono text-(--foreground)">{Number(settlementsData.requestedCount || 0).toLocaleString()}</div>
          </div>
          <div className="p-4 bg-(--muted)/20 border border-(--border) rounded-xl space-y-1">
            <span className="text-xs font-medium text-(--muted-foreground)">Received Settlements</span>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{Number(settlementsData.receivedCount || 0).toLocaleString()}</div>
          </div>
          <div className="p-4 bg-(--muted)/20 border border-(--border) rounded-xl space-y-1">
            <span className="text-xs font-medium text-(--muted-foreground)">Pending Amount</span>
            <div className="text-xl font-bold font-mono text-(--primary)">{Number(settlementsData.pendingAmount || 0).toLocaleString()} birr</div>
          </div>
        </div>
      </div>

      {/* 11. Branch Performance (Only shown when no specific branch is selected) */}
      {!branchId && (
        <div className="bg-(--card) border border-(--border) rounded-2xl shadow-xs overflow-hidden">
          <div className="p-6 border-b border-(--border)">
            <h2 className="text-base font-bold text-(--foreground)">Branch Performance</h2>
            <p className="text-xs text-(--muted-foreground)">Comparative performance metrics across all active branches</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-(--border) bg-(--muted)/30 text-xs font-medium text-(--muted-foreground)">
                  <th className="py-3 px-6">Branch Name</th>
                  <th className="py-3 px-6 text-center">Sales Count</th>
                  <th className="py-3 px-6 text-right">Revenue</th>
                  <th className="py-3 px-6 text-right">Units Sold</th>
                  <th className="py-3 px-6 text-right">Estimated COGS</th>
                  <th className="py-3 px-6 text-right">Estimated Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border) text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-(--muted-foreground)">
                      Loading branch performance...
                    </td>
                  </tr>
                ) : (!branchPerformance || branchPerformance.length === 0) ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-(--muted-foreground)">
                      No branch performance data available.
                    </td>
                  </tr>
                ) : (
                  branchPerformance.map((branch, idx) => (
                    <tr key={branch.branchId || idx} className="hover:bg-(--muted)/20 transition-colors">
                      <td className="py-3.5 px-6 font-medium text-xs text-(--foreground)">
                        {branch.branchName}
                      </td>
                      <td className="py-3.5 px-6 text-center font-mono text-xs">
                        {Number(branch.salesCount || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono text-xs font-semibold text-(--primary)">
                        {Number(branch.revenue || 0).toLocaleString()} birr
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono text-xs">
                        {Number(branch.unitsSold || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono text-xs text-(--muted-foreground)">
                        {Number(branch.estimatedCogs || 0).toLocaleString()} birr
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {Number(branch.estimatedProfit || 0).toLocaleString()} birr
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

// Reusable Components
function KpiCard({ title, value, subtitle, icon: Icon, isLoading, highlight }) {
  return (
    <div className={`bg-(--card) border border-(--border) rounded-2xl p-5 shadow-xs space-y-2 ${highlight ? "ring-1 ring-(--primary)/50" : ""}`}>
      <div className="flex items-center justify-between text-(--muted-foreground)">
        <span className="text-xs font-medium">{title}</span>
        {Icon && <Icon className="w-4 h-4 opacity-70" />}
      </div>
      <div>
        {isLoading ? (
          <div className="h-7 w-24 bg-(--muted)/30 rounded animate-pulse my-1" />
        ) : (
          <div className={`text-xl font-bold font-mono tracking-tight ${highlight ? "text-(--primary)" : "text-(--foreground)"}`}>
            {value}
          </div>
        )}
        {subtitle && <p className="text-[10px] text-(--muted-foreground) mt-0.5 leading-tight">{subtitle}</p>}
      </div>
    </div>
  );
}

function PaymentStatusRow({ label, count, amount, color }) {
  return (
    <div className="flex items-center justify-between p-3 bg-(--muted)/10 border border-(--border) rounded-xl">
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
        <span className="text-xs font-medium text-(--foreground) capitalize">{label}</span>
      </div>
      <div className="text-right font-mono">
        <div className="text-xs font-bold text-(--foreground)">{Number(amount || 0).toLocaleString()} birr</div>
        <div className="text-[10px] text-(--muted-foreground)">{Number(count || 0)} transactions</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  switch (status) {
    case "paid":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" /> Paid
        </span>
      );
    case "partial":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <Clock className="w-3 h-3" /> Partial
        </span>
      );
    case "credit":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20">
          <AlertTriangle className="w-3 h-3" /> Credit
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-(--muted) text-(--muted-foreground)">
          {status}
        </span>
      );
  }
}


export default function OfflixManagerDashboard() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-6">
          <div className="h-8 w-48 bg-(--muted)/30 rounded animate-pulse" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}