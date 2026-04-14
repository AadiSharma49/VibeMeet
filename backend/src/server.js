import express from 'express';
import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';
import { clerkMiddleware } from "@clerk/express";
import { inngest, functions } from './config/inngest.js';
import { serve } from "inngest/express";
import chatRoutes from './routes/chat.route.js'; 
import userRoutes from './routes/user.route.js';
import aiRoutes from './routes/ai.route.js';
import * as Sentry from "@sentry/node";
import cors from 'cors';

const app = express();
const allowedOrigins = new Set(
    [
        ENV.CLIENT_URL,
        ...(ENV.CLIENT_URLS ? ENV.CLIENT_URLS.split(",") : []),
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
        .map((origin) => origin?.trim())
        .filter(Boolean)
);

// Middleware
app.use(express.json());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());
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
app.use("/api/users", userRoutes);
app.use("/api/ai", aiRoutes);

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
