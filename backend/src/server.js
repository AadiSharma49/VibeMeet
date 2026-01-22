import express from 'express';
import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';
import {ClerkMiddleware} from "@clerk/express";
import { inngest, functions } from './config/inngest.js';
import { serve } from "inngest/express";


const app = express();

app.use(express.json());
app.use(ClerkMiddleware())



app.use("/api/inngest", serve({ client: inngest, functions }));
app.get('/',(req,res)=>{
    res.send("Hello from Vibe-Meet backend");
}
);

const startServer = async () => {
    try {
        await connectDB();
        if(ENV.NODE_ENV!=="production"){
            app.listen(ENV.PORT, () => {
                console.log("Server started on port:",ENV.PORT);
            connectDB();
            });
        }
    } catch (error) {
        console.error("Error starting server:", error);
        process.exit(1);
    }
}
startServer();

export default app;