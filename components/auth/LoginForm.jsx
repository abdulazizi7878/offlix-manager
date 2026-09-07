"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { fetchApi } from "../../lib/api/client";

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({ login: "", password: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFieldErrors({});

    try {
      await fetchApi("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      toast.success("Successfully signed in.");
      router.push("/dashboard");
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
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold mb-2 text-(--foreground)">Welcome Back</h1>
        <p className="text-(--muted-foreground)">Enter your details to sign in</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email, Username, or Phone"
          name="login"
          icon={Mail}
          value={formData.login}
          onChange={handleChange}
          error={fieldErrors.login}
          disabled={isLoading}
          placeholder="Enter your login"
          autoComplete="username"
          required
        />
        
        <Input
          label="Password"
          name="password"
          type="password"
          icon={Lock}
          value={formData.password}
          onChange={handleChange}
          error={fieldErrors.password}
          disabled={isLoading}
          placeholder="Enter your password"
          autoComplete="current-password"
          required
        />

        <Button type="submit" isLoading={isLoading}>
          Sign In
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-(--muted-foreground)">
        Don't have an account?{" "}
        <Link href="/register" className="font-medium text-(--primary) hover:underline focus:outline-none focus:ring-1 focus:ring-(--ring) rounded-sm">
          Register here
        </Link>
      </div>
    </div>
  );
}