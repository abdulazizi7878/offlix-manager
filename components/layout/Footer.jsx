import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ThemeSwitcher } from "./ThemeSwitcher";
import LanguageSwitcher from "./LanguageSwitcher";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const t = useTranslations("footer");

  return (
    <footer className="w-full mt-auto bg-[var(--background)] border-t border-[var(--border)] text-[var(--muted-foreground)] transition-colors">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">

          {/* Brand Column */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 inline-flex focus:outline-none focus:ring-2 focus:ring-[var(--ring)] rounded-lg p-1 -ml-1">
              <div className="bg-(--primary) rounded">
                <Image src={"/images/logo.png"} height={28} width={28} alt="Offlix logo"  />
              </div>
              <span className="font-bold text-[var(--foreground)] tracking-tight">{t("brandName")}</span>
            </Link>
            <p className="text-sm max-w-xs">
              {t("description")}
            </p>
          </div>

          {/* Real Links Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">{t("product")}</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/dashboard" className="hover:text-[var(--foreground)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--ring)] rounded-sm">
                  {t("dashboard")}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[var(--foreground)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--ring)] rounded-sm">
                  {t("signIn")}
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-[var(--foreground)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--ring)] rounded-sm">
                  {t("createAccount")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Settings Column (Theme & Language Switchers) */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">{t("settings")}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between sm:justify-start sm:gap-4">
                <span>{t("themeMode")}</span>
                <ThemeSwitcher />
              </div>
              <div className="flex items-center justify-between sm:justify-start sm:gap-4">
                <span>{t("language")}</span>
                <LanguageSwitcher />
              </div>
            </div>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <p>{t("copyright", { year: currentYear })}</p>
        </div>
      </div>
    </footer>
  );
}