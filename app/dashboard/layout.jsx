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

  useEffect(() => {
    if (pathname.includes("/dashboard/branches")) setIsBranchesOpen(true);
    if (pathname.includes("/dashboard/products")) setIsProductsOpen(true);
    if (pathname.includes("/dashboard/sales")) setIsSalesOpen(true);
    if (pathname.includes("/dashboard/money")) setIsMoneyOpen(true);
    if (pathname.includes("/dashboard/users")) setIsUsersOpen(true);

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

      const translatedLabel = t.has(`nav.${segment}`)
        ? t(`nav.${segment}`)
        : segment.charAt(0).toUpperCase() + segment.slice(1);

      return {
        href,
        label: translatedLabel,
      };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  const navigationItems = [
    { label: t("nav.dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { label: t("nav.branches"), href: "/dashboard/branches", icon: GitBranch },
    { label: `${t("nav.branches")} - ${t("nav.create")}`, href: "/dashboard/branches/create", icon: GitBranch },
    { label: t("nav.products"), href: "/dashboard/products", icon: Package },
    { label: `${t("nav.products")} - ${t("nav.create")}`, href: "/dashboard/products/create", icon: Package },
    { label: `${t("nav.products")} - ${t("nav.purchases")}`, href: "/dashboard/products/purchases", icon: Package },
    { label: t("nav.sales"), href: "/dashboard/sales", icon: ShoppingCart },
    { label: `${t("nav.sales")} - ${t("nav.create")}`, href: "/dashboard/sales/create", icon: ShoppingCart },
    { label: t("nav.money"), href: "/dashboard/money", icon: Receipt },
    { label: `${t("nav.money")} - ${t("nav.accounts")}`, href: "/dashboard/money/accounts", icon: Receipt },
    { label: `${t("nav.money")} - ${t("nav.transactions")}`, href: "/dashboard/money/transactions", icon: Receipt },
    { label: `${t("nav.money")} - ${t("nav.transfers")}`, href: "/dashboard/money/transfers", icon: Receipt },
    { label: `${t("nav.money")} - ${t("nav.settlements")}`, href: "/dashboard/money/settlements", icon: Receipt },
    { label: `${t("nav.money")} - ${t("nav.payables")}`, href: "/dashboard/money/payables", icon: Receipt },
    { label: `${t("nav.money")} - ${t("nav.credit")}`, href: "/dashboard/money/credits", icon: Receipt },
    { label: `${t("nav.money")} - ${t("nav.totalMoney")}`, href: "/dashboard/money/total-money", icon: Receipt },
    { label: t("nav.users"), href: "/dashboard/users", icon: Users },
    { label: `${t("nav.users")} - ${t("nav.create")}`, href: "/dashboard/users/create", icon: Users },
    { label: t("nav.reports"), href: "/dashboard/reports", icon: BarChart3 },
    { label: t("nav.settings"), href: "/dashboard/settings", icon: Settings },
  ];

  const filteredNavItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return navigationItems;
    return navigationItems.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        item.href.toLowerCase().includes(query)
    );
  }, [searchQuery]);

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
          <Link href="/dashboard" className="flex items-center gap-2.5 rounded-lg p-1 -ml-1">
            <div className="bg-(--primary) text-(--primary-foreground) rounded-lg shadow-xs overflow-hidden">
              <Image src="/images/logo.png" width={36} height={36} alt={`${t("brandName")} Logo`} className="rounded-md object-cover" />
            </div>
            <span className="font-bold text-md tracking-tight">{t("brandName")}</span>
          </Link>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 text-sm font-medium [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors outline-none border-0 ${isExactActive("/dashboard") ? "bg-(--primary) text-(--primary-foreground)" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)"
              }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>{t("nav.dashboard")}</span>
          </Link>

          {/* Branches */}
          <div className="space-y-1">
            <button
              onClick={() => setIsBranchesOpen(!isBranchesOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors outline-none border-0 ${isSubActive("/dashboard/branches") ? "bg-(--primary) text-(--primary-foreground)" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)"
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
                <Link href="/dashboard/branches" className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive("/dashboard/branches") ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.overview")}</Link>
                <Link href="/dashboard/branches/create" className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive("/dashboard/branches/create") ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.create")}</Link>
              </div>
            )}
          </div>

          {/* Products */}
          <div className="space-y-1">
            <button
              onClick={() => setIsProductsOpen(!isProductsOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors outline-none border-0 ${isSubActive("/dashboard/products") ? "bg-(--primary) text-(--primary-foreground)" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)"
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
                <Link href="/dashboard/products" className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive("/dashboard/products") ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.overview")}</Link>
                <Link href="/dashboard/products/create" className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive("/dashboard/products/create") ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.create")}</Link>
                <Link href="/dashboard/products/purchases" className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive("/dashboard/products/purchases") ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.purchases")}</Link>
              </div>
            )}
          </div>

          {/* Sales */}
          <div className="space-y-1">
            <button
              onClick={() => setIsSalesOpen(!isSalesOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors outline-none border-0 ${isSubActive("/dashboard/sales") ? "bg-(--primary) text-(--primary-foreground)" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)"
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
                <Link href="/dashboard/sales" className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive("/dashboard/sales") ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.overview")}</Link>
                <Link href="/dashboard/sales/create" className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive("/dashboard/sales/create") ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.create")}</Link>
              </div>
            )}
          </div>

          {/* Money */}
          <div className="space-y-1">
            <button
              onClick={() => setIsMoneyOpen(!isMoneyOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors outline-none border-0 ${isSubActive("/dashboard/money") ? "bg-(--primary) text-(--primary-foreground)" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)"
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
                <Link href="/dashboard/money" className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive("/dashboard/money") ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.overview")}</Link>
                <Link href="/dashboard/money/accounts" className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive("/dashboard/money/accounts") ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.accounts")}</Link>
                <Link href="/dashboard/money/transactions" className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive("/dashboard/money/transactions") ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.transactions")}</Link>
                <Link href="/dashboard/money/transfers" className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive("/dashboard/money/transfers") ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.transfers")}</Link>
                <Link href="/dashboard/money/settlements" className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive("/dashboard/money/settlements") ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.settlements")}</Link>
                <Link href="/dashboard/money/payables" className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive("/dashboard/money/payables") ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.payables")}</Link>
                <Link href="/dashboard/money/credits" className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive("/dashboard/money/credits") ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.credit")}</Link>
                <Link href="/dashboard/money/total-money" className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive("/dashboard/money/total-money") ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.totalMoney")}</Link>
              </div>
            )}
          </div>

          {/* Users */}
          <div className="space-y-1">
            <button
              onClick={() => setIsUsersOpen(!isUsersOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors outline-none border-0 ${isSubActive("/dashboard/users") ? "bg-(--primary) text-(--primary-foreground)" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)"
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
                <Link href="/dashboard/users" className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive("/dashboard/users") ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.overview")}</Link>
                <Link href="/dashboard/users/create" className={`block px-3 py-2 rounded-lg text-xs transition-colors ${isExactActive("/dashboard/users/create") ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"}`}>{t("nav.create")}</Link>
              </div>
            )}
          </div>

          <Link href="/dashboard/reports" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors outline-none border-0 ${isExactActive("/dashboard/reports") ? "bg-(--primary) text-(--primary-foreground)" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)"}`}>
            <BarChart3 className="w-4 h-4" />
            <span>{t("nav.reports")}</span>
          </Link>

          <Link href="/dashboard/settings" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors outline-none border-0 ${isSubActive("/dashboard/settings") ? "bg-(--primary) text-(--primary-foreground)" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)"}`}>
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

        <main className="flex-1 overflow-y-auto p-6 md:p-8 pb-28 md:pb-8 w-full [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>

        {/* Mobile Floating Bottom Navigation */}
        <div className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-40">
          <div className="flex items-center gap-2 bg-(--card)/90 backdrop-blur-md border border-(--border) shadow-2xl rounded-full p-2 px-4 text-(--foreground)">
            <button
              type="button"
              onClick={handleOpenSearch}
              className="p-2.5 rounded-full hover:bg-(--muted) text-(--foreground) transition-colors cursor-pointer"
              aria-label="Open Search"
            >
              <Search className="w-5 h-5" />
            </button>

            <div className="w-[1px] h-5 bg-(--border)" />

            <button
              type="button"
              onClick={handleOpenMenu}
              className="flex items-center gap-2 py-2 px-3.5 rounded-full bg-(--foreground) text-(--background) font-semibold text-xs transition-transform active:scale-95 cursor-pointer shadow-sm"
              aria-label="Open Mobile Menu"
            >
              <Menu className="w-4 h-4" />
              <span>Menu</span>
            </button>
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
                  <Link href="/dashboard" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${isExactActive("/dashboard") ? "bg-(--primary) text-(--primary-foreground) font-semibold" : "text-(--foreground) hover:bg-(--muted)"}`}>
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="text-base">{t("nav.dashboard")}</span>
                  </Link>

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
                        <Link href="/dashboard/branches" onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.overview")}</Link>
                        <Link href="/dashboard/branches/create" onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.create")}</Link>
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
                        <Link href="/dashboard/products" onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.overview")}</Link>
                        <Link href="/dashboard/products/create" onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.create")}</Link>
                        <Link href="/dashboard/products/purchases" onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.purchases")}</Link>
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
                        <Link href="/dashboard/sales" onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.overview")}</Link>
                        <Link href="/dashboard/sales/create" onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.create")}</Link>
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
                        <Link href="/dashboard/money" onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.overview")}</Link>
                        <Link href="/dashboard/money/accounts" onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.accounts")}</Link>
                        <Link href="/dashboard/money/transactions" onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.transactions")}</Link>
                        <Link href="/dashboard/money/transfers" onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.transfers")}</Link>
                        <Link href="/dashboard/money/settlements" onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.settlements")}</Link>
                        <Link href="/dashboard/money/payables" onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.payables")}</Link>
                        <Link href="/dashboard/money/credits" onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.credit")}</Link>
                        <Link href="/dashboard/money/total-money" onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.totalMoney")}</Link>
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
                        <Link href="/dashboard/users" onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.overview")}</Link>
                        <Link href="/dashboard/users/create" onClick={() => setIsSidebarOpen(false)} className="block px-3 py-2 text-sm text-(--muted-foreground)">{t("nav.create")}</Link>
                      </div>
                    )}
                  </div>

                  <Link href="/dashboard/reports" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-base text-(--foreground) hover:bg-(--muted)">
                    <BarChart3 className="w-5 h-5" />
                    <span>{t("nav.reports")}</span>
                  </Link>

                  <Link href="/dashboard/settings" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-base text-(--foreground) hover:bg-(--muted)">
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