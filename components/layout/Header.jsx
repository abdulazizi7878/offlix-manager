"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Store } from "lucide-react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { UserMenu } from "./UserMenu";

export function Header({ user = null }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isAuthenticated = !!user;

  // We only show routes that actually exist
  const mainNavigation = isAuthenticated 
    ? [{ name: "Dashboard", href: "/dashboard" }]
    : [];

  return (
    <header className="sticky top-2 md:top-4 z-40 mx-3 md:mx-6 max-w-7xl xl:mx-auto">
      <div className="bg-(--card) text-(--card-foreground) border border-(--border) rounded-2xl shadow-sm px-4 py-2.5 flex items-center justify-between">
        
        {/* Left Side: Brand & Desktop Nav */}
        <div className="flex items-center gap-8">
          <Link 
            href={isAuthenticated ? "/dashboard" : "/"} 
            className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-(--ring) rounded-lg p-1"
          >
            <div className="bg-(--primary) text-(--primary-foreground) p-1.5 rounded-md">
              <Store className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">Offlix</span>
          </Link>

          {/* Desktop Navigation */}
          {mainNavigation.length > 0 && (
            <nav className="hidden md:flex items-center gap-1">
              {mainNavigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-(--ring) ${
                    pathname === item.href 
                      ? "bg-(--muted) text-(--foreground)" 
                      : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)/50"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <ThemeSwitcher />
          </div>

          {isAuthenticated ? (
            <div className="hidden md:block border-l border-(--border) pl-2 ml-1">
              <UserMenu user={user} />
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2 border-l border-(--border) pl-3 ml-1">
              <Link href="/login" className="text-sm font-medium text-(--muted-foreground) hover:text-(--foreground) px-3 py-1.5 transition-colors">
                Sign In
              </Link>
              <Link href="/register" className="text-sm font-medium bg-(--primary) text-(--primary-foreground) hover:opacity-90 px-4 py-1.5 rounded-lg transition-opacity shadow-sm">
                Register
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 -mr-1 rounded-lg text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted) focus:outline-none focus:ring-2 focus:ring-(--ring)"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-(--card) border border-(--border) rounded-xl shadow-sm overflow-hidden md:hidden">
          <div className="p-4 space-y-4">
            {mainNavigation.length > 0 && (
              <nav className="space-y-1 pb-4 border-b border-(--border)">
                {mainNavigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-(--foreground) hover:bg-(--muted)"
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            )}

            <div className="flex items-center justify-between px-3">
              <span className="text-sm font-medium text-(--muted-foreground)">Theme</span>
              <ThemeSwitcher />
            </div>

            {!isAuthenticated && (
              <div className="pt-4 border-t border-(--border) grid grid-cols-2 gap-3">
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-2 text-center text-sm font-medium rounded-lg border border-(--border) bg-(--background) text-(--foreground)">
                  Sign In
                </Link>
                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-2 text-center text-sm font-medium rounded-lg bg-(--primary) text-(--primary-foreground)">
                  Register
                </Link>
              </div>
            )}
            
            {isAuthenticated && (
              <div className="pt-4 border-t border-(--border)">
                <p className="px-3 text-sm font-medium text-(--foreground)">{user?.name}</p>
                <p className="px-3 text-xs text-(--muted-foreground) mb-2">{user?.email}</p>
                <button
                  onClick={async () => {
                    await fetchApi("/api/v1/auth/logout", { method: "POST" });
                    window.location.href = "/login"; 
                  }}
                  className="w-full text-left px-3 py-2 mt-2 rounded-md text-sm font-medium text-(--destructive) hover:bg-(--muted)"
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