// file: app/%28auth%29/layout.jsx

import Link from "next/link";
import { Store } from "lucide-react";
import { ThemeSwitcher } from "@/components/layout/ThemeSwitcher";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-(--background) text-(--foreground) flex flex-col justify-between p-4 md:p-8">
      {/* Top Bar with Minimalist Brand and Theme Switcher */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between py-4">
        <Link 
          href="/" 
          className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-(--ring) rounded-lg p-1"
        >
          <div className="bg-(--primary) text-(--primary-foreground) p-1.5 rounded-md">
            <Store className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">Offlix</span>
        </Link>
        <ThemeSwitcher />
      </header>

      {/* Main Authentication Form Container */}
      <main className="w-full max-w-md mx-auto my-auto py-4">
        {children}
      </main>

      {/* Simple Footer Note */}
      <footer className="w-full max-w-md mx-auto text-center py-4 text-xs text-(--muted-foreground)">
        © {new Date().getFullYear()} Offlix. All rights reserved.
      </footer>
    </div>
  );
}