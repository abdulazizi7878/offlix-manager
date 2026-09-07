"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Phone, Lock, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { fetchApi } from "../../lib/api/client";

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    accountName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    if (formData.password !== formData.confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match." });
      return;
    }

    setIsLoading(true);

    try {
      const { confirmPassword, ...submitData } = formData;
      const response = await fetchApi("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify(submitData),
      });

      // Safely pass context to the OTP screen without touching the URL
      if (response.data?.user?.id) {
        sessionStorage.setItem("offlix_verify_id", response.data.user.id);
      }
      
      toast.success("Account created successfully. Please verify your email.");
      router.push("/verify");
    } catch (error) {
      if (error.code === "VALIDATION_ERROR" && error.fields) {
        setFieldErrors(error.fields);
      } else {
        toast.error(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-(--card) text-(--card-foreground) border border-(--border) rounded-xl shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold mb-2 text-(--foreground)">Create Account</h1>
        <p className="text-(--muted-foreground)">Set up your manager account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Full Name" name="name" icon={User} value={formData.name} onChange={handleChange} error={fieldErrors.name} disabled={isLoading} required />
        <Input label="Business Account Name" name="accountName" icon={Building2} value={formData.accountName} onChange={handleChange} error={fieldErrors.accountName} disabled={isLoading} required />
        <Input label="Email Address" type="email" name="email" icon={Mail} value={formData.email} onChange={handleChange} error={fieldErrors.email} disabled={isLoading} required />
        <Input label="Phone Number" type="tel" name="phone" icon={Phone} value={formData.phone} onChange={handleChange} error={fieldErrors.phone} disabled={isLoading} required />
        <Input label="Password" type="password" name="password" icon={Lock} value={formData.password} onChange={handleChange} error={fieldErrors.password} disabled={isLoading} required />
        <Input label="Confirm Password" type="password" name="confirmPassword" icon={Lock} value={formData.confirmPassword} onChange={handleChange} error={fieldErrors.confirmPassword} disabled={isLoading} required />

        <Button type="submit" isLoading={isLoading} className="mt-2">
          Create Account
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-(--muted-foreground)">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-(--primary) hover:underline focus:outline-none focus:ring-1 focus:ring-(--ring) rounded-sm">
          Sign in
        </Link>
      </div>
    </div>
  );
}