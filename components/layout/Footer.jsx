import Link from "next/link";
import { Store } from "lucide-react";
import { ThemeSwitcher } from "./ThemeSwitcher";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full mt-auto bg-[var(--background)] border-t border-[var(--border)] text-[var(--muted-foreground)] transition-colors">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">

          {/* Brand Column */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 inline-flex focus:outline-none focus:ring-2 focus:ring-[var(--ring)] rounded-lg p-1 -ml-1">
              <div className="bg-[var(--primary)] text-[var(--primary-foreground)] p-1 rounded">
                <Store className="w-4 h-4" />
              </div>
              <span className="font-bold text-[var(--foreground)] tracking-tight">Offlix</span>
            </Link>
            <p className="text-sm max-w-xs">
              Business management made simple. The all-in-one manager for modern teams.
            </p>
          </div>

          {/* Real Links Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Product</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/dashboard" className="hover:text-[var(--foreground)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--ring)] rounded-sm">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[var(--foreground)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--ring)] rounded-sm">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-[var(--foreground)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--ring)] rounded-sm">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Theme Switcher Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Appearance</h3>
            <div className="flex items-center gap-3">
              <span className="text-sm">Theme Mode</span>
              <ThemeSwitcher />
            </div>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <p>© {currentYear} Offlix. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}