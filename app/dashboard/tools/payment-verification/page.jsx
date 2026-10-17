"use client";

import { useEffect, useState, useRef, useCallback, useId } from "react";
import {
    Camera,
    Upload,
    PenLine,
    ShieldCheck,
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    RefreshCw,
    CameraOff,
    ExternalLink,
    Lock,
    X,
    Clock,
    ArrowRight,
    Building2,
    User,
    Store,
    Receipt,
} from "lucide-react";
import { fetchApi } from "@/lib/api/client";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

// Cheki supported banks & wallets
const CHEKI_BANKS = [
    { code: "cbe", name: "Commercial Bank of Ethiopia (CBE)", needsAccount: false },
    { code: "telebirr", name: "Telebirr (Ethio telecom)", needsAccount: false },
    { code: "boa", name: "Bank of Abyssinia (BOA)", needsAccount: true },
    { code: "mpesa", name: "Safaricom M-Pesa", needsAccount: false },
    { code: "dashen", name: "Dashen Bank", needsAccount: false },
    { code: "awash", name: "Awash Bank", needsAccount: false },
    { code: "siinqee", name: "Siinqee Bank", needsAccount: false },
    { code: "ebirr", name: "eBirr", needsAccount: false },
    { code: "zamzam", name: "ZamZam Bank", needsAccount: false },
];

export default function PaymentVerificationPage() {
    const fileInputId = useId();

    // Bank Selector state
    const [selectedBank, setSelectedBank] = useState(""); // "" = Auto-Detect

    // Camera states & refs
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const animFrameRef = useRef(null);

    // Image Upload state
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [uploadError, setUploadError] = useState(null);

    // Verification progress
    const [isVerifying, setIsVerifying] = useState(false);

    // Pending Verification (Used when receiving account number is required, e.g. BOA)
    const [pendingVerification, setPendingVerification] = useState(null);
    const [accountPromptValue, setAccountPromptValue] = useState("");
    const [accountPromptError, setAccountPromptError] = useState(null);

    // Manual Entry Modal
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [manualBank, setManualBank] = useState("");
    const [manualReference, setManualReference] = useState("");
    const [manualAccount, setManualAccount] = useState("");
    const [manualError, setManualError] = useState(null);

    // Final Outcome Modal
    const [outcomeModal, setOutcomeModal] = useState(null);

    // Stop camera stream cleanly
    const stopCamera = useCallback(() => {
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
    }, []);

    useEffect(() => {
        return () => stopCamera();
    }, [stopCamera]);

    // Parse scanned text or URLs to detect Bank and Reference
    const parseScannedData = (rawText) => {
        const text = String(rawText || "").trim();
        let detectedRef = text;
        let detectedBank = selectedBank || ""; // prioritize manually chosen bank

        // 1. Check for Bank of Abyssinia (BOA) encrypted QR or endpoint URL
        if (
            text.startsWith("U2FsdGVkX1") || // CryptoJS AES-256 standard header used by BOA
            text.includes("bankofabyssinia.com") ||
            text.includes("onlineSlip") ||
            text.toLowerCase().includes("boa")
        ) {
            detectedBank = "boa";
        }
        // 2. Check for CBE
        else if (
            text.includes("cbe.com.et") ||
            text.includes("mbreciept") ||
            text.startsWith("FT")
        ) {
            detectedBank = detectedBank || "cbe";
        }
        // 3. Telebirr
        else if (
            text.includes("ethiotelecom.et") ||
            text.includes("telebirr")
        ) {
            detectedBank = detectedBank || "telebirr";
        }
        // 4. Safaricom M-Pesa
        else if (text.includes("safaricom.et") || text.includes("m-pesa")) {
            detectedBank = detectedBank || "mpesa";
        }
        // 5. Dashen Bank
        else if (text.includes("dashenbanksc.com") || text.includes("dashen")) {
            detectedBank = detectedBank || "dashen";
        }
        // 6. Awash Bank
        else if (text.includes("awashbank.com") || text.includes("awashpay")) {
            detectedBank = detectedBank || "awash";
        }
        // 7. Siinqee / eBirr
        else if (text.includes("ebirr.com/siinqee")) {
            detectedBank = detectedBank || "siinqee";
        } else if (text.includes("ebirr.com")) {
            detectedBank = detectedBank || "ebirr";
        }
        // 8. ZamZam
        else if (text.includes("zamzambank.com.et")) {
            detectedBank = detectedBank || "zamzam";
        }

        return { reference: detectedRef, bank: detectedBank };
    };

    // Recency / Freshness calculation with relative time formatting
    const getFreshnessScore = (dateString) => {
        if (!dateString) return null;

        const date = dayjs(dateString);
        if (!date.isValid()) return null;

        const now = dayjs();
        const diffSeconds = Math.max(0, now.diff(date, "second"));
        const diffMinutes = Math.floor(diffSeconds / 60);

        const relativeTimeStr = date.fromNow();
        const formattedDateStr = date.format("MMM D, YYYY, h:mm A");

        if (diffSeconds < 60) {
            return {
                level: "fresh",
                color: "emerald",
                label: `Just now (${diffSeconds}s ago)`,
                relative: relativeTimeStr,
                formatted: formattedDateStr,
                description: "Instant Payment — Confirmed seconds ago.",
                badgeClass: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
            };
        }

        if (diffMinutes <= 10) {
            return {
                level: "recent",
                color: "teal",
                label: `${diffMinutes}m ago (${relativeTimeStr})`,
                relative: relativeTimeStr,
                formatted: formattedDateStr,
                description: "Recent Payment — Completed within the last 10 minutes.",
                badgeClass: "bg-teal-500/15 text-teal-500 border-teal-500/30",
            };
        }

        if (diffMinutes < 60) {
            return {
                level: "moderate",
                color: "amber",
                label: `${relativeTimeStr} (${formattedDateStr})`,
                relative: relativeTimeStr,
                formatted: formattedDateStr,
                description: "Earlier Today — Verify that this matches the customer's current order.",
                badgeClass: "bg-amber-500/15 text-amber-500 border-amber-500/30",
            };
        }

        return {
            level: "old",
            color: "rose",
            label: `${date.format("MMM D, YYYY")} (${relativeTimeStr})`,
            relative: relativeTimeStr,
            formatted: formattedDateStr,
            description: "Old Payment Alert — Handed over days or months ago. Verify before releasing goods!",
            badgeClass: "bg-rose-500/15 text-rose-500 border-rose-500/30",
        };
    };

    // Primary Verification API Request
    const executeVerification = async ({ reference, bank, accountNumber }) => {
        setIsVerifying(true);
        setUploadError(null);
        setCameraError(null);

        const targetBank = bank || selectedBank;
        const payload = { reference: reference.trim() };
        if (targetBank) payload.bank = targetBank;
        if (accountNumber) payload.accountNumber = accountNumber.trim();

        try {
            const res = await fetchApi("/api/v1/dashboard/tools/payment-verification", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            // Normalize payload to handle all possible field casings from Cheki / backend
            const root = res?.data?.data || res?.data || res;
            const statusUpper = String(root?.status || "").toUpperCase();

            const details = {
                ...root,
                senderName:
                    root?.senderName ||
                    root?.sender_name ||
                    root?.sender ||
                    root?.payer ||
                    root?.payerName ||
                    root?.from ||
                    null,
                receiverName:
                    root?.receiverName ||
                    root?.receiver_name ||
                    root?.receiver ||
                    root?.payee ||
                    root?.payeeName ||
                    root?.to ||
                    null,
                amount: root?.amount ?? root?.totalAmount ?? root?.total_amount,
                currency: root?.currency || "ETB",
                reference:
                    root?.reference ||
                    root?.ref ||
                    root?.txnId ||
                    root?.transactionId ||
                    reference,
                bank:
                    root?.bank ||
                    root?.bankName ||
                    root?.bank_name ||
                    CHEKI_BANKS.find((b) => b.code === targetBank)?.name ||
                    targetBank,
                date:
                    root?.date ||
                    root?.timestamp ||
                    root?.createdAt ||
                    root?.created_at ||
                    root?.time ||
                    null,
                sourceUrl: root?.sourceUrl || root?.source_url || root?.receiptUrl || root?.url || null,
            };

            if (statusUpper === "DUPLICATE") {
                setOutcomeModal({
                    type: "DUPLICATE",
                    message: root?.message || "This receipt reference has already been verified in an earlier transaction.",
                    details,
                });
            } else if (root?.verified === true) {
                setOutcomeModal({
                    type: "VERIFIED",
                    message: root?.message || "Transaction confirmed by official bank records.",
                    details,
                });
            } else {
                setOutcomeModal({
                    type: "NOT_VERIFIED",
                    message: root?.message || "Bank record not found or unconfirmed by provider.",
                    details,
                });
            }
        } catch (err) {
            const httpStatus = err?.status || err?.statusCode || 0;
            if (httpStatus === 429) {
                setOutcomeModal({
                    type: "ERROR",
                    message: "Rate limit reached (30 verifications/minute). Please wait a moment before trying again.",
                });
            } else {
                setOutcomeModal({
                    type: "ERROR",
                    message: err?.message || "Verification request failed. Check bank connection.",
                });
            }
        } finally {
            setIsVerifying(false);
            setPendingVerification(null);
            setAccountPromptValue("");
        }
    };

    // Intake candidate reference and check if secondary input (like BOA account number) is needed
    const processCandidateReference = (rawReference, detectedBank = "") => {
        const trimmed = String(rawReference || "").trim();
        if (!trimmed) return;

        const targetBank = detectedBank || selectedBank;

        // If provider is Bank of Abyssinia, it strictly requires the account number
        if (targetBank === "boa") {
            setPendingVerification({ reference: trimmed, bank: "boa" });
            return;
        }

        executeVerification({ reference: trimmed, bank: targetBank });
    };

    // 1. Camera Scanner
    const startCamera = async () => {
        setCameraError(null);
        setUploadError(null);

        try {
            const jsqrModule = await import("jsqr");
            const jsQR = jsqrModule.default || jsqrModule;

            if (!navigator?.mediaDevices?.getUserMedia) {
                throw new Error("Camera is not supported on this browser or connection.");
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment", width: { ideal: 1280 } },
                audio: false,
            });

            streamRef.current = stream;
            setIsCameraActive(true);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().catch(() => { });

                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d", { willReadFrequently: true });

                    const scanLoop = () => {
                        if (!videoRef.current || videoRef.current.readyState < 2) {
                            animFrameRef.current = requestAnimationFrame(scanLoop);
                            return;
                        }

                        canvas.width = videoRef.current.videoWidth;
                        canvas.height = videoRef.current.videoHeight;
                        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

                        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const code = jsQR(imgData.data, imgData.width, imgData.height, {
                            inversionAttempts: "dontInvert",
                        });

                        if (code && code.data) {
                            stopCamera();
                            const { reference: refExtracted, bank: bankExtracted } = parseScannedData(code.data);
                            processCandidateReference(refExtracted, bankExtracted);
                            return;
                        }

                        animFrameRef.current = requestAnimationFrame(scanLoop);
                    };

                    animFrameRef.current = requestAnimationFrame(scanLoop);
                };
            }
        } catch (err) {
            stopCamera();
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                setCameraError("Camera permission denied. Allow camera access or upload an image.");
            } else {
                setCameraError(err.message || "Failed to initialize camera scanner.");
            }
        }
    };

    // 2. Image File Upload & QR Decoder
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        e.target.value = "";

        setIsProcessingFile(true);
        setUploadError(null);
        setCameraError(null);

        try {
            const jsqrModule = await import("jsqr");
            const jsQR = jsqrModule.default || jsqrModule;

            const previewUrl = URL.createObjectURL(file);
            const img = new Image();
            img.src = previewUrl;

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => reject(new Error("Unable to read image file."));
            });

            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            ctx.drawImage(img, 0, 0);

            URL.revokeObjectURL(previewUrl);

            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imgData.data, imgData.width, imgData.height);

            if (code && code.data) {
                const { reference: refExtracted, bank: bankExtracted } = parseScannedData(code.data);
                processCandidateReference(refExtracted, bankExtracted);
            } else {
                setUploadError("No QR code found in this image. Please ensure the QR is clear or try manual entry.");
            }
        } catch (err) {
            setUploadError(err.message || "Failed to process image.");
        } finally {
            setIsProcessingFile(false);
        }
    };

    // 3. Manual Entry Submission
    const handleManualSubmit = (e) => {
        e.preventDefault();
        const trimmed = manualReference.trim();
        if (!trimmed) {
            setManualError("Please enter a reference or receipt link.");
            return;
        }

        const effectiveBank = manualBank || selectedBank;
        if (effectiveBank === "boa" && !manualAccount.trim()) {
            setManualError("BOA requires the receiving account number.");
            return;
        }

        setManualError(null);
        setIsManualModalOpen(false);

        executeVerification({
            reference: trimmed,
            bank: effectiveBank,
            accountNumber: manualAccount,
        });

        setManualReference("");
        setManualBank("");
        setManualAccount("");
    };

    const freshnessScore = outcomeModal?.details?.date
        ? getFreshnessScore(outcomeModal.details.date)
        : null;

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-16">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-(--border) pb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold tracking-tight">Payment Verification</h1>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-(--muted) text-(--muted-foreground) border border-(--border)">
                            <Lock className="w-3 h-3" /> Read-only
                        </span>
                    </div>
                    <p className="text-xs text-(--muted-foreground) mt-0.5">
                        Verify Ethiopian bank receipts directly against official bank endpoints.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setIsManualModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-(--muted) hover:bg-(--muted)/80 text-(--foreground) border border-(--border) transition-colors cursor-pointer"
                >
                    <PenLine className="w-3.5 h-3.5 text-(--primary)" />
                    <span>Manual</span>
                </button>
            </div>

            {/* Error notifications */}
            {cameraError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CameraOff className="w-4 h-4 shrink-0" />
                        <span>{cameraError}</span>
                    </div>
                    <button
                        onClick={() => setCameraError(null)}
                        className="p-1 hover:opacity-75 cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {uploadError && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{uploadError}</span>
                    </div>
                    <button
                        onClick={() => setUploadError(null)}
                        className="p-1 hover:opacity-75 cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Hidden Native File Input */}
            <input
                id={fileInputId}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={handleFileUpload}
            />

            {/* MAIN SCANNER CARD */}
            <div className="bg-(--card) border border-(--border) rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
                {/* Bank Selector Dropdown */}
                <div className="max-w-md mx-auto space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-(--muted-foreground) flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-(--primary)" />
                        <span>Target Bank / Wallet</span>
                    </label>
                    <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        disabled={isCameraActive || isVerifying || isProcessingFile}
                        className="w-full px-3.5 py-2.5 border border-(--border) rounded-xl text-sm bg-(--background) text-(--foreground) focus:outline-none focus:border-(--primary) transition-colors font-medium cursor-pointer"
                    >
                        <option value="">Auto-Detect Bank (Recommended)</option>
                        {CHEKI_BANKS.map((b) => (
                            <option key={b.code} value={b.code}>
                                {b.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Active Camera Viewfinder */}
                <div className={`${isCameraActive ? "block" : "hidden"} space-y-4`}>
                    <div className="relative overflow-hidden rounded-2xl bg-black aspect-video max-h-80 mx-auto flex items-center justify-center border border-(--border)">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-48 h-48 border-2 border-(--primary) rounded-2xl animate-pulse bg-white/5 flex items-center justify-center">
                                <span className="text-[10px] text-white/90 bg-black/60 px-2.5 py-1 rounded-full font-medium">
                                    Align receipt QR inside box
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={stopCamera}
                            className="px-5 py-2 bg-(--muted) hover:bg-(--muted)/80 text-(--foreground) rounded-xl border border-(--border) text-xs font-medium transition-colors cursor-pointer"
                        >
                            Cancel Camera
                        </button>
                    </div>
                </div>

                {/* Standby State: Two Primary Buttons */}
                {!isCameraActive && (
                    <div className="space-y-6 pt-2">
                        <div className="w-16 h-16 rounded-2xl bg-(--primary)/10 text-(--primary) flex items-center justify-center mx-auto shadow-inner">
                            {isVerifying || isProcessingFile ? (
                                <RefreshCw className="w-8 h-8 animate-spin" />
                            ) : (
                                <ShieldCheck className="w-8 h-8" />
                            )}
                        </div>

                        <div className="space-y-1 text-center">
                            <h2 className="text-lg font-bold">
                                {isVerifying
                                    ? "Verifying with Banking Network..."
                                    : isProcessingFile
                                        ? "Reading QR Code..."
                                        : "Scan or Upload Receipt QR"}
                            </h2>
                            <p className="text-xs text-(--muted-foreground) max-w-sm mx-auto">
                                Point camera at customer phone or choose screenshot image to verify bank payment.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-md mx-auto pt-2">
                            <button
                                type="button"
                                disabled={isVerifying || isProcessingFile}
                                onClick={startCamera}
                                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-(--primary) text-(--primary-foreground) rounded-2xl text-sm font-semibold hover:opacity-95 shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                            >
                                <Camera className="w-4 h-4" />
                                <span>Scan with Camera</span>
                            </button>

                            <button
                                type="button"
                                disabled={isVerifying || isProcessingFile}
                                onClick={() => document.getElementById(fileInputId)?.click()}
                                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-(--muted) hover:bg-(--muted)/80 text-(--foreground) border border-(--border) rounded-2xl text-sm font-semibold shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                            >
                                <Upload className="w-4 h-4 text-(--primary)" />
                                <span>Upload QR Image</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* CONDITIONAL MODAL: Pop-up ONLY when extra bank data is required (e.g. BOA) */}
            {pendingVerification && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="bg-(--card) border border-(--border) rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-(--border)">
                            <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-(--primary)" />
                                <h3 className="text-sm font-bold">BOA Account Number Required</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPendingVerification(null)}
                                className="p-1 text-(--muted-foreground) hover:text-(--foreground) rounded-lg cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <p className="text-xs text-(--muted-foreground)">
                            <strong>Bank of Abyssinia</strong> requires the receiving account number (last 5 digits or full account number) to query official slip records.
                        </p>

                        {accountPromptError && (
                            <p className="text-xs text-rose-500 font-medium">{accountPromptError}</p>
                        )}

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (!accountPromptValue.trim()) {
                                    setAccountPromptError("Account number is required for BOA verification.");
                                    return;
                                }
                                executeVerification({
                                    reference: pendingVerification.reference,
                                    bank: pendingVerification.bank,
                                    accountNumber: accountPromptValue,
                                });
                            }}
                            className="space-y-4"
                        >
                            <input
                                type="text"
                                autoFocus
                                placeholder="e.g. Last 5 digits or full account (1000...)"
                                value={accountPromptValue}
                                onChange={(e) => {
                                    setAccountPromptValue(e.target.value);
                                    if (accountPromptError) setAccountPromptError(null);
                                }}
                                className="w-full px-3.5 py-2.5 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary) font-mono"
                            />

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setPendingVerification(null)}
                                    className="px-4 py-2 border border-(--border) text-(--foreground) hover:bg-(--muted) rounded-xl text-xs font-medium cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isVerifying}
                                    className="px-5 py-2 bg-(--primary) text-(--primary-foreground) rounded-xl text-xs font-semibold hover:opacity-95 shadow-xs cursor-pointer flex items-center gap-1.5"
                                >
                                    {isVerifying ? (
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    )}
                                    <span>Verify Now</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MANUAL ENTRY MODAL */}
            {isManualModalOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="bg-(--card) border border-(--border) rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-(--border)">
                            <div className="flex items-center gap-2">
                                <PenLine className="w-4 h-4 text-(--primary)" />
                                <h3 className="text-sm font-bold">Manual Receipt Verification</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsManualModalOpen(false)}
                                className="p-1 text-(--muted-foreground) hover:text-(--foreground) rounded-lg cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {manualError && (
                            <p className="text-xs text-rose-500 font-medium">{manualError}</p>
                        )}

                        <form onSubmit={handleManualSubmit} className="space-y-3.5">
                            <div className="space-y-1">
                                <label className="text-xs font-medium">Bank / Provider</label>
                                <select
                                    value={manualBank}
                                    onChange={(e) => setManualBank(e.target.value)}
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-(--background) text-(--foreground) focus:outline-none focus:border-(--primary)"
                                >
                                    <option value="">Auto-Detect from Reference/URL</option>
                                    {CHEKI_BANKS.map((b) => (
                                        <option key={b.code} value={b.code}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium">Reference or Receipt Link *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. FT26140P01YB or https://..."
                                    value={manualReference}
                                    onChange={(e) => {
                                        setManualReference(e.target.value);
                                        if (manualError) setManualError(null);
                                    }}
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary) font-mono"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium">Receiving Account (Required for BOA)</label>
                                <input
                                    type="text"
                                    placeholder="Optional (Last 5 digits or full account)"
                                    value={manualAccount}
                                    onChange={(e) => setManualAccount(e.target.value)}
                                    className="w-full px-3 py-2 border border-(--border) rounded-xl text-sm bg-transparent focus:outline-none focus:border-(--primary) font-mono"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-(--border)">
                                <button
                                    type="button"
                                    onClick={() => setIsManualModalOpen(false)}
                                    className="px-4 py-2 border border-(--border) text-(--foreground) hover:bg-(--muted) rounded-xl text-xs font-medium cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-(--primary) text-(--primary-foreground) rounded-xl text-xs font-semibold hover:opacity-95 shadow-xs cursor-pointer"
                                >
                                    Verify Receipt
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* VERIFICATION OUTCOME MODAL (Pop-up upon verification) */}
            {outcomeModal && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-150"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="bg-(--card) border border-(--border) rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative">
                        {/* Close button in header */}
                        <button
                            type="button"
                            onClick={() => setOutcomeModal(null)}
                            className="absolute top-5 right-5 p-1.5 text-(--muted-foreground) hover:text-(--foreground) rounded-xl hover:bg-(--muted) transition-colors cursor-pointer"
                            aria-label="Close modal"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* 1. VERIFIED OUTCOME */}
                        {outcomeModal.type === "VERIFIED" && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                                            Payment Verified
                                        </h3>
                                        <p className="text-xs text-(--muted-foreground)">
                                            Confirmed by official banking provider records.
                                        </p>
                                    </div>
                                </div>

                                {/* Freshness Scoring Indicator with Relative Time */}
                                {freshnessScore && (
                                    <div
                                        className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium ${freshnessScore.badgeClass}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 shrink-0" />
                                            <span className="font-semibold">{freshnessScore.label}</span>
                                        </div>
                                        <span className="text-[11px] font-normal opacity-90 hidden sm:inline">
                                            {freshnessScore.description}
                                        </span>
                                    </div>
                                )}

                                {/* Detailed Breakdown: Amount, Sender, Receiver, Bank, Ref, Date */}
                                <div className="border border-(--border) rounded-2xl p-4 space-y-3 text-xs bg-(--muted)/10">
                                    {/* Big Amount */}
                                    {outcomeModal.details?.amount !== undefined && (
                                        <div className="flex justify-between items-baseline border-b border-(--border)/60 pb-3">
                                            <span className="text-(--muted-foreground) font-medium">Amount Paid</span>
                                            <span className="font-mono text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                                {Number(outcomeModal.details.amount).toLocaleString()}{" "}
                                                {outcomeModal.details.currency || "ETB"}
                                            </span>
                                        </div>
                                    )}

                                    {/* Sender / Payer Name */}
                                    <div className="flex justify-between py-1 border-b border-(--border)/40">
                                        <span className="text-(--muted-foreground) flex items-center gap-1.5">
                                            <User className="w-3.5 h-3.5" /> Sender (Payer):
                                        </span>
                                        <span className="font-semibold text-right">
                                            {outcomeModal.details?.senderName || "—"}
                                        </span>
                                    </div>

                                    {/* Receiver / Merchant Name */}
                                    <div className="flex justify-between py-1 border-b border-(--border)/40">
                                        <span className="text-(--muted-foreground) flex items-center gap-1.5">
                                            <Store className="w-3.5 h-3.5" /> Receiver (Credited):
                                        </span>
                                        <span className="font-semibold text-right">
                                            {outcomeModal.details?.receiverName || "—"}
                                        </span>
                                    </div>

                                    {/* Bank */}
                                    <div className="flex justify-between py-1 border-b border-(--border)/40">
                                        <span className="text-(--muted-foreground) flex items-center gap-1.5">
                                            <Building2 className="w-3.5 h-3.5" /> Provider:
                                        </span>
                                        <span className="font-medium text-right">
                                            {outcomeModal.details?.bank || "Official Provider"}
                                        </span>
                                    </div>

                                    {/* Reference */}
                                    <div className="flex justify-between py-1 border-b border-(--border)/40 font-mono">
                                        <span className="text-(--muted-foreground) flex items-center gap-1.5">
                                            <Receipt className="w-3.5 h-3.5" /> Reference:
                                        </span>
                                        <span className="font-bold text-(--primary) select-all text-right">
                                            {outcomeModal.details?.reference}
                                        </span>
                                    </div>

                                    {/* Exact Date & Relative Time */}
                                    <div className="flex justify-between items-center py-1">
                                        <span className="text-(--muted-foreground) flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" /> Transaction Date:
                                        </span>
                                        <div className="text-right">
                                            <span className="font-mono text-[11px] font-medium block">
                                                {outcomeModal.details?.date && dayjs(outcomeModal.details.date).isValid()
                                                    ? dayjs(outcomeModal.details.date).format("MMM D, YYYY, h:mm A")
                                                    : outcomeModal.details?.date || "—"}
                                            </span>
                                            {outcomeModal.details?.date && dayjs(outcomeModal.details.date).isValid() && (
                                                <span className="text-[10px] text-(--muted-foreground) font-mono block">
                                                    {dayjs(outcomeModal.details.date).fromNow()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Official Receipt Link Button */}
                                {outcomeModal.details?.sourceUrl && (
                                    <a
                                        href={outcomeModal.details.sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-(--muted) hover:bg-(--muted)/80 border border-(--border) rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                                    >
                                        <span>Open Bank Receipt Slip</span>
                                        <ExternalLink className="w-3.5 h-3.5 text-(--muted-foreground)" />
                                    </a>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setOutcomeModal(null)}
                                    className="w-full py-3 bg-(--primary) text-(--primary-foreground) rounded-xl text-xs font-bold hover:opacity-95 shadow-xs transition-opacity cursor-pointer"
                                >
                                    Done / Verify Next
                                </button>
                            </div>
                        )}

                        {/* 2. NOT VERIFIED OUTCOME */}
                        {outcomeModal.type === "NOT_VERIFIED" && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                                        <AlertCircle className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-amber-600 dark:text-amber-400">
                                            Not Confirmed
                                        </h3>
                                        <p className="text-xs text-(--muted-foreground)">
                                            The bank does not have a confirmed record for this slip.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
                                    <p className="font-semibold">Merchant Notice:</p>
                                    <p>
                                        Do <strong>not</strong> hand over goods. A customer screen or printed slip alone does not confirm that money reached your account.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setOutcomeModal(null)}
                                    className="w-full py-2.5 bg-(--muted) hover:bg-(--muted)/80 border border-(--border) rounded-xl text-xs font-semibold cursor-pointer"
                                >
                                    Dismiss & Try Again
                                </button>
                            </div>
                        )}

                        {/* 3. DUPLICATE OUTCOME */}
                        {outcomeModal.type === "DUPLICATE" && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
                                        <AlertTriangle className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">
                                            Duplicate Transaction
                                        </h3>
                                        <p className="text-xs text-(--muted-foreground)">
                                            This reference was already verified for a previous sale!
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 space-y-1.5">
                                    <p className="font-bold">Fraud Alert:</p>
                                    <p>
                                        The customer is presenting an old receipt that was previously validated. Do not release goods.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setOutcomeModal(null)}
                                    className="w-full py-2.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:opacity-90 cursor-pointer"
                                >
                                    Close Warning
                                </button>
                            </div>
                        )}

                        {/* 4. ERROR OUTCOME */}
                        {outcomeModal.type === "ERROR" && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
                                        <AlertCircle className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">
                                            Verification Error
                                        </h3>
                                        <p className="text-xs text-(--muted-foreground)">
                                            {outcomeModal.message}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setOutcomeModal(null)}
                                    className="w-full py-2.5 bg-(--muted) hover:bg-(--muted)/80 border border-(--border) rounded-xl text-xs font-semibold cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}