// file: app/dashboard/layout.jsx

"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  GitBranch,
  Package,
  ShoppingCart,
  Receipt,
  Users,
  BarChart3,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Store,
  LogOut,
  User,
  GripVertical
} from "lucide-react";
import { ThemeSwitcher } from "@/components/layout/ThemeSwitcher";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isBranchesOpen, setIsBranchesOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isSalesOpen, setIsSalesOpen] = useState(false);
  const [isMoneyOpen, setIsMoneyOpen] = useState(false);
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Sidebar resizing state (default width: 288px / 18rem)
  const [sidebarWidth, setSidebarWidth] = useState(288);
  const isResizingRef = useRef(false);

  useEffect(() => {
    if (pathname.includes("/dashboard/branches")) {
      setIsBranchesOpen(true);
    }
    if (pathname.includes("/dashboard/products")) {
      setIsProductsOpen(true);
    }
    if (pathname.includes("/dashboard/sales")) {
      setIsSalesOpen(true);
    }
    if (pathname.includes("/dashboard/money")) {
      setIsMoneyOpen(true);
    }
    if (pathname.includes("/dashboard/users")) {
      setIsUsersOpen(true);
    }

    // Close mobile drawer when route changes on small screens
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetchApi("/api/v1/auth/me");
        setUser(res.data?.user || res.data);
      } catch (err) {
        // Fallback or ignore if unauthenticated handled by middleware/api
      }
    }
    loadUser();
  }, []);

  // Handle sidebar manual resizing via drag handle
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizingRef.current) return;
      const newWidth = e.clientX;
      if (newWidth >= 220 && newWidth <= 450) {
        setSidebarWidth(newWidth);
      }
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

  const handleLogout = async () => {
    try {
      await fetchApi("/api/v1/auth/logout", { method: "POST" });
      toast.success("Successfully logged out.");
      router.push("/login");
      router.refresh();
    } catch (err) {
      toast.error("Failed to log out. Please try again.");
    }
  };

  // Helper to check active state without lingering outlines/borders
  const isExactActive = (path) => pathname === path;
  const isSubActive = (prefix) => pathname.startsWith(prefix);

  // Generate dynamic breadcrumbs based on pathname (e.g. dashboard -> users -> create)
  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    return segments.map((segment, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/");
      const label = segment.charAt(0).toUpperCase() + segment.slice(1);
      return { href, label };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="h-screen bg-(--background) text-(--foreground) flex overflow-hidden antialiased selection:bg-(--primary) selection:text-(--primary-foreground)">

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar / Navigation */}
      <aside
        style={{ width: `${sidebarWidth}px` }}
        className={`
          fixed inset-y-0 left-0 z-50 bg-(--card) border-r border-(--border) flex flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0 shrink-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-(--border) flex items-center justify-between shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5 rounded-lg p-1 -ml-1">
            <div className="bg-(--primary) text-(--primary-foreground) rounded-lg shadow-xs">
              <Image src={"/images/logo.png"} width={36} height={36} alt="Offlix Manager Logo" className="rounded-md" />
            </div>
            <span className="font-bold text-md tracking-tight">Offlix Manager</span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-1.5 text-(--muted-foreground) hover:text-(--foreground) rounded-lg hover:bg-(--muted)"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items (Scrollbar hidden cleanly) */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 text-sm font-medium [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors outline-none border-0 ${isExactActive("/dashboard")
              ? "bg-(--primary) text-(--primary-foreground)"
              : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)"
              }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          {/* Branches Section */}
          <div className="space-y-1">
            <button
              onClick={() => setIsBranchesOpen(!isBranchesOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors outline-none border-0 ${isSubActive("/dashboard/branches")
                ? "bg-(--primary) text-(--primary-foreground)"
                : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)"
                }`}
            >
              <div className="flex items-center gap-3">
                <GitBranch className="w-4 h-4" />
                <span>Branches</span>
              </div>
              {isBranchesOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {isBranchesOpen && (
              <div className="pl-9 space-y-1 py-1">
                <Link
                  href="/dashboard/branches"
                  className={`block px-3 py-2 rounded-lg text-xs transition-colors outline-none border-0 ${isExactActive("/dashboard/branches")
                    ? "bg-(--primary) text-(--primary-foreground) font-semibold"
                    : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"
                    }`}
                >
                  Overview
                </Link>
                <Link
                  href="/dashboard/branches/create"
                  className={`block px-3 py-2 rounded-lg text-xs transition-colors outline-none border-0 ${isExactActive("/dashboard/branches/create")
                    ? "bg-(--primary) text-(--primary-foreground) font-semibold"
                    : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"
                    }`}
                >
                  Create
                </Link>
              </div>
            )}
          </div>

          {/* Products Group */}
          <div className="space-y-1">
            <button
              onClick={() => setIsProductsOpen(!isProductsOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors outline-none border-0 ${isSubActive("/dashboard/products")
                ? "bg-(--primary) text-(--primary-foreground)"
                : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)"
                }`}
            >
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4" />
                <span>Products</span>
              </div>
              {isProductsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {isProductsOpen && (
              <div className="pl-9 space-y-1 py-1">
                <Link
                  href="/dashboard/products"
                  className={`block px-3 py-2 rounded-lg text-xs transition-colors outline-none border-0 ${isExactActive("/dashboard/products")
                    ? "bg-(--primary) text-(--primary-foreground) font-semibold"
                    : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"
                    }`}
                >
                  Overview
                </Link>
                <Link
                  href="/dashboard/products/create"
                  className={`block px-3 py-2 rounded-lg text-xs transition-colors outline-none border-0 ${isExactActive("/dashboard/products/create")
                    ? "bg-(--primary) text-(--primary-foreground) font-semibold"
                    : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"
                    }`}
                >
                  Create
                </Link>
              </div>
            )}
          </div>

          {/* Sales Group */}
          <div className="space-y-1">
            <button
              onClick={() => setIsSalesOpen(!isSalesOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors outline-none border-0 ${isSubActive("/dashboard/sales")
                ? "bg-(--primary) text-(--primary-foreground)"
                : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)"
                }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-4 h-4" />
                <span>Sales</span>
              </div>
              {isSalesOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {isSalesOpen && (
              <div className="pl-9 space-y-1 py-1">
                <Link
                  href="/dashboard/sales"
                  className={`block px-3 py-2 rounded-lg text-xs transition-colors outline-none border-0 ${isExactActive("/dashboard/sales")
                    ? "bg-(--primary) text-(--primary-foreground) font-semibold"
                    : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"
                    }`}
                >
                  Overview
                </Link>
                <Link
                  href="/dashboard/sales/create"
                  className={`block px-3 py-2 rounded-lg text-xs transition-colors outline-none border-0 ${isExactActive("/dashboard/sales/create")
                    ? "bg-(--primary) text-(--primary-foreground) font-semibold"
                    : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"
                    }`}
                >
                  Create
                </Link>
              </div>
            )}
          </div>

          {/* Money Group */}
          <div className="space-y-1">
            <button
              onClick={() => setIsMoneyOpen(!isMoneyOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors outline-none border-0 ${isSubActive("/dashboard/money")
                ? "bg-(--primary) text-(--primary-foreground)"
                : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)"
                }`}
            >
              <div className="flex items-center gap-3">
                <Receipt className="w-4 h-4" />
                <span>Money</span>
              </div>
              {isMoneyOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {isMoneyOpen && (
              <div className="pl-9 space-y-1 py-1">
                <Link
                  href="/dashboard/money"
                  className={`block px-3 py-2 rounded-lg text-xs transition-colors outline-none border-0 ${isExactActive("/dashboard/money")
                    ? "bg-(--primary) text-(--primary-foreground) font-semibold"
                    : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"
                    }`}
                >
                  Overview
                </Link>
                <Link
                  href="/dashboard/money/accounts"
                  className={`block px-3 py-2 rounded-lg text-xs transition-colors outline-none border-0 ${isExactActive("/dashboard/money/accounts")
                    ? "bg-(--primary) text-(--primary-foreground) font-semibold"
                    : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"
                    }`}
                >
                  Accounts
                </Link>
                <Link
                  href="/dashboard/money/transactions"
                  className={`block px-3 py-2 rounded-lg text-xs transition-colors outline-none border-0 ${isExactActive("/dashboard/money/transactions")
                    ? "bg-(--primary) text-(--primary-foreground) font-semibold"
                    : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"
                    }`}
                >
                  Transactions
                </Link>
                <Link
                  href="/dashboard/money/transfers"
                  className={`block px-3 py-2 rounded-lg text-xs transition-colors outline-none border-0 ${isExactActive("/dashboard/money/transfers")
                    ? "bg-(--primary) text-(--primary-foreground) font-semibold"
                    : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"
                    }`}
                >
                  Transfers
                </Link>
                <Link
                  href="/dashboard/money/settlements"
                  className={`block px-3 py-2 rounded-lg text-xs transition-colors outline-none border-0 ${isExactActive("/dashboard/money/settlements")
                    ? "bg-(--primary) text-(--primary-foreground) font-semibold"
                    : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"
                    }`}
                >
                  Settlements
                </Link>
                <Link
                  href="/dashboard/money/payables"
                  className={`block px-3 py-2 rounded-lg text-xs transition-colors outline-none border-0 ${isExactActive("/dashboard/money/payables")
                    ? "bg-(--primary) text-(--primary-foreground) font-semibold"
                    : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"
                    }`}
                >
                  Payables
                </Link>
                <Link
                  href="/dashboard/money/credits"
                  className={`block px-3 py-2 rounded-lg text-xs transition-colors outline-none border-0 ${isExactActive("/dashboard/money/credits")
                    ? "bg-(--primary) text-(--primary-foreground) font-semibold"
                    : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"
                    }`}
                >
                  Credit
                </Link>
                <Link
                  href="/dashboard/money/total-money"
                  className={`block px-3 py-2 rounded-lg text-xs transition-colors outline-none border-0 ${isExactActive("/dashboard/money/total-money")
                    ? "bg-(--primary) text-(--primary-foreground) font-semibold"
                    : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"
                    }`}
                >
                  Total Money
                </Link>
              </div>
            )}
          </div>

          {/* Users Group */}
          <div className="space-y-1">
            <button
              onClick={() => setIsUsersOpen(!isUsersOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors outline-none border-0 ${isSubActive("/dashboard/users")
                ? "bg-(--primary) text-(--primary-foreground)"
                : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)"
                }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                <span>Users</span>
              </div>
              {isUsersOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {isUsersOpen && (
              <div className="pl-9 space-y-1 py-1">
                <Link
                  href="/dashboard/users"
                  className={`block px-3 py-2 rounded-lg text-xs transition-colors outline-none border-0 ${isExactActive("/dashboard/users")
                    ? "bg-(--primary) text-(--primary-foreground) font-semibold"
                    : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"
                    }`}
                >
                  Overview
                </Link>
                <Link
                  href="/dashboard/users/create"
                  className={`block px-3 py-2 rounded-lg text-xs transition-colors outline-none border-0 ${isExactActive("/dashboard/users/create")
                    ? "bg-(--primary) text-(--primary-foreground) font-semibold"
                    : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"
                    }`}
                >
                  Create
                </Link>
              </div>
            )}
          </div>

          {/* Reports Link */}
          <Link
            href="/dashboard/reports"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors outline-none border-0 ${isExactActive("/dashboard/reports")
              ? "bg-(--primary) text-(--primary-foreground)"
              : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)"
              }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Reports</span>
          </Link>
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-(--border) shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-(--muted) text-(--foreground) flex items-center justify-center font-semibold text-sm shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || "Manager"}</p>
                <p className="text-xs text-(--muted-foreground) truncate">{user?.email || "Manager account"}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-(--muted-foreground) hover:text-(--destructive) rounded-lg hover:bg-(--muted) outline-none transition-colors border-0"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Resizer Handle */}
        <div
          onMouseDown={startResizing}
          className="hidden md:flex absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-(--primary)/50 transition-colors items-center justify-center group"
          title="Drag to resize sidebar"
        >
          <div className="w-0.5 h-8 bg-(--border) group-hover:bg-(--primary) rounded-full" />
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* Top Bar Header (Fixed on all screens via sticky/fixed behavior matching container) */}
        <header className="h-16 px-6 bg-(--card) border-b border-(--border) flex items-center justify-between shrink-0 z-30 sticky top-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-(--muted-foreground) hover:text-(--foreground) rounded-lg hover:bg-(--muted) outline-none border-0"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Brand Title on Mobile / Hidden Breadcrumbs on Small Screens, Dynamic Breadcrumbs on Medium+ Screens */}
            <h1 className="text-base font-semibold tracking-tight md:hidden">Offlix Manager</h1>

            {/* Breadcrumbs shown only on desktop (hidden on small screens using hidden md:flex) */}
            <nav className="hidden md:flex items-center space-x-2 text-sm font-medium">
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <div key={crumb.href} className="flex items-center space-x-2">
                    {index > 0 && <ChevronRight className="w-4 h-4 text-(--muted-foreground)" />}
                    {isLast ? (
                      <span className="text-(--foreground) font-semibold">{crumb.label}</span>
                    ) : (
                      <Link href={crumb.href} className="text-(--muted-foreground) hover:text-(--foreground) transition-colors">
                        {crumb.label}
                      </Link>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            {/* User Profile Avatar shown in small/mobile screens right after the theme changer */}
            <div className="flex md:hidden items-center">
              <div className="w-8 h-8 rounded-full bg-(--muted) text-(--foreground) flex items-center justify-center font-semibold text-xs shrink-0 border border-(--border)">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content View (Scrollable area with scrollbars completely hidden for a sleek, clean appearance) */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 w-full [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}