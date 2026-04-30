import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import apiRoutes from "./routes.js";
import { initDb } from "./db.js";

const app = express();

// Trust the first proxy (Nginx/Cloud Run/Vercel)
app.set("trust proxy", 1);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  validate: { 
    trustProxy: false,
    xForwardedForHeader: false 
  },
});

app.use(compression());
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for Vite Dev Server
}));
app.use(cors());
app.use(express.json());

// For serverless environments like Vercel, we need to ensure DB is initialized
// on cold starts. For long-running servers, this just runs once.
let dbInitialized = false;
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await initDb();
      dbInitialized = true;
    } catch (error) {
      console.error("Database initialization error:", error);
    }
  }
  next();
});

// API Routes
app.use("/api", apiLimiter);
app.use("/api", apiRoutes);

export default app;
