// file: app/dashboard/branches/create/page.jsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";

export default function CreateBranchPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrors({ name: "Branch name is required." });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const res = await fetchApi("/api/v1/dashboard/branches", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      toast.success("Branch created successfully.");
      const newId = res.data?.branch?.id || res.data?.id;
      if (newId) {
        router.push(`/dashboard/branches/${newId}`);
      } else {
        router.push("/dashboard/branches");
      }
      router.refresh();
    } catch (err) {
      if (err.fields) {
        setErrors(err.fields);
      } else {
        toast.error(err.message || "Failed to create branch.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/branches"
          className="p-2 border border-(--border) rounded-lg text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted) transition-colors"
          aria-label="Back to branches"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Branch</h1>
          <p className="text-sm text-(--muted-foreground)">Add a new location to your business network.</p>
        </div>
      </div>

      <div className="bg-(--card) border border-(--border) rounded-xl p-6 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Branch Name"
            placeholder="e.g. Bole Main Branch"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (errors.name) setErrors({ ...errors, name: null });
            }}
            error={errors.name}
            disabled={isLoading}
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-(--foreground)">Description (Optional)</label>
            <textarea
              className="w-full px-3 py-2 bg-(--background) border border-(--border) rounded-lg text-sm text-(--foreground) focus:outline-none focus:ring-2 focus:ring-(--ring) min-h-[100px] resize-y"
              placeholder="Brief description of the location..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isLoading}
            />
            {errors.description && <p className="text-xs text-(--destructive)">{errors.description}</p>}
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-(--border)">
            <Link
              href="/dashboard/branches"
              className="px-4 py-2 border border-(--border) text-(--foreground) text-sm font-medium rounded-lg hover:bg-(--muted) transition-colors"
            >
              Cancel
            </Link>
            <Button type="submit" isLoading={isLoading}>
              Create Branch
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}