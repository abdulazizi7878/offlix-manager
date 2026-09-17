// file: components/layout/LanguageSwitcher.jsx

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Globe, Check } from "lucide-react";

const languages = [
    { code: "en", label: "English", native: "English" },
    { code: "am", label: "Amharic", native: "አማርኛ" },
    { code: "ar", label: "Arabic", native: "العربية" },
];

export default function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const changeLanguage = (newLocale) => {
        document.cookie = `locale=${newLocale}; path=/; max-age=31536000; samesite=lax`;
        setIsOpen(false);
        router.refresh();
    };

    const currentLanguage = languages.find((l) => l.code === locale) || languages[0];

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-2 rounded-lg text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted) focus:outline-none focus:ring-2 focus:ring-(--ring) transition-colors text-sm font-medium"
                aria-label="Select language"
                aria-expanded={isOpen}
            >
                <Globe className="w-5 h-5" />
                <span className="hidden sm:inline">{currentLanguage.native}</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 z-50 mt-2 w-40 origin-top-right bg-(--popover) text-(--popover-foreground) border border-(--border) rounded-lg shadow-md py-1 focus:outline-none">
                    {languages.map(({ code, label, native }) => (
                        <button
                            key={code}
                            onClick={() => changeLanguage(code)}
                            className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-(--muted) focus:bg-(--muted) focus:outline-none transition-colors text-left"
                        >
                            <div className="flex items-center gap-2">
                                <span>{native}</span>
                                <span className="text-xs text-(--muted-foreground)">({label})</span>
                            </div>
                            {locale === code && <Check className="w-4 h-4 text-(--primary)" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}