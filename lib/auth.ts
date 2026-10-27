import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),

    emailAndPassword: {
        enabled: true,
    },

    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "patient",
                input: true,
            },
        },
    },

    trustedOrigins: [
        "http://localhost:3000",
        "https://medrella-appointment-booking-applic-alpha.vercel.app",
    ],

    plugins: [nextCookies()],
});