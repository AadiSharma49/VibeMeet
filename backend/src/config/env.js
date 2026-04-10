import "dotenv/config";

export const ENV = {
    PORT:process.env.PORT || 5001,
    MONGO_URI: process.env.MONGO_URI,
    NODE_ENV: process.env.NODE_ENV,
    CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    STREAM_API_SECRET: process.env.STREAM_API_SECRET,
    STREAM_API_KEY: process.env.STREAM_API_KEY,
    SENTRY_DSN: process.env.SENTRY_DSN,
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4o-mini",
    CLIENT_URL: process.env.CLIENT_URL,
    CLIENT_URLS: process.env.CLIENT_URLS,
}
