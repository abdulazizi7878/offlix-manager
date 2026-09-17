"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { fetchApi } from "../../lib/api/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth");

  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    login: "",
    password: "",
  });

  const getSafeRedirect = () => {
    const redirect = searchParams.get("redirect");

    if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) {
      return "/dashboard";
    }

    return redirect;
  };

  useEffect(() => {
    const reason = searchParams.get("reason");

    if (reason === "session-expired") {
      toast.warning(t("sessionExpiredTitle"), {
        description: t("sessionExpiredDesc"),
      });

      const params = new URLSearchParams(searchParams.toString());
      params.delete("reason");
      const query = params.toString();

      router.replace(query ? `/login?${query}` : "/login");
    }
  }, [searchParams, router, t]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((previous) => ({
        ...previous,
        [name]: null,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsLoading(true);
    setFieldErrors({});

    try {
      const response = await fetchApi("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (response.data?.requiresEmailVerification) {
        if (response.data?.user?.id) {
          sessionStorage.setItem(
            "offlix_verify_id",
            response.data.user.id
          );
        }

        toast.info(t("verifyEmailNotice"));
        router.push("/verify");
        return;
      }

      toast.success(t("signInSuccess"));
      const redirectTo = getSafeRedirect();
      router.push(redirectTo);
    } catch (error) {
      if (
        error?.code === "VALIDATION_ERROR" &&
        error?.fields
      ) {
        setFieldErrors(error.fields);
      } else {
        toast.error(
          error?.message || t("signInError")
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-[var(--card)] text-[var(--card-foreground)] border border-[var(--border)] rounded-xl shadow-sm">
      {/* Form Title */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold mb-2 text-[var(--foreground)]">
          {t("welcomeBack")}
        </h1>

        <p className="text-[var(--muted-foreground)]">
          {t("signInSubtitle")}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <Input
          label={t("loginLabel")}
          name="login"
          icon={Mail}
          value={formData.login}
          onChange={handleChange}
          error={fieldErrors.login}
          disabled={isLoading}
          placeholder={t("loginPlaceholder")}
          autoComplete="username"
          required
        />

        <Input
          label={t("passwordLabel")}
          name="password"
          type="password"
          icon={Lock}
          value={formData.password}
          onChange={handleChange}
          error={fieldErrors.password}
          disabled={isLoading}
          placeholder={t("passwordPlaceholder")}
          autoComplete="current-password"
          required
        />

        <Button
          type="submit"
          isLoading={isLoading}
        >
          {t("signInButton")}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
        {t("noAccount")}{" "}
        <Link
          href="/register"
          className="font-medium text-[var(--primary)] hover:underline focus:outline-none focus:ring-1 focus:ring-[var(--ring)] rounded-sm"
        >
          {t("registerHere")}
        </Link>
      </div>
    </div>
  );
}