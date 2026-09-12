"use client";

import { useState, useEffect } from "react";

import { useRouter } from "next/navigation";

import { KeyRound } from "lucide-react";

import { toast } from "sonner";

import { Input } from "../ui/Input";

import { Button } from "../ui/Button";

import { fetchApi } from "../../lib/api/client";

export function VerifyForm() {
    const router = useRouter();

    const [userId, setUserId] = useState(null);
    const [verificationPurpose, setVerificationPurpose] =
        useState("registration");
    const [verificationToken, setVerificationToken] =
        useState(null);

    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);

    const [otp, setOtp] = useState("");
    const [error, setError] = useState(null);

    const [cooldown, setCooldown] = useState(60);

    useEffect(() => {
        const storedId =
            sessionStorage.getItem("offlix_verify_id");

        if (!storedId) {
            toast.error(
                "Verification session expired. Please sign in again."
            );

            router.push("/login");
            return;
        }

        const storedPurpose =
            sessionStorage.getItem(
                "offlix_verify_purpose"
            ) || "registration";

        const storedToken =
            sessionStorage.getItem(
                "offlix_email_change_token"
            );

        if (
            storedPurpose === "email_change" &&
            !storedToken
        ) {
            toast.error(
                "Email verification session expired. Please try again."
            );

            sessionStorage.removeItem("offlix_verify_id");
            sessionStorage.removeItem(
                "offlix_verify_purpose"
            );

            router.push("/dashboard/settings");
            return;
        }

        setUserId(storedId);
        setVerificationPurpose(storedPurpose);

        if (storedPurpose === "email_change") {
            setVerificationToken(storedToken);
        }
    }, [router]);

    useEffect(() => {
        if (cooldown <= 0) return;

        const timer = setInterval(() => {
            setCooldown((prev) =>
                prev > 0 ? prev - 1 : 0
            );
        }, 1000);

        return () => clearInterval(timer);
    }, [cooldown]);

    const isEmailChange =
        verificationPurpose === "email_change";

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (otp.length !== 6) {
            setError(
                "OTP must be exactly 6 digits."
            );
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            if (isEmailChange) {
                await fetchApi(
                    "/api/v1/settings/account/email/verify",
                    {
                        method: "POST",
                        body: JSON.stringify({
                            userId,
                            otp,
                            verificationToken,
                        }),
                    }
                );

                sessionStorage.removeItem(
                    "offlix_verify_id"
                );

                sessionStorage.removeItem(
                    "offlix_verify_purpose"
                );

                sessionStorage.removeItem(
                    "offlix_email_change_token"
                );

                toast.success(
                    "Email address updated successfully."
                );

                router.push(
                    "/dashboard/settings"
                );

                return;
            }

            await fetchApi(
                "/api/v1/auth/otp/verify",
                {
                    method: "POST",
                    body: JSON.stringify({
                        userId,
                        otp,
                    }),
                }
            );

            sessionStorage.removeItem(
                "offlix_verify_id"
            );

            sessionStorage.removeItem(
                "offlix_verify_purpose"
            );

            sessionStorage.removeItem(
                "offlix_email_change_token"
            );

            toast.success(
                "Verification successful."
            );

            router.push("/dashboard");
        } catch (err) {
            setError(
                err.fields?.otp ||
                    err.message ||
                    "Verification failed."
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setIsResending(true);
        setError(null);

        try {
            if (isEmailChange) {
                await fetchApi(
                    "/api/v1/settings/account/email/resend",
                    {
                        method: "POST",
                        body: JSON.stringify({
                            userId,
                            verificationToken,
                        }),
                    }
                );
            } else {
                await fetchApi(
                    "/api/v1/auth/otp/resend",
                    {
                        method: "POST",
                        body: JSON.stringify({
                            userId,
                        }),
                    }
                );
            }

            toast.success(
                "A new code has been sent."
            );

            setCooldown(60);
        } catch (err) {
            if (
                err.code ===
                "OTP_RESEND_COOLDOWN"
            ) {
                const matches =
                    err.message?.match(/\d+/);

                const seconds = matches
                    ? parseInt(matches[0], 10)
                    : 60;

                setCooldown(seconds);
            }

            toast.error(
                err.message ||
                    "Failed to resend verification code."
            );
        } finally {
            setIsResending(false);
        }
    };

    if (!userId) return null;

    return (
        <div className="w-full max-w-md mx-auto p-6 bg-(--card) text-(--card-foreground) border border-(--border) rounded-xl shadow-sm">
            <div className="mb-6 text-center">
                <div className="mx-auto w-12 h-12 bg-(--muted) rounded-full flex items-center justify-center mb-4">
                    <KeyRound className="w-6 h-6 text-(--primary)" />
                </div>

                <h1 className="text-2xl font-bold mb-2 text-(--foreground)">
                    {isEmailChange
                        ? "Verify New Email"
                        : "Verification Required"}
                </h1>

                <p className="text-(--muted-foreground)">
                    {isEmailChange
                        ? "Enter the 6-digit code sent to your new email address"
                        : "Enter the 6-digit code sent to your device"}
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="space-y-6"
            >
                <Input
                    label="Verification Code"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                        setOtp(
                            e.target.value.replace(
                                /\D/g,
                                ""
                            )
                        );

                        if (error) {
                            setError(null);
                        }
                    }}
                    error={error}
                    disabled={
                        isLoading ||
                        isResending
                    }
                    placeholder="123456"
                    required
                />

                <div className="space-y-3">
                    <Button
                        type="submit"
                        isLoading={isLoading}
                    >
                        Verify Code
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleResend}
                        isLoading={isResending}
                        disabled={
                            isResending ||
                            cooldown > 0
                        }
                    >
                        {cooldown > 0
                            ? `Resend Code in ${ cooldown } s`
                            : "Resend Code"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
