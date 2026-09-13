"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import Link from "next/link";

import {
  User,
  Mail,
  Phone,
  Lock,
  Building2,
} from "lucide-react";

import { toast } from "sonner";

import { Input } from "../ui/Input";

import { Button } from "../ui/Button";

import { fetchApi } from "../../lib/api/client";

export function RegisterForm() {
  const router = useRouter();

  const [isLoading, setIsLoading] =
    useState(false);

  const [fieldErrors, setFieldErrors] =
    useState({});

  const [emailSuggestion, setEmailSuggestion] =
    useState(null);

  const [formData, setFormData] = useState({
    name: "",
    accountName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const suggestEmailCorrection = (email) => {
    const value =
      email.trim().toLowerCase();

    const corrections = {
      // Gmail domain ending mistakes
      "gmail.con": "gmail.com",
      "gmail.co": "gmail.com",
      "gmail.cmo": "gmail.com",
      "gmail.comm": "gmail.com",
      "gmail.om": "gmail.com",
      "gmail.cm": "gmail.com",
      "gmail.c": "gmail.com",
      "gmail.co": "gmail.com",
      "gmail.xom": "gmail.com",
      "gmail.vom": "gmail.com",
      "gmail.ncom": "gmail.com",
      "gmail.comn": "gmail.com",
      "gmail.commm": "gmail.com",

      // Gmail spelling mistakes
      "gmial.com": "gmail.com",
      "gamil.com": "gmail.com",
      "gnail.com": "gmail.com",
      "gmai.com": "gmail.com",
      "gmal.com": "gmail.com",
      "gimail.com": "gmail.com",
      "gimail.co": "gmail.com",
      "gmaiil.com": "gmail.com",
      "gmaill.com": "gmail.com",
      "gmaile.com": "gmail.com",
      "gmail.co": "gmail.com",
      "gmailcom": "gmail.com",

      // Common letter swaps / keyboard mistakes
      "gmali.com": "gmail.com",
      "gmial.co": "gmail.com",
      "gamil.co": "gmail.com",
      "gmal.co": "gmail.com",
      "gmai.co": "gmail.com",
      "gmaill.co": "gmail.com",
      "gmaol.com": "gmail.com",
      "gmaol.co": "gmail.com",
      "gmqil.com": "gmail.com",
      "gmsil.com": "gmail.com",
      "gmaol.com": "gmail.com",

      // Common country/domain confusion
      "gmail.cm": "gmail.com",
      "gmail.co": "gmail.com",
      "gmail.in": "gmail.com",
      "gmail.net": "gmail.com",
      "gmail.org": "gmail.com",
    };

    const atIndex =
      value.lastIndexOf("@");

    if (atIndex === -1) {
      return null;
    }

    const domain =
      value.slice(atIndex + 1);

    const correctedDomain =
      corrections[domain];

    if (!correctedDomain) {
      return null;
    }

    return (
      `${value.slice(0, atIndex + 1)}` +
      correctedDomain
    );
  };

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }

    if (name === "email") {
      const suggestion =
        suggestEmailCorrection(value);

      setEmailSuggestion(
        suggestion &&
          suggestion !==
          value.trim().toLowerCase()
          ? suggestion
          : null
      );
    }
  };

  const handleUseEmailSuggestion = () => {
    if (!emailSuggestion) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      email: emailSuggestion,
    }));

    setEmailSuggestion(null);

    setFieldErrors((prev) => ({
      ...prev,
      email: null,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setFieldErrors({});

    if (
      formData.password !==
      formData.confirmPassword
    ) {
      setFieldErrors({
        confirmPassword:
          "Passwords do not match.",
      });

      return;
    }

    setIsLoading(true);

    try {
      const {
        confirmPassword,
        ...submitData
      } = formData;

      const response = await fetchApi(
        "/api/v1/auth/register",
        {
          method: "POST",
          body: JSON.stringify(
            submitData
          ),
        }
      );

      if (response.data?.user?.id) {
        sessionStorage.setItem(
          "offlix_verify_id",
          response.data.user.id
        );
      }

      toast.success(
        "Account created successfully. Please verify your email."
      );

      router.push("/verify");
    } catch (error) {
      if (
        error.code ===
        "VALIDATION_ERROR" &&
        error.fields
      ) {
        setFieldErrors(
          error.fields
        );
      } else {
        toast.error(
          error.message
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-(--card) text-(--card-foreground) border border-(--border) rounded-xl shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold mb-2 text-(--foreground)">
          Create Account
        </h1>

        <p className="text-(--muted-foreground)">
          Set up your manager account
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <Input
          label="Full Name"
          name="name"
          icon={User}
          value={formData.name}
          onChange={handleChange}
          error={fieldErrors.name}
          disabled={isLoading}
          required
        />

        <Input
          label="Business Account Name"
          name="accountName"
          icon={Building2}
          value={formData.accountName}
          onChange={handleChange}
          error={fieldErrors.accountName}
          disabled={isLoading}
          required
        />

        <div>
          <Input
            label="Email Address"
            type="email"
            name="email"
            icon={Mail}
            value={formData.email}
            onChange={handleChange}
            error={fieldErrors.email}
            disabled={isLoading}
            required
          />

          {emailSuggestion && (
            <div className="mt-2 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900 dark:border-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-200">
              <p>
                Did you mean{" "}
                <strong>
                  {emailSuggestion}
                </strong>
                ?
              </p>

              <button
                type="button"
                onClick={
                  handleUseEmailSuggestion
                }
                disabled={isLoading}
                className="mt-2 font-medium underline underline-offset-2 hover:no-underline disabled:opacity-50"
              >
                Use this email
              </button>
            </div>
          )}
        </div>

        <Input
          label="Phone Number"
          type="tel"
          name="phone"
          icon={Phone}
          value={formData.phone}
          onChange={handleChange}
          error={fieldErrors.phone}
          disabled={isLoading}
          required
        />

        <Input
          label="Password"
          type="password"
          name="password"
          icon={Lock}
          value={formData.password}
          onChange={handleChange}
          error={fieldErrors.password}
          disabled={isLoading}
          required
        />

        <Input
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          icon={Lock}
          value={formData.confirmPassword}
          onChange={handleChange}
          error={
            fieldErrors.confirmPassword
          }
          disabled={isLoading}
          required
        />

        <Button
          type="submit"
          isLoading={isLoading}
          className="mt-2"
        >
          Create Account
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-(--muted-foreground)">
        Already have an account?{" "}

        <Link
          href="/login"
          className="font-medium text-(--primary) hover:underline focus:outline-none focus:ring-1 focus:ring-(--ring) rounded-sm"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}