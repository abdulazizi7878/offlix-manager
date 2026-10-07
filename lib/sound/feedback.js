// lib/sound/feedback.js

class FeedbackManager {
    constructor() {
        this.audioCtx = null;
    }

    getAudioContext() {
        if (typeof window === "undefined") return null;
        if (!this.audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.audioCtx = new AudioContextClass();
            }
        }
        if (this.audioCtx && this.audioCtx.state === "suspended") {
            this.audioCtx.resume().catch(() => { });
        }
        return this.audioCtx;
    }

    // --- HAPTIC FEEDBACK ---
    vibrate(pattern) {
        if (typeof window !== "undefined" && "navigator" in window && typeof navigator.vibrate === "function") {
            try {
                navigator.vibrate(pattern);
            } catch {
                // Ignore if blocked by browser policy
            }
        }
    }

    // --- SOUND GENERATORS ---
    playTone({ freq = 440, duration = 0.05, type = "sine", volume = 0.05, freqEnd }) {
        try {
            const ctx = this.getAudioContext();
            if (!ctx) return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            if (freqEnd) {
                osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);
            }

            gain.gain.setValueAtTime(volume, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch {
            // Suppress Web Audio errors
        }
    }

    // --- CONVENIENCE METHODS ---

    // Subtle keypress sound & light haptic for standard calculator buttons
    keyPress() {
        this.vibrate(8);
        this.playTone({ freq: 600, duration: 0.03, volume: 0.02, type: "sine" });
    }

    // Slightly distinct pitch for operators (+, -, *, /)
    operatorPress() {
        this.vibrate(10);
        this.playTone({ freq: 750, duration: 0.04, volume: 0.025, type: "sine" });
    }

    // Equals/result button
    equalsPress() {
        this.vibrate(18);
        this.playTone({ freq: 520, freqEnd: 880, duration: 0.08, volume: 0.04, type: "sine" });
    }

    // Selecting a Smart Action or opening modal
    actionSelect() {
        this.vibrate(20);
        this.playTone({ freq: 440, freqEnd: 660, duration: 0.06, volume: 0.04, type: "sine" });
    }

    // Success feedback (Save Income, Expense, Credit, Sale, etc.)
    success() {
        this.vibrate([25, 40, 25]);
        try {
            const ctx = this.getAudioContext();
            if (!ctx) return;

            // Two-note ascending chime
            this.playTone({ freq: 523.25, duration: 0.08, volume: 0.04, type: "sine" });
            setTimeout(() => {
                this.playTone({ freq: 659.25, duration: 0.12, volume: 0.05, type: "sine" });
            }, 70);
        } catch {
            // Fallback
        }
    }

    // Error feedback (Validation or API failure)
    error() {
        this.vibrate([40, 30, 40]);
        this.playTone({ freq: 220, freqEnd: 150, duration: 0.12, volume: 0.05, type: "triangle" });
    }
}

export const feedback = new FeedbackManager();