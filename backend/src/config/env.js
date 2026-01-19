import "dotenv/config";

export const ENV = {
    PORT:process.env.PORT || 5001,
    MONGO_URI: process.env.MONGO_URI,
    NODE_ENV: process.env.NODE_ENV,
    CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    STEAM_API_SECRET: process.env.STEAM_API_SECRET,
    STEAM_API_KEY: process.env.STEAM_API_KEY,
    SENTRY_DSN: process.env.SENTRY_DSN,
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
}
