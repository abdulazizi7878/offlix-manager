// file: app/dashboard/money/accounts/[moneyAccountId]/page.jsx

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Wallet, ArrowLeft, Landmark, Smartphone, CreditCard, CheckCircle2, XCircle, AlertCircle, Save } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";

export default function MoneyAccountDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const moneyAccountId = params.moneyAccountId;

    const [account, setAccount] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        type: "cash",
        is_active: true
    });

    useEffect(() => {
        const loadAccount = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetchApi(`/api/v1/dashboard/money/accounts/${moneyAccountId}`);
                const accData = res.data || res;
                setAccount(accData);
                setFormData({
                    name: accData.name || "",
                    type: accData.type || "cash",
                    is_active: accData.is_active ?? true
                });
            } catch (err) {
                setError(err.message || "Failed to load account details.");
                toast.error("Failed to load account details");
            } finally {
                setIsLoading(false);
            }
        };
        if (moneyAccountId) loadAccount();
    }, [moneyAccountId]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await fetchApi(`/api/v1/dashboard/money/accounts/${moneyAccountId}`, {
                method: "PATCH",
                body: JSON.stringify(formData)
            });
            toast.success("Account updated successfully");
            router.push("/dashboard/money/accounts");
        } catch (err) {
            toast.error(err.message || "Failed to update account");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="space-y-6 animate-pulse p-8"><div className="h-48 bg-(--card) rounded-xl" /></div>;
    }

    if (error) {
        return (
            <div className="p-12 text-center bg-(--card) border border-(--border) rounded-xl space-y-4">
                <AlertCircle className="w-10 h-10 text-(--destructive) mx-auto" />
                <p className="text-sm font-semibold">{error}</p>
                <Link href="/dashboard/money/accounts" className="inline-block px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-sm">Back to Accounts</Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-between pb-6 border-b border-(--border)">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/money/accounts" className="p-2 border border-(--border) rounded-lg hover:bg-(--muted) transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Edit Account</h1>
                        <p className="text-sm text-(--muted-foreground)">Manage account information and status.</p>
                    </div>
                </div>
            </div>

            <div className="bg-(--card) border border-(--border) rounded-xl p-6 shadow-xs space-y-6">
                <div className="flex items-center justify-between p-4 bg-(--muted)/30 rounded-lg border border-(--border)">
                    <div>
                        <p className="text-xs uppercase font-semibold text-(--muted-foreground)">Derived Balance</p>
                        <p className="text-2xl font-bold mt-1">
                            {Number(account?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-normal text-(--muted-foreground)">ETB</span>
                        </p>
                    </div>
                    <div className="p-3 bg-(--primary)/10 text-(--primary) rounded-xl">
                        <Wallet className="w-6 h-6" />
                    </div>
                </div>

                <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Account Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary)"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Account Type</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--card) text-(--foreground) focus:outline-none focus:border-(--primary)"
                        >
                            <option value="cash">Cash</option>
                            <option value="bank">Bank</option>
                            <option value="mobile_money">Mobile Money</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="rounded border-(--border) text-(--primary) focus:ring-(--ring)"
                        />
                        <label htmlFor="is_active" className="text-sm font-medium">Active Account</label>
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-(--border)">
                        <Link href="/dashboard/money/accounts" className="px-4 py-2 border border-(--border) rounded-lg text-sm font-medium hover:bg-(--muted) transition-colors">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-sm font-medium hover:opacity-95 transition-opacity disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}