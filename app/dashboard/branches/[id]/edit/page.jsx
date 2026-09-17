// file: app/dashboard/branches/[id]/edit/page.jsx

"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { fetchApi } from "@/lib/api/client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function EditBranchPage({ params }) {
  const t = useTranslations("dashboard.editBranchPage");
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [errors, setErrors] = useState({});
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    async function loadBranch() {
      setIsLoading(true);
      try {
        const res = await fetchApi(`/api/v1/dashboard/branches/${id}`);
        const data = res.data?.branch || res.data;
        setFormData({
          name: data.name || "",
          description: data.description || "",
        });
      } catch (err) {
        setLoadError(err.message || t("loadError"));
      } finally {
        setIsLoading(false);
      }
    }
    if (id) loadBranch();
  }, [id, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrors({ name: t("requiredNameError") });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await fetchApi(`/api/v1/dashboard/branches/${id}`, {
        method: "PATCH",
        body: JSON.stringify(formData),
      });

      toast.success(t("updateSuccess"));
      router.push(`/dashboard/branches/${id}`);
      router.refresh();
    } catch (err) {
      if (err.fields) {
        setErrors(err.fields);
      } else {
        toast.error(err.message || t("updateError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="h-8 bg-[var(--muted)]/40 rounded-lg w-1/3 animate-pulse" />
        <div className="h-64 bg-[var(--muted)]/40 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-[var(--card)] border border-[var(--border)] rounded-xl text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-[var(--destructive)] mx-auto" />
        <h1 className="text-lg font-semibold">{t("unableToLoad")}</h1>
        <p className="text-xs text-[var(--muted-foreground)]">{loadError}</p>
        <Link
          href="/dashboard/branches"
          className="inline-block px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)]"
        >
          {t("backToBranches")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/branches/${id}`}
          className="p-2 border border-[var(--border)] rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          aria-label="Back to branch details"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{t("subtitle")}</p>
        </div>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t("branchNameLabel")}
            placeholder={t("branchNamePlaceholder")}
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (errors.name) setErrors({ ...errors, name: null });
            }}
            error={errors.name}
            disabled={isSubmitting}
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">
              {t("descriptionLabel")}
            </label>
            <textarea
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] min-h-[100px] resize-y"
              placeholder={t("descriptionPlaceholder")}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isSubmitting}
            />
            {errors.description && <p className="text-xs text-[var(--destructive)]">{errors.description}</p>}
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[var(--border)]">
            <Link
              href={`/dashboard/branches/${id}`}
              className="px-4 py-2 border border-[var(--border)] text-[var(--foreground)] text-sm font-medium rounded-lg hover:bg-[var(--muted)] transition-colors"
            >
              {t("cancel")}
            </Link>
            <Button type="submit" isLoading={isSubmitting}>
              {t("saveChanges")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}