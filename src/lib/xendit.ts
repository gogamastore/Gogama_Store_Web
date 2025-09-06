import { Xendit } from "xendit-node";

if (!process.env.XENDIT_API_KEY) {
    throw new Error("XENDIT_API_KEY is not set in environment variables.");
}

export const xenditClient = new Xendit({
    secretKey: process.env.XENDIT_API_KEY
});
