"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { UserMenu } from "./UserMenu";

export function Header({ user = null }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isAuthenticated = !!user;

  // Always show Dashboard navigation link as requested
  const mainNavigation = [
    { name: "Dashboard", href: "/dashboard" }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 mx-3 mt-2 md:mt-2 md:mx-6 max-w-7xl xl:mx-auto">
      <div className="bg-[var(--card)] text-[var(--card-foreground)] border border-[var(--border)] rounded-2xl shadow-sm px-4 py-1.5 flex items-center justify-between">

        {/* Left Side: Brand & Desktop Nav */}
        <div className="flex items-center gap-8">
          <Link
            href={isAuthenticated ? "/dashboard" : "/"}
            className="flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] rounded-lg p-1"
          >
            <div className="relative size-10 rounded-md overflow-hidden flex items-center justify-center bg-[var(--primary)]/10">
              <Image
                src="/images/logo.png"
                alt="Offlix Manager Logo"
                fill
                className="object-cover"
              />
            </div>
            <span className="font-bold text-lg tracking-tight">Offlix Manager</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {mainNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)] ${pathname === item.href
                    ? "bg-[var(--muted)] text-[var(--foreground)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50"
                  }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <ThemeSwitcher />
          </div>

          {isAuthenticated ? (
            <div className="hidden md:block border-l border-[var(--border)] pl-2 ml-1">
              <UserMenu user={user} />
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2 border-l border-[var(--border)] pl-3 ml-1">
              <Link href="/login" className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] px-3 py-1.5 transition-colors">
                Sign In
              </Link>
              <Link href="/register" className="text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 px-4 py-1.5 rounded-lg transition-opacity shadow-sm">
                Register
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 -mr-1 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden md:hidden">
          <div className="p-4 space-y-4">
            <nav className="space-y-1 pb-4 border-b border-[var(--border)]">
              {mainNavigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            <div className="flex items-center justify-between px-3">
              <span className="text-sm font-medium text-[var(--muted-foreground)]">Theme</span>
              <ThemeSwitcher />
            </div>

            {!isAuthenticated && (
              <div className="pt-4 border-t border-[var(--border)] grid grid-cols-2 gap-3">
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-2 text-center text-sm font-medium rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]">
                  Sign In
                </Link>
                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-2 text-center text-sm font-medium rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)]">
                  Register
                </Link>
              </div>
            )}

            {isAuthenticated && (
              <div className="pt-4 border-t border-[var(--border)]">
                <p className="px-3 text-sm font-medium text-[var(--foreground)]">{user?.name}</p>
                <p className="px-3 text-xs text-[var(--muted-foreground)] mb-2">{user?.email}</p>
                <button
                  onClick={async () => {
                    await fetchApi("/api/v1/auth/logout", { method: "POST" });
                    window.location.href = "/login";
                  }}
                  className="w-full text-left px-3 py-2 mt-2 rounded-md text-sm font-medium text-[var(--destructive)] hover:bg-[var(--muted)]"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}