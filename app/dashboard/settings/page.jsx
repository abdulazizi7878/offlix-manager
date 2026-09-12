// file: app/dashboard/settings/page.jsx

"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { User, Building2, Shield, Sliders } from "lucide-react";
import SettingsNavigation from "./components/settings-navigation";
import AccountSettings from "./components/account-settings";
import OrganizationSettings from "./components/organization-settings";
import SecuritySettings from "./components/security-settings";

export default function SettingsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentTab = searchParams.get("tab") || "account";

    const handleTabChange = (tabId) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tabId);
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-16">
            {/* Page Header */}
            <div className="bg-(--card) border border-(--border) p-6 rounded-2xl shadow-xs">
                <h1 className="text-2xl font-bold tracking-tight text-(--foreground)">Settings</h1>
                <p className="text-sm text-(--muted-foreground) mt-1">
                    Manage your account details, organization structure, branches, and security preferences.
                </p>
            </div>

            {/* Main Settings Layout with Navigation and Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                {/* Navigation Sidebar / Tabs */}
                <div className="lg:col-span-1 bg-(--card) border border-(--border) rounded-2xl p-3 shadow-xs sticky top-6">
                    <SettingsNavigation activeTab={currentTab} onTabChange={handleTabChange} />
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3 space-y-6">
                    {currentTab === "account" && <AccountSettings />}
                    {currentTab === "organization" && <OrganizationSettings />}
                    {currentTab === "security" && <SecuritySettings />}
                </div>
            </div>
        </div>
    );
}