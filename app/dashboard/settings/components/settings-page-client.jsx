// file: app/dashboard/settings/components/settings-page-client.jsx

"use client";

import { useSearchParams, useRouter } from "next/navigation";

import SettingsNavigation from "./settings-navigation";
import AccountSettings from "./account-settings";
import OrganizationSettings from "./organization-settings";
import SecuritySettings from "./security-settings";

export default function SettingsPageClient() {
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
                <h1 className="text-2xl font-bold tracking-tight text-(--foreground)">
                    Settings
                </h1>

                <p className="text-sm text-(--muted-foreground) mt-1">
                    Manage your account details, organization structure,
                    branches, and security preferences.
                </p>
            </div>

            {/* Main Settings Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                {/* Navigation Sidebar - Fixed floating bug on small screens by changing sticky to lg:sticky */}
                <div className="lg:col-span-1 bg-(--card) border border-(--border) rounded-2xl p-3 shadow-xs lg:sticky lg:top-6">
                    <SettingsNavigation
                        activeTab={currentTab}
                        onTabChange={handleTabChange}
                    />
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3 space-y-6">
                    {currentTab === "account" && <AccountSettings />}

                    {currentTab === "organization" && (
                        <OrganizationSettings />
                    )}

                    {currentTab === "security" && <SecuritySettings />}
                </div>
            </div>
        </div>
    );
}