// @/lib/sound/feedback.js

class SoundManager {
    play() {
        if (typeof window === "undefined") return;
        try {
            // Create a fresh audio instance on every call so the browser ties it to the user click event
            const audio = new Audio("/sound/beep.mp3");
            audio.volume = 1.0;
            audio.play().catch((err) => {
                console.log("Audio play blocked:", err);
            });
        } catch (e) {
            console.error("Audio error:", e);
        }
    }

    actionSelect() {
        this.play();
    }

    keyPress() {
        this.play();
    }

    success() {
        this.play();
    }

    error() {
        this.play();
    }
}

export const feedback = new SoundManager();