"use client";

import { User, Building2, Shield } from "lucide-react";
import { useTranslations } from "next-intl";

export default function SettingsNavigation({ activeTab, onTabChange }) {
    const t = useTranslations("dashboard.settingsPage.nav");

    const navItems = [
        {
            id: "account",
            label: t("account.label"),
            description: t("account.description"),
            icon: User,
        },
        {
            id: "organization",
            label: t("organization.label"),
            description: t("organization.description"),
            icon: Building2,
        },
        {
            id: "security",
            label: t("security.label"),
            description: t("security.description"),
            icon: Shield,
        },
    ];

    return (
        <nav className="space-y-1">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors ${isActive
                            ? "bg-(--primary)/10 text-(--primary) border border-(--primary)/20 font-medium"
                            : "hover:bg-(--muted)/50 text-(--foreground) border border-transparent"
                            }`}
                    >
                        <Icon className={`w-5 h-5 mt-0.5 ${isActive ? "text-(--primary)" : "text-(--muted-foreground)"}`} />
                        <div>
                            <div className="text-sm font-semibold">{item.label}</div>
                            <div className="text-[11px] text-(--muted-foreground) leading-tight mt-0.5">
                                {item.description}
                            </div>
                        </div>
                    </button>
                );
            })}
        </nav>
    );
}