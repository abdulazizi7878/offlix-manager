import { Suspense } from "react";

import SettingsPageClient from "./components/settings-page-client";

export default function SettingsPage() {
    return (
        <Suspense
            fallback={
                <div className="max-w-7xl mx-auto space-y-6 pb-16">
                    <div className="bg-(--card) border border-(--border) p-6 rounded-2xl shadow-xs">
                        <div className="h-7 w-32 bg-(--muted) rounded-lg animate-pulse" />
                        <div className="h-4 w-96 max-w-full bg-(--muted) rounded-lg mt-3 animate-pulse" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                        <div className="lg:col-span-1 bg-(--card) border border-(--border) rounded-2xl p-3 shadow-xs h-32 animate-pulse" />

                        <div className="lg:col-span-3 bg-(--card) border border-(--border) rounded-2xl shadow-xs h-96 animate-pulse" />
                    </div>
                </div>
            }
        >
            <SettingsPageClient />
        </Suspense>
    );
}