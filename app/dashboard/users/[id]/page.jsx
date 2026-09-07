// file: app/dashboard/users/[id]/page.jsx

"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, AlertCircle, CheckCircle2, XCircle, Pencil } from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function UserDetailsPage({ params }) {
    const unwrappedParams = use(params);
    const id = unwrappedParams.id;
    const router = useRouter();

    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: "", phone: "", email: "" });
    const [formErrors, setFormErrors] = useState({});

    const fetchUserDetails = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetchApi(`/api/v1/dashboard/users/${id}`);
            const userData = res.data?.user || res.data;
            setUser(userData);
            setFormData({
                name: userData.name || "",
                phone: userData.phone || "",
                email: userData.email || "",
            });
        } catch (err) {
            setError(err.message || "Failed to load employee details.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchUserDetails();
    }, [id]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setFormErrors({ name: "Name is required." });
            return;
        }
        if (!formData.phone.trim()) {
            setFormErrors({ phone: "Phone is required." });
            return;
        }

        setIsSubmitting(true);
        setFormErrors({});

        try {
            const payload = {
                name: formData.name.trim(),
                phone: formData.phone.trim(),
            };
            if (formData.email !== undefined) {
                payload.email = formData.email.trim() || null;
            }

            const res = await fetchApi(`/api/v1/dashboard/users/${id}`, {
                method: "PATCH",
                body: JSON.stringify(payload),
            });

            toast.success("Employee updated successfully.");
            const updatedUser = res.data?.user || res.data;
            setUser(updatedUser);
            setIsEditing(false);
            router.refresh();
        } catch (err) {
            if (err.fields) {
                setFormErrors(err.fields);
            } else {
                toast.error(err.message || "Failed to update employee.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="h-8 bg-(--muted)/40 rounded-lg w-1/3 animate-pulse" />
                <div className="h-64 bg-(--muted)/40 rounded-xl animate-pulse" />
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="max-w-xl mx-auto p-6 bg-(--card) border border-(--border) rounded-xl text-center space-y-4">
                <AlertCircle className="w-10 h-10 text-(--destructive) mx-auto" />
                <h1 className="text-lg font-semibold">Unable to load employee</h1>
                <p className="text-xs text-(--muted-foreground)">{error || "Employee not found."}</p>
                <div className="flex items-center justify-center gap-3">
                    <Link
                        href="/dashboard/users"
                        className="px-4 py-2 border border-(--border) rounded-lg text-sm font-medium hover:bg-(--muted)"
                    >
                        Back to Employees
                    </Link>
                    <button
                        onClick={fetchUserDetails}
                        className="px-4 py-2 bg-(--primary) text-(--primary-foreground) rounded-lg text-sm font-medium hover:opacity-90"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const isVerified = Boolean(user.email_verified_at || user.is_verified);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/users"
                        className="p-2 border border-(--border) rounded-lg text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted) transition-colors"
                        aria-label="Back to employees"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
                        <p className="text-sm text-(--muted-foreground)">Employee account details and information.</p>
                    </div>
                </div>

                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 border border-(--border) bg-(--card) text-(--foreground) rounded-lg text-sm font-medium hover:bg-(--muted) transition-colors"
                    >
                        <Pencil className="w-4 h-4" />
                        <span>Edit Employee</span>
                    </button>
                )}
            </div>

            {!isEditing ? (
                <div className="bg-(--card) border border-(--border) rounded-xl p-6 shadow-xs space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Verification Status</span>
                            <div className="mt-1">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isVerified ? "bg-(--success)/10 text-(--success)" : "bg-(--muted) text-(--muted-foreground)"
                                    }`}>
                                    {isVerified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                    {isVerified ? "Verified" : "Unverified"}
                                </span>
                            </div>
                        </div>

                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Employee ID</span>
                            <p className="mt-1 text-sm font-mono">{user.id}</p>
                        </div>

                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Phone Number</span>
                            <p className="mt-1 text-sm font-mono">{user.phone}</p>
                        </div>

                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Email Address</span>
                            <p className="mt-1 text-sm">{user.email || "No email provided"}</p>
                        </div>

                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Created At</span>
                            <p className="mt-1 text-xs text-(--muted-foreground)">
                                {user.created_at ? new Date(user.created_at).toLocaleString() : "N/A"}
                            </p>
                        </div>

                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Updated At</span>
                            <p className="mt-1 text-xs text-(--muted-foreground)">
                                {user.updated_at ? new Date(user.updated_at).toLocaleString() : "N/A"}
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-(--card) border border-(--border) rounded-xl p-6 shadow-xs">
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <Input
                            label="Full Name"
                            value={formData.name}
                            onChange={(e) => {
                                setFormData({ ...formData, name: e.target.value });
                                if (formErrors.name) setFormErrors({ ...formErrors, name: null });
                            }}
                            error={formErrors.name}
                            disabled={isSubmitting}
                            required
                        />

                        <Input
                            label="Phone Number"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => {
                                setFormData({ ...formData, phone: e.target.value });
                                if (formErrors.phone) setFormErrors({ ...formErrors, phone: null });
                            }}
                            error={formErrors.phone}
                            disabled={isSubmitting}
                            required
                        />

                        <Input
                            label="Email Address"
                            type="email"
                            value={formData.email}
                            onChange={(e) => {
                                setFormData({ ...formData, email: e.target.value });
                                if (formErrors.email) setFormErrors({ ...formErrors, email: null });
                            }}
                            error={formErrors.email}
                            disabled={isSubmitting}
                        />

                        <div className="pt-4 flex items-center justify-end gap-3 border-t border-(--border)">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditing(false);
                                    setFormData({
                                        name: user.name || "",
                                        phone: user.phone || "",
                                        email: user.email || "",
                                    });
                                }}
                                className="px-4 py-2 border border-(--border) text-(--foreground) text-sm font-medium rounded-lg hover:bg-(--muted) transition-colors"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <Button type="submit" isLoading={isSubmitting}>
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}