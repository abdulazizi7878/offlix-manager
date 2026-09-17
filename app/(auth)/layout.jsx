// file: app/(auth)/layout.jsx

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ThemeSwitcher } from "@/components/layout/ThemeSwitcher";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

export default function AuthLayout({ children }) {
  const t = useTranslations("auth");
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-(--background) text-(--foreground) flex flex-col justify-between p-4 md:p-8">
      {/* Top Bar with Brand Logo & Switchers */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between py-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-(--ring) rounded-lg p-1"
        >
          <div className="relative size-9 rounded-md overflow-hidden flex items-center justify-center bg-[var(--primary)]/10">
            <Image
              src="/images/logo.png"
              alt="Offlix Manager Logo"
              fill
              className="object-cover"
            />
          </div>
          <span className="font-bold text-lg tracking-tight">
            {t("brandName")}
          </span>
        </Link>

        {/* Switchers aligned horizontally */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </header>

      {/* Main Authentication Form Container */}
      <main className="w-full max-w-md mx-auto my-auto py-4">
        {children}
      </main>

      {/* Simple Footer Note */}
      <footer className="w-full max-w-md mx-auto text-center py-4 text-xs text-(--muted-foreground)">
        © {currentYear} {t("brandName")}. All rights reserved.
      </footer>
    </div>
  );
}