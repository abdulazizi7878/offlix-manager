"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  LayoutDashboard,
  GitBranch,
  Package,
  ShoppingCart,
  Receipt,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  User,
  Search,
  Calculator,
  Wrench,
  ShieldCheck,
} from "lucide-react";

import { ThemeSwitcher } from "@/components/layout/ThemeSwitcher";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import { fetchApi } from "@/lib/api/client";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("dashboard");

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [shouldFocusSearch, setShouldFocusSearch] = useState(false);

  // Group dropdown states
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isBranchesOpen, setIsBranchesOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isSalesOpen, setIsSalesOpen] = useState(false);
  const [isMoneyOpen, setIsMoneyOpen] = useState(false);
  const [isUsersOpen, setIsUsersOpen] = useState(false);

  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);

  // Sidebar resizing state
  const [sidebarWidth, setSidebarWidth] = useState(288);
  const isResizingRef = useRef(false);

  // Base prefix detection (handles /dashboard or /dashboar cleanly)
  const basePath = pathname.startsWith("/dashboard") ? "/dashboard" : "/dashboard";
  const paymentVerificationPath = `${basePath}/tools/payment-verification`;

  useEffect(() => {
    if (pathname.includes("/tools")) setIsToolsOpen(true);
    if (pathname.includes("/branches")) setIsBranchesOpen(true);
    if (pathname.includes("/products")) setIsProductsOpen(true);
    if (pathname.includes("/sales")) setIsSalesOpen(true);
    if (pathname.includes("/money")) setIsMoneyOpen(true);
    if (pathname.includes("/users")) setIsUsersOpen(true);

    setIsSidebarOpen(false);
    setSearchQuery("");
  }, [pathname]);

  // Focus search input on open only if triggered from search button
  useEffect(() => {
    if (isSidebarOpen && shouldFocusSearch) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isSidebarOpen, shouldFocusSearch]);

  useEffect(() => {
    let isMounted = true;
    async function loadUser() {
      try {
        const response = await fetchApi("/api/v1/auth/me");
        if (!isMounted) return;
        if (response?.success === false && response?.error?.code === "UNAUTHORIZED") {
          router.replace("/login?reason=session-expired");
          return;
        }
        const currentUser = response?.data?.user || response?.data;
        if (!currentUser) {
          router.replace("/login?reason=session-expired");
          return;
        }
        setUser(currentUser);
      } catch (error) {
        if (!isMounted) return;
        if (error?.code === "UNAUTHORIZED") {
          router.replace("/login?reason=session-expired");
          return;
        }
        console.error("Failed to verify authentication:", error);
      } finally {
        if (isMounted) setAuthChecking(false);
      }
    }
    loadUser();
    return () => { isMounted = false; };
  }, [router]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizingRef.current) return;
      const newWidth = e.clientX;
      if (newWidth >= 220 && newWidth <= 450) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.userSelect = "";
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const startResizing = (e) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.userSelect = "none";
  };

  const isExactActive = (path) => pathname === path;
  const isSubActive = (prefix) => pathname.startsWith(prefix);

  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);

    return segments.map((segment, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/");

      let translatedLabel = segment.charAt(0).toUpperCase() + segment.slice(1);
      if (segment === "payment-verification") {
        translatedLabel = "Payment Verification";
      } else if (t.has(`nav.${segment}`)) {
        translatedLabel = t(`nav.${segment}`);
      }

      return {
        href,
        label: translatedLabel,
      };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  const navigationItems = [
    { label: t("nav.dashboard"), href: `${basePath}`, icon: LayoutDashboard },
    { label: "Smart Calculator", href: `${basePath}/calculator`, icon: Calculator },
    { label: "Tools - Payment Verification", href: paymentVerificationPath, icon: ShieldCheck },
    { label: t("nav.branches"), href: `${basePath}/branches`, icon: GitBranch },
    { label: `${t("nav.branches")} - ${t("nav.create")}`, href: `${basePath}/branches/create`, icon: GitBranch },
    { label: t("nav.products"), href: `${basePath}/products`, icon: Package },
    { label: `${t("nav.products")} - ${t("nav.create")}`, href: `${basePath}/products/create`, icon: Package },
    { label: `${t("nav.products")} - ${t("nav.purchases")}`, href: `${basePath}/products/purchases`, icon: Package },
    { label: t("nav.sales"), href: `${basePath}/sales`, icon: ShoppingCart },
    { label: `${t("nav.sales")} - ${t("nav.create")}`, href: `${basePath}/sales/create`, icon: ShoppingCart },
    { label: t("nav.money"), href: `${basePath}/money`, icon: Receipt },
    { label: `${t("nav.money")} - ${t("nav.accounts")}`, href: `${basePath}/money/accounts`, icon: Receipt },
    { label: `${t("nav.money")} - ${t("nav.transactions")}`, href: `${basePath}/money/transactions`, icon: Receipt },
    { label: `${t("nav.money")} - ${t("nav.transfers")}`, href: `${basePath}/money/transfers`, icon: Receipt },
    { label: `${t("nav.money")} - ${t("nav.settlements")}`, href: `${basePath}/money/settlements`, icon: Receipt },
    { label: `${t("nav.money")} - ${t("nav.payables")}`, href: `${basePath}/money/payables`, icon: Receipt },
    { label: `${t("nav.money")} - ${t("nav.receivables")}`, href: `${basePath}/money/receivables`, icon: Receipt },
    { label: `${t("nav.money")} - ${t("nav.credit")}`, href: `${basePath}/money/credits`, icon: Receipt },
    { label: `${t("nav.money")} - ${t("nav.totalMoney")}`, href: `${basePath}/money/total-money`, icon: Receipt },
    { label: t("nav.users"), href: `${basePath}/users`, icon: Users },
    { label: `${t("nav.users")} - ${t("nav.create")}`, href: `${basePath}/users/create`, icon: Users },
    { label: t("nav.reports"), href: `${basePath}/reports`, icon: BarChart3 },
    { label: t("nav.settings"), href: `${basePath}/settings`, icon: Settings },
  ];

  const filteredNavItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return navigationItems;
    return navigationItems.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        item.href.toLowerCase().includes(query)
    );
  }, [searchQuery, navigationItems]);

  const handleNavigateToRoute = (href) => {
    router.push(href);
    setSearchQuery("");
    setIsSidebarOpen(false);
  };

  const handleOpenSearch = () => {
    setShouldFocusSearch(true);
    setIsSidebarOpen(true);
  };

  const handleOpenMenu = () => {
    setShouldFocusSearch(false);
    setIsSidebarOpen(true);
  };

  const isCalculator = pathname.includes("/calculator");
  const isPaymentVerification = pathname.includes("/payment-verification");

  if (authChecking) {
    return (
      <div className="h-screen bg-(--background) text-(--foreground) flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-(--border) border-t-(--primary) rounded-full animate-spin mx-auto" />
          <p className="text-sm text-(--muted-foreground)">{t("checkingSession")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-(--background) text-(--foreground) flex overflow-hidden antialiased selection:bg-(--primary) selection:text-(--primary-foreground) relative">
      {/* Mobile-Only Floating Switchers */}
      <div className="md:hidden fixed top-4 right-4 z-50 flex items-center gap-2 bg-(--card)/90 backdrop-blur-md border border-(--border) shadow-lg rounded-full p-1.5 px-3">
        <LanguageSwitcher />
        <div className="w-[1px] h-4 bg-(--border)" />
        <ThemeSwitcher />
      </div>

      {/* Desktop Sidebar */}
      <aside
        style={{ width: `${sidebarWidth}px` }}
        className="hidden md:flex fixed inset-y-0 left-0 z-50 bg-(--card) border-r border-(--border) flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0 shrink-0"
      >
        <div className="h-16 px-6 border-b border-(--border) flex items-center justify-between shrink-0">
          <Link href={basePath} className="flex items-center gap-2.5 rounded-lg p-1 -ml-1">
            <div className="bg-(--primary) text-(--primary-foreground) rounded-lg shadow-xs overflow-hidden">
              <Image src="/images/logo.png" width={36} height={36} alt={`${t("brandName")} Logo`} className="rounded-md object-cover" />
            </div>
            <span className="font-bold text-md tracking-tight">{t("brandName")}</span>
          </Link>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 text-sm font-medium [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <Link
            href={basePath}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors outline-none border-0 ${isExactActive(basePath) ? "bg-(--primary) text-(--primary-foreground)" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)"
              }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>{t("nav.dashboard")}</span>
          </Link>

          {/* Smart Calculator */}
          <Link href={`${basePath}/calculator`} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors outline-none border-0 ${isExactActive(`${basePath}/calculator`) ? "bg-(--primary) text-(--primary-foreground)" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)"}`}>
            <Calculator className="w-4 h-4" />
            <span>Smart Calculator</span>
          </Link>

          {/* Tools Group (Collapsible) */}
          <div className="space-y-1">
            <button
              onClick={() => setIsToolsOpen(!isToolsOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors outline-none border-0 ${isSubActive(`${basePath}/tools`) ? "bg-(--primary) text-(--primary-foreground)" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)"
                }`}
            >
              <div className="flex items-center gap-3">
                <Wrench className="w-4 h-4" />
                <span>Tools</span>
              </div>
              {isToolsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {isToolsOpen && (
              <div className="pl-9 space-y-1 py-1">
                {/* 1st Member: Payment Verification */}
                <Link
                  href={paymentVerificationPath}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive(paymentVerificationPath) ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Payment Verification</span>
                </Link>
              </div>
            )}
          </div>

          {/* Branches */}
          <div className="space-y-1">
            <button
              onClick={() => setIsBranchesOpen(!isBranchesOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors outline-none border-0 ${isSubActive(`${basePath}/branches`) ? "bg-(--primary) text-(--primary-foreground)" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)"
                }`}
            >
              <div className="flex items-center gap-3">
                <GitBranch className="w-4 h-4" />
                <span>{t("nav.branches")}</span>
              </div>
              {isBranchesOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {isBranchesOpen && (
              <div className="pl-9 space-y-1 py-1">
                <Link href={`${basePath}/branches`} className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive(`${basePath}/branches`) ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.overview")}</Link>
                <Link href={`${basePath}/branches/create`} className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive(`${basePath}/branches/create`) ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.create")}</Link>
              </div>
            )}
          </div>

          {/* Products */}
          <div className="space-y-1">
            <button
              onClick={() => setIsProductsOpen(!isProductsOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors outline-none border-0 ${isSubActive(`${basePath}/products`) ? "bg-(--primary) text-(--primary-foreground)" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)"
                }`}
            >
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4" />
                <span>{t("nav.products")}</span>
              </div>
              {isProductsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {isProductsOpen && (
              <div className="pl-9 space-y-1 py-1">
                <Link href={`${basePath}/products`} className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive(`${basePath}/products`) ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.overview")}</Link>
                <Link href={`${basePath}/products/create`} className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive(`${basePath}/products/create`) ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.create")}</Link>
                <Link href={`${basePath}/products/purchases`} className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive(`${basePath}/products/purchases`) ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.purchases")}</Link>
              </div>
            )}
          </div>

          {/* Sales */}
          <div className="space-y-1">
            <button
              onClick={() => setIsSalesOpen(!isSalesOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors outline-none border-0 ${isSubActive(`${basePath}/sales`) ? "bg-(--primary) text-(--primary-foreground)" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)"
                }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-4 h-4" />
                <span>{t("nav.sales")}</span>
              </div>
              {isSalesOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {isSalesOpen && (
              <div className="pl-9 space-y-1 py-1">
                <Link href={`${basePath}/sales`} className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive(`${basePath}/sales`) ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.overview")}</Link>
                <Link href={`${basePath}/sales/create`} className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive(`${basePath}/sales/create`) ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.create")}</Link>
              </div>
            )}
          </div>

          {/* Money */}
          <div className="space-y-1">
            <button
              onClick={() => setIsMoneyOpen(!isMoneyOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors outline-none border-0 ${isSubActive(`${basePath}/money`) ? "bg-(--primary) text-(--primary-foreground)" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)"
                }`}
            >
              <div className="flex items-center gap-3">
                <Receipt className="w-4 h-4" />
                <span>{t("nav.money")}</span>
              </div>
              {isMoneyOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {isMoneyOpen && (
              <div className="pl-9 space-y-1 py-1">
                <Link href={`${basePath}/money`} className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive(`${basePath}/money`) ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.overview")}</Link>
                <Link href={`${basePath}/money/accounts`} className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive(`${basePath}/money/accounts`) ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.accounts")}</Link>
                <Link href={`${basePath}/money/transactions`} className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive(`${basePath}/money/transactions`) ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.transactions")}</Link>
                <Link href={`${basePath}/money/transfers`} className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive(`${basePath}/money/transfers`) ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.transfers")}</Link>
                <Link href={`${basePath}/money/settlements`} className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive(`${basePath}/money/settlements`) ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.settlements")}</Link>
                <Link href={`${basePath}/money/payables`} className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive(`${basePath}/money/payables`) ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.payables")}</Link>
                <Link href={`${basePath}/money/receivables`} className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive(`${basePath}/money/receivables`) ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.receivables")}</Link>
                <Link href={`${basePath}/money/credits`} className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive(`${basePath}/money/credits`) ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.credit")}</Link>
                <Link href={`${basePath}/money/total-money`} className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive(`${basePath}/money/total-money`) ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.totalMoney")}</Link>
              </div>
            )}
          </div>

          {/* Users */}
          <div className="space-y-1">
            <button
              onClick={() => setIsUsersOpen(!isUsersOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors outline-none border-0 ${isSubActive(`${basePath}/users`) ? "bg-(--primary) text-(--primary-foreground)" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)"
                }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                <span>{t("nav.users")}</span>
              </div>
              {isUsersOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {isUsersOpen && (
              <div className="pl-9 space-y-1 py-1">
                <Link href={`${basePath}/users`} className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive(`${basePath}/users`) ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.overview")}</Link>
                <Link href={`${basePath}/users/create`} className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive(`${basePath}/users/create`) ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.create")}</Link>
              </div>
            )}
          </div>

          <Link href={`${basePath}/reports`} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors outline-none border-0 ${isExactActive(`${basePath}/reports`) ? "bg-(--primary) text-(--primary-foreground)" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)"}`}>
            <BarChart3 className="w-4 h-4" />
            <span>{t("nav.reports")}</span>
          </Link>

          <Link href={`${basePath}/settings`} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors outline-none border-0 ${isSubActive(`${basePath}/settings`) ? "bg-(--primary) text-(--primary-foreground)" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)"}`}>
            <Settings className="w-4 h-4" />
            <span>{t("nav.settings")}</span>
          </Link>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-(--border) shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-(--muted) text-(--foreground) flex items-center justify-center font-semibold text-sm shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || t("manager")}</p>
              <p className="text-xs text-(--muted-foreground) truncate">{user?.email || t("managerAccount")}</p>
            </div>
          </div>
        </div>

        {/* Resizer */}
        <div onMouseDown={startResizing} className="hidden md:flex absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-(--primary)/50 transition-colors items-center justify-center group" title="Drag to resize sidebar">
          <div className="w-0.5 h-8 bg-(--border) group-hover:bg-(--primary) rounded-full" />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        {/* Desktop Header */}
        <header className="hidden md:flex h-16 px-6 bg-(--card) border-b border-(--border) items-center justify-between shrink-0 z-30 sticky top-0">
          <div className="flex items-center gap-4">
            <nav className="flex items-center space-x-2 text-sm font-medium">
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;

                return (
                  <div key={crumb.href} className="flex items-center space-x-2">
                    {index > 0 && (
                      <ChevronRight className="w-4 h-4 text-(--muted-foreground)" />
                    )}

                    {isLast ? (
                      <span className="text-(--foreground) font-semibold">
                        {crumb.label}
                      </span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className="text-(--muted-foreground) hover:text-(--foreground) transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Desktop Integrated Switchers */}
          <div className="flex items-center gap-2 bg-(--muted)/50 border border-(--border) rounded-full p-1 px-3">
            <LanguageSwitcher />
            <div className="w-[1px] h-4 bg-(--border)" />
            <ThemeSwitcher />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8 pb-28 md:pb-8 pt-20 md:pt-8 w-full [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>

        {/* Mobile Floating Bottom Navigation (Search, Menu, Payment Verification, Smart Calculator) */}
        <div className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-40">
          <div className="flex items-center gap-1.5 bg-(--card)/90 backdrop-blur-md border border-(--border) shadow-2xl rounded-full p-1.5 px-2.5 text-(--foreground)">
            {/* 1. Search */}
            <button
              type="button"
              onClick={handleOpenSearch}
              className="p-2.5 rounded-full hover:bg-(--muted) text-(--foreground) transition-colors cursor-pointer"
              aria-label="Open Search"
            >
              <Search className="w-5 h-5" />
            </button>

            <div className="w-[1px] h-5 bg-(--border)" />

            {/* 2. Menu Button (Center) */}
            <button
              type="button"
              onClick={handleOpenMenu}
              className={`flex items-center gap-1.5 py-2 px-3.5 rounded-full font-semibold text-xs transition-colors cursor-pointer shadow-sm ${isCalculator || isPaymentVerification
                  ? "bg-(--muted) text-(--foreground) hover:bg-(--muted)/80"
                  : "bg-(--primary) text-(--primary-foreground)"
                }`}
              aria-label="Open Mobile Menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-5 bg-(--border)" />

            {/* 3. Payment Verification Quick Action */}
            <Link
              href={paymentVerificationPath}
              className={`p-2.5 rounded-full transition-colors cursor-pointer flex items-center justify-center ${isPaymentVerification
                  ? "bg-(--primary) text-(--primary-foreground)"
                  : "hover:bg-(--muted) text-(--foreground)"
                }`}
              aria-label="Payment Verification"
              title="Payment Verification"
            >
              <ShieldCheck className="w-5 h-5" />
            </Link>

            <div className="w-[1px] h-5 bg-(--border)" />

            {/* 4. Smart Calculator */}
            <Link
              href={`${basePath}/calculator`}
              className={`p-2.5 rounded-full transition-colors cursor-pointer flex items-center justify-center ${isCalculator
                  ? "bg-(--primary) text-(--primary-foreground)"
                  : "hover:bg-(--muted) text-(--foreground)"
                }`}
              aria-label="Smart Calculator"
              title="Smart Calculator"
            >
              <Calculator className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Mobile Full-Screen Overlay for Menu & Search */}
        {isSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-(--background) flex flex-col p-6 overflow-hidden animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-(--border) shrink-0 pr-28">
              <div className="flex items-center gap-3">
                <div className="bg-(--primary) text-(--primary-foreground) rounded-lg shadow-xs overflow-hidden shrink-0">
                  <Image src="/images/logo.png" width={36} height={36} alt={`${t("brandName")} Logo`} className="rounded-md object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-base tracking-tight">{t("brandName")}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-(--primary)">
                    {user?.name || t("manager")}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsSidebarOpen(false);
                  setSearchQuery("");
                }}
                className="p-2 rounded-full border border-(--border) hover:bg-(--muted) text-(--foreground) transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Mobile Search Bar */}
            <div className="pt-4 pb-2 shrink-0">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-3.5 text-(--muted-foreground) pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={t("nav.overview")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 text-sm bg-(--card) border border-(--border) rounded-xl text-(--foreground) placeholder-(--muted-foreground) focus:outline-none focus:ring-1 focus:ring-(--primary) transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 text-(--muted-foreground) hover:text-(--foreground) cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Navigation & Results */}
            <nav className="flex-1 overflow-y-auto py-4 space-y-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {searchQuery.trim() !== "" ? (
                filteredNavItems.length > 0 ? (
                  filteredNavItems.map((item) => {
                    const active = isExactActive(item.href);
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => handleNavigateToRoute(item.href)}
                        className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-base font-medium transition-colors outline-none cursor-pointer text-left ${active ? "bg-(--primary) text-(--primary-foreground) font-semibold shadow-xs" : "text-(--foreground) hover:bg-(--muted)/60"
                          }`}
                      >
                        <Icon className={`w-5 h-5 shrink-0 ${active ? "text-(--primary-foreground)" : "text-current"}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-sm text-(--muted-foreground)">No pages found</div>
                )
              ) : (
                <>
                  <Link href={basePath} onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${isExactActive(basePath) ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--foreground) hover:bg-(--muted)"}`}>
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="text-base">{t("nav.dashboard")}</span>
                  </Link>

                  {/* Smart Calculator */}
                  <Link
                    href={`${basePath}/calculator`}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${isExactActive(`${basePath}/calculator`)
                      ? "bg-(--primary) text-(--primary-foreground) font-semibold"
                      : "text-(--foreground) hover:bg-(--muted)"
                      }`}
                  >
                    <Calculator className="w-5 h-5" />
                    <span className="text-base">Smart Calculator</span>
                  </Link>

                  {/* Tools Mobile Group */}
                  <div className="space-y-1">
                    <button onClick={() => setIsToolsOpen(!isToolsOpen)} className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-base text-(--foreground) hover:bg-(--muted)">
                      <div className="flex items-center gap-3">
                        <Wrench className="w-5 h-5" />
                        <span>Tools</span>
                      </div>
                      {isToolsOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    {isToolsOpen && (
                      <div className="pl-9 space-y-1 py-1">
                        <Link
                          href={paymentVerificationPath}
                          onClick={() => setIsSidebarOpen(false)}
                          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg ${isExactActive(paymentVerificationPath) ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground)"}`}
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Payment Verification</span>
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Branches */}
                  <div className="space-y-1">
                    <button onClick={() => setIsBranchesOpen(!isBranchesOpen)} className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-base text-(--foreground) hover:bg-(--muted)">
                      <div className="flex items-center gap-3">
                        <GitBranch className="w-5 h-5" />
                        <span>{t("nav.branches")}</span>
                      </div>
                      {isBranchesOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    {isBranchesOpen && (
                      <div className="pl-9 space-y-1 py-1">
                        <Link href={`${basePath}/branches`} onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.overview")}</Link>
                        <Link href={`${basePath}/branches/create`} onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.create")}</Link>
                      </div>
                    )}
                  </div>

                  {/* Products */}
                  <div className="space-y-1">
                    <button onClick={() => setIsProductsOpen(!isProductsOpen)} className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-base text-(--foreground) hover:bg-(--muted)">
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5" />
                        <span>{t("nav.products")}</span>
                      </div>
                      {isProductsOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    {isProductsOpen && (
                      <div className="pl-9 space-y-1 py-1">
                        <Link href={`${basePath}/products`} onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.overview")}</Link>
                        <Link href={`${basePath}/products/create`} onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.create")}</Link>
                        <Link href={`${basePath}/products/purchases`} onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.purchases")}</Link>
                      </div>
                    )}
                  </div>

                  {/* Sales */}
                  <div className="space-y-1">
                    <button onClick={() => setIsSalesOpen(!isSalesOpen)} className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-base text-(--foreground) hover:bg-(--muted)">
                      <div className="flex items-center gap-3">
                        <ShoppingCart className="w-5 h-5" />
                        <span>{t("nav.sales")}</span>
                      </div>
                      {isSalesOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    {isSalesOpen && (
                      <div className="pl-9 space-y-1 py-1">
                        <Link href={`${basePath}/sales`} onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.overview")}</Link>
                        <Link href={`${basePath}/sales/create`} onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.create")}</Link>
                      </div>
                    )}
                  </div>

                  {/* Money */}
                  <div className="space-y-1">
                    <button onClick={() => setIsMoneyOpen(!isMoneyOpen)} className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-base text-(--foreground) hover:bg-(--muted)">
                      <div className="flex items-center gap-3">
                        <Receipt className="w-5 h-5" />
                        <span>{t("nav.money")}</span>
                      </div>
                      {isMoneyOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    {isMoneyOpen && (
                      <div className="pl-9 space-y-1 py-1">
                        <Link href={`${basePath}/money`} onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.overview")}</Link>
                        <Link href={`${basePath}/money/accounts`} onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.accounts")}</Link>
                        <Link href={`${basePath}/money/transactions`} onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.transactions")}</Link>
                        <Link href={`${basePath}/money/transfers`} onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.transfers")}</Link>
                        <Link href={`${basePath}/money/settlements`} onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.settlements")}</Link>
                        <Link href={`${basePath}/money/payables`} onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.payables")}</Link>
                        <Link href={`${basePath}/money/receivables`} onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.receivables")}</Link>
                        <Link href={`${basePath}/money/credits`} onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.credit")}</Link>
                        <Link href={`${basePath}/money/total-money`} onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.totalMoney")}</Link>
                      </div>
                    )}
                  </div>

                  {/* Users */}
                  <div className="space-y-1">
                    <button onClick={() => setIsUsersOpen(!isUsersOpen)} className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-base text-(--foreground) hover:bg-(--muted)">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5" />
                        <span>{t("nav.users")}</span>
                      </div>
                      {isUsersOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    {isUsersOpen && (
                      <div className="pl-9 space-y-1 py-1">
                        <Link href={`${basePath}/users`} onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.overview")}</Link>
                        <Link href={`${basePath}/users/create`} onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.create")}</Link>
                      </div>
                    )}
                  </div>

                  <Link href={`${basePath}/reports`} onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-base text-(--foreground) hover:bg-(--muted)">
                    <BarChart3 className="w-5 h-5" />
                    <span>{t("nav.reports")}</span>
                  </Link>

                  <Link href={`${basePath}/settings`} onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-base text-(--foreground) hover:bg-(--muted)">
                    <Settings className="w-5 h-5" />
                    <span>{t("nav.settings")}</span>
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}