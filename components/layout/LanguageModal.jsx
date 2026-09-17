"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Globe, Check } from "lucide-react";

const LANGUAGES = [
    { code: "en", name: "English", label: "English" },
    { code: "am", name: "አማርኛ", label: "Amharic" },
    { code: "ar", name: "العربية", label: "Arabic" }
];

export function LanguageModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLang, setSelectedLang] = useState("en");
    const router = useRouter();

    useEffect(() => {
        const savedLang = localStorage.getItem("preferred_language");
        if (!savedLang) {
            setIsOpen(true);
        }
    }, []);

    const handleSelectLanguage = (code) => {
        setSelectedLang(code);
        localStorage.setItem("preferred_language", code);

        // Set language cookie or query param if your i18n setup uses cookies/routing
        document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000`;

        setIsOpen(false);
        router.refresh();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md p-6 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl text-[var(--card-foreground)]">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                        <Globe className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Select Language / ቋንቋ ይምረጡ</h2>
                        <p className="text-xs text-[var(--muted-foreground)]">Choose your workspace language</p>
                    </div>
                </div>

                <div className="space-y-2.5 my-6">
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleSelectLanguage(lang.code)}
                            className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left font-medium ${selectedLang === lang.code
                                    ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--foreground)] shadow-xs"
                                    : "border-[var(--border)] hover:bg-[var(--muted)]/50 text-[var(--muted-foreground)]"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-base">{lang.name}</span>
                                <span className="text-xs text-[var(--muted-foreground)]">({lang.label})</span>
                            </div>
                            {selectedLang === lang.code && (
                                <Check className="w-4 h-4 text-[var(--primary)]" />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}