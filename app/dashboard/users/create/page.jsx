// file: app/dashboard/users/create/page.jsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Key, Copy, Check, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";

export default function CreateUserPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ name: "", phone: "", email: "" });
    const [errors, setErrors] = useState({});
    const [createdResult, setCreatedResult] = useState(null);
    const [copied, setCopied] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setErrors({ name: "Name is required." });
            return;
        }
        if (!formData.phone.trim()) {
            setErrors({ phone: "Phone number is required." });
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            const payload = {
                name: formData.name.trim(),
                phone: formData.phone.trim(),
            };
            if (formData.email.trim()) {
                payload.email = formData.email.trim();
            }

            const res = await fetchApi("/api/v1/dashboard/users", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            toast.success("Employee created successfully.");
            const userData = res.data?.user || res.data?.employee || res.data;
            const tempPassword = res.data?.temporaryPassword || res.data?.tempPassword || res.data?.password;

            setCreatedResult({
                user: userData,
                temporaryPassword: tempPassword,
            });
            router.refresh();
        } catch (err) {
            if (err.fields) {
                setErrors(err.fields);
            } else {
                toast.error(err.message || "Failed to create employee.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyPassword = () => {
        if (createdResult?.temporaryPassword) {
            navigator.clipboard.writeText(createdResult.temporaryPassword);
            setCopied(true);
            toast.success("Temporary password copied to clipboard.");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (createdResult) {
        return (
            <div className="max-w-xl mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/users"
                        className="p-2 border border-(--border) rounded-lg text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted) transition-colors"
                        aria-label="Back to employees"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Employee Created Successfully</h1>
                        <p className="text-sm text-(--muted-foreground)">Account details and temporary credentials.</p>
                    </div>
                </div>

                <div className="bg-(--card) border border-(--border) rounded-xl p-6 shadow-xs space-y-6">
                    <div className="p-4 bg-(--warning)/10 border border-(--warning)/20 rounded-xl flex items-start gap-3 text-(--warning-foreground, --foreground)">
                        <ShieldAlert className="w-5 h-5 text-(--warning) shrink-0 mt-0.5" />
                        <div className="space-y-1 text-xs">
                            <p className="font-semibold text-sm">Save this temporary password</p>
                            <p className="text-(--muted-foreground)">
                                This temporary password will only be shown once. Provide it securely to the employee. They should change it upon their first login.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Employee Name</span>
                            <p className="text-sm font-medium mt-0.5">{createdResult.user?.name}</p>
                        </div>

                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Phone Number</span>
                            <p className="text-sm font-mono mt-0.5">{createdResult.user?.phone}</p>
                        </div>

                        {createdResult.user?.email && (
                            <div>
                                <span className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Email Address</span>
                                <p className="text-sm mt-0.5">{createdResult.user?.email}</p>
                            </div>
                        )}

                        {createdResult.temporaryPassword && (
                            <div className="p-4 bg-(--muted)/50 border border-(--border) rounded-xl space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Generated Temporary Password</span>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="font-mono text-base font-bold bg-(--background) px-3 py-1.5 border border-(--border) rounded-lg select-all">
                                        {createdResult.temporaryPassword}
                                    </span>
                                    <button
                                        onClick={handleCopyPassword}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
                                    >
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        <span>{copied ? "Copied" : "Copy Password"}</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-(--border) flex items-center justify-between">
                        <Link
                            href="/dashboard/users"
                            className="px-4 py-2 border border-(--border) rounded-lg text-sm font-medium hover:bg-(--muted) transition-colors"
                        >
                            Return to Employees list
                        </Link>
                        <Link
                            href={`/dashboard/users/${createdResult.user?.id || ""}`}
                            className="px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                            View Employee Details
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Link
                    href="/dashboard/users"
                    className="p-2 border border-(--border) rounded-lg text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted) transition-colors"
                    aria-label="Back to employees"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Add Employee</h1>
                    <p className="text-sm text-(--muted-foreground)">Create a new employee account for your business.</p>
                </div>
            </div>

            <div className="bg-(--card) border border-(--border) rounded-xl p-6 shadow-xs">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Full Name"
                        placeholder="e.g. Abebe Kebede"
                        value={formData.name}
                        onChange={(e) => {
                            setFormData({ ...formData, name: e.target.value });
                            if (errors.name) setErrors({ ...errors, name: null });
                        }}
                        error={errors.name}
                        disabled={isLoading}
                        required
                    />

                    <Input
                        label="Phone Number"
                        placeholder="e.g. 0912345678"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => {
                            setFormData({ ...formData, phone: e.target.value });
                            if (errors.phone) setErrors({ ...errors, phone: null });
                        }}
                        error={errors.phone}
                        disabled={isLoading}
                        required
                    />

                    <Input
                        label="Email Address (Optional)"
                        placeholder="e.g. abebe@example.com"
                        type="email"
                        value={formData.email}
                        onChange={(e) => {
                            setFormData({ ...formData, email: e.target.value });
                            if (errors.email) setErrors({ ...errors, email: null });
                        }}
                        error={errors.email}
                        disabled={isLoading}
                    />

                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-(--border)">
                        <Link
                            href="/dashboard/users"
                            className="px-4 py-2 border border-(--border) text-(--foreground) text-sm font-medium rounded-lg hover:bg-(--muted) transition-colors"
                        >
                            Cancel
                        </Link>
                        <Button type="submit" isLoading={isLoading}>
                            Create Employee
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}