import Decimal from "decimal.js";

export const SafeMath = {
    evaluate: (expression) => {
        try {
            const sanitized = expression.replace(/×/g, "*").replace(/÷/g, "/");
            if (!sanitized || /[+\-*/.]$/.test(sanitized)) return null;

            // Safe evaluation using Decimal parsing
            const tokens = sanitized.match(/(\d+\.?\d*|[\+\-\*\/])/g);
            if (!tokens) return null;

            let currentVal = new Decimal(tokens[0]);
            for (let i = 1; i < tokens.length; i += 2) {
                const op = tokens[i];
                const nextVal = new Decimal(tokens[i + 1]);

                if (op === "+") currentVal = currentVal.plus(nextVal);
                if (op === "-") currentVal = currentVal.minus(nextVal);
                if (op === "*") currentVal = currentVal.times(nextVal);
                if (op === "/") {
                    if (nextVal.isZero()) return "Error";
                    currentVal = currentVal.dividedBy(nextVal);
                }
            }
            return currentVal.toString();
        } catch {
            return "Error";
        }
    },
};