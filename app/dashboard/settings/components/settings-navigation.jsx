// file: app/dashboard/settings/components/settings-navigation.jsx

"use client";

import { User, Building2, Shield } from "lucide-react";

export default function SettingsNavigation({ activeTab, onTabChange }) {
    const navItems = [
        {
            id: "account",
            label: "Account",
            description: "Business, profile & subscription",
            icon: User,
        },
        {
            id: "organization",
            label: "Organization",
            description: "Branches, team & permissions",
            icon: Building2,
        },
        {
            id: "security",
            label: "Security",
            description: "Password, sessions & Auth",
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