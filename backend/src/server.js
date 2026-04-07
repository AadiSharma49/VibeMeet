import express from 'express';
import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';
import { clerkMiddleware, requireAuth } from "@clerk/express";
import { inngest, functions } from './config/inngest.js';
import { serve } from "inngest/express";
import chatRoutes from './routes/chat.route.js'; 
import '../instrument.mjs';
import * as Sentry from "@sentry/node";
import cors from 'cors';

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

app.use(clerkMiddleware());

// Test route
app.get('/', (req, res) => {
    res.send("Hello from Vibe-Meet backend");
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Routes
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/chat", chatRoutes);

// Debug Sentry
app.use("/debug-sentry", (req, res) => {
    throw new Error("Sentry debug test error!");
});

// Error handling
Sentry.setupExpressErrorHandler(app);

const startServer = async () => {
    try {
        await connectDB();
        console.log("Database connected successfully");
        
        app.listen(ENV.PORT, () => {
            console.log(`✅ Server started on port: ${ENV.PORT}`);
        });
    } catch (error) {
        console.error("❌ Error starting server:", error);
        process.exit(1);
    }
}

startServer();

export default app;