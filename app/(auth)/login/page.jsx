// file: app/(auth)/login/page.jsx

import { Suspense } from "react";
import { LoginForm } from "../../../components/auth/LoginForm";

export const metadata = {
  title: "Sign In - Offlix Manager",
  description: "Sign in to access your Offlix Manager dashboard.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-(--background)">
          <div className="w-8 h-8 border-2 border-(--border) border-t-(--primary) rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}