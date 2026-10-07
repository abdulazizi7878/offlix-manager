"use client";

import { useState, useEffect, useRef } from "react";

import { useTranslations } from "next-intl";

import { SafeMath } from "@/lib/math/decimal";

import SmartActionModals from "@/components/calculator/SmartActionModals";

import {
    Calculator as CalcIcon,
    RotateCcw,
    Sparkles,
    ArrowRight,
    History,
} from "lucide-react";

export default function CalculatorPage() {
    const t = useTranslations("calculator");

    const [input, setInput] = useState("");
    const [result, setResult] = useState("");
    const [history, setHistory] = useState([]);
    const [showSmartHook, setShowSmartHook] = useState(false);
    const [activeModal, setActiveModal] = useState(null);
    const [hookAmount, setHookAmount] = useState("");

    // --------------------------------------------------
    // PRELOADED FEEDBACK AUDIO
    // --------------------------------------------------

    const feedbackAudioRef = useRef(null);

    useEffect(() => {
        const audio = new Audio("/sound/beep.mp3");

        audio.preload = "auto";
        audio.volume = 1.0;
        audio.load();

        feedbackAudioRef.current = audio;

        return () => {
            audio.pause();
            audio.src = "";
            feedbackAudioRef.current = null;
        };
    }, []);

    // --------------------------------------------------
    // AUDIO + VIBRATION FEEDBACK
    // --------------------------------------------------

    const triggerFeedback = (duration = 10) => {
        // Vibration
        try {
            if (
                typeof navigator !== "undefined" &&
                typeof navigator.vibrate === "function"
            ) {
                navigator.vibrate(duration);
            }
        } catch { }

        // Preloaded audio
        try {
            const audio = feedbackAudioRef.current;

            if (!audio) return;

            audio.currentTime = 0;
            void audio.play().catch(() => { });
        } catch { }
    };

    // --------------------------------------------------
    // LIVE CALCULATION EVALUATION
    // --------------------------------------------------

    useEffect(() => {
        if (!input) {
            setResult("");
            setShowSmartHook(false);
            return;
        }

        const calculated = SafeMath.evaluate(input);

        if (calculated && calculated !== "Error") {
            setResult(calculated);
        } else {
            setResult("");
        }
    }, [input]);

    // --------------------------------------------------
    // SMART ACTION HOOK DELAY
    // --------------------------------------------------

    useEffect(() => {
        const targetVal =
            result || (input && !isNaN(Number(input)) ? input : "");

        if (!targetVal || targetVal === "Error") {
            setShowSmartHook(false);
            return;
        }

        const timer = setTimeout(() => {
            setHookAmount(targetVal);
            setShowSmartHook(true);
        }, 1000);

        return () => clearTimeout(timer);
    }, [result, input]);

    // --------------------------------------------------
    // CALCULATOR KEY HANDLER
    // --------------------------------------------------

    const handleKeyClick = (val) => {
        // Immediate audio + vibration feedback
        triggerFeedback(10);

        if (val === "C") {
            setInput("");
            setResult("");
            setShowSmartHook(false);
            return;
        }

        if (val === "DEL") {
            setInput((prev) => prev.slice(0, -1));
            return;
        }

        if (val === "=") {
            if (result) {
                setHistory((prev) => [
                    {
                        expr: input,
                        res: result,
                    },
                    ...prev.slice(0, 9),
                ]);

                setInput(result);
                setResult("");
            }

            return;
        }

        setInput((prev) => prev + val);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-(--primary)/10 text-(--primary)">
                        <CalcIcon className="w-6 h-6" />
                    </div>

                    <div>
                        <h1 className="text-xl font-bold tracking-tight">
                            {t("title")}
                        </h1>

                        <p className="text-xs text-(--muted-foreground)">
                            {t("description")}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Calculator */}
                <div className="lg:col-span-2 bg-(--card) border border-(--border) rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                    {/* Display area */}
                    <div className="relative bg-(--background) border border-(--border) rounded-2xl p-5 mb-6 text-right space-y-1 min-h-[130px] flex flex-col justify-end">
                        {/* Expression */}
                        <div className="text-sm font-mono text-(--muted-foreground) overflow-x-auto whitespace-nowrap">
                            {input || "0"}
                        </div>

                        {/* Dynamic Result preview */}
                        <div className="text-3xl font-extrabold font-mono tracking-tight text-(--foreground)">
                            {result ? `= ${result}` : input ? "" : "0"}
                        </div>

                        {/* Smart Action Floating Hook */}
                        {showSmartHook && (
                            <div className="absolute top-3 left-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="bg-(--primary) text-(--primary-foreground) rounded-full p-1.5 pl-3 pr-2.5 shadow-lg flex items-center gap-2 text-xs font-semibold">
                                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />

                                    <span>
                                        {t("saveHook", {
                                            amount: hookAmount,
                                        })}
                                    </span>

                                    <div className="flex gap-1 ml-1">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setActiveModal("INCOME")
                                            }
                                            className="px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 text-[11px] font-medium transition-colors cursor-pointer"
                                        >
                                            {t("income")}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setActiveModal("MORE")
                                            }
                                            className="px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 text-[11px] font-medium transition-colors cursor-pointer"
                                        >
                                            {t("more")}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Keypad */}
                    <div className="grid grid-cols-4 gap-2.5">
                        {[
                            "C",
                            "DEL",
                            "/",
                            "*",
                            "7",
                            "8",
                            "9",
                            "-",
                            "4",
                            "5",
                            "6",
                            "+",
                            "1",
                            "2",
                            "3",
                            "=",
                            "0",
                            ".",
                        ].map((btn) => {
                            const isOp = [
                                "/",
                                "*",
                                "-",
                                "+",
                                "=",
                            ].includes(btn);

                            const isAction = ["C", "DEL"].includes(btn);

                            return (
                                <button
                                    key={btn}
                                    type="button"
                                    onClick={() => handleKeyClick(btn)}
                                    className={`py-3.5 rounded-xl font-bold text-lg transition-transform active:scale-95 shadow-2xs cursor-pointer ${btn === "="
                                            ? "col-span-1 bg-(--primary) text-(--primary-foreground)"
                                            : btn === "0"
                                                ? "col-span-1"
                                                : isAction
                                                    ? "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:text-rose-400"
                                                    : isOp
                                                        ? "bg-(--muted) text-(--primary) hover:bg-(--muted)/80"
                                                        : "bg-(--muted)/40 hover:bg-(--muted) text-(--foreground)"
                                        }`}
                                >
                                    {btn}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Calculation History */}
                <div className="bg-(--card) border border-(--border) rounded-2xl p-6 shadow-xs flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-sm font-bold">
                            <History className="w-4 h-4 text-(--muted-foreground)" />

                            <span>
                                {t("recentComputations")}
                            </span>
                        </div>

                        {history.length > 0 && (
                            <button
                                type="button"
                                onClick={() => {
                                    triggerFeedback(10);
                                    setHistory([]);
                                }}
                                className="text-xs text-(--muted-foreground) hover:text-(--foreground) transition-colors cursor-pointer"
                            >
                                {t("clear")}
                            </button>
                        )}
                    </div>

                    <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[360px] pr-1">
                        {history.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-12 text-(--muted-foreground) text-xs">
                                <RotateCcw className="w-8 h-8 mb-2 opacity-30" />

                                {t("noHistory")}
                            </div>
                        ) : (
                            history.map((item, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => {
                                        triggerFeedback(10);
                                        setInput(item.res);
                                    }}
                                    className="p-3 rounded-xl bg-(--background) border border-(--border) hover:border-(--primary)/50 cursor-pointer transition-colors flex items-center justify-between group"
                                >
                                    <div className="min-w-0">
                                        <p className="text-xs font-mono text-(--muted-foreground) truncate">
                                            {item.expr}
                                        </p>

                                        <p className="text-base font-bold font-mono text-(--foreground)">
                                            = {item.res}
                                        </p>
                                    </div>

                                    <ArrowRight className="w-4 h-4 text-(--muted-foreground) group-hover:text-(--primary) transition-colors shrink-0 ml-2" />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Smart Actions Modals */}
            {activeModal && (
                <SmartActionModals
                    actionType={activeModal}
                    amount={hookAmount || result || input}
                    onClose={() => setActiveModal(null)}
                    onSelectAction={(selectedAction) =>
                        setActiveModal(selectedAction)
                    }
                    onSuccess={() => {
                        setInput("");
                        setResult("");
                        setShowSmartHook(false);
                    }}
                />
            )}
        </div>
    );
}