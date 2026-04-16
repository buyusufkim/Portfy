import express from "express";
import path from "path";
import dotenv from "dotenv";
import { authenticate, aiLimiter, handleUpdateProfile, handleSubscribe, handleAdminUpdateUser, handleAdminGetUsers, handleAdminGetSettings, handleUpdateGlobalSettings, handleEarnXP, handleAIGeneration } from "./server/ai-api.ts";

dotenv.config({ override: true });

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Global body size limit for security
  app.use(express.json({ limit: "100kb" }));

  // Logging middleware for debugging
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`[API Request] ${req.method} ${req.url}`);
    }
    next();
  });

  // Secure Profile Endpoints
app.post("/api/ai/generate", authenticate, aiLimiter, handleAIGeneration);
  app.post("/api/ai/profile/update", authenticate, handleUpdateProfile);
  app.post("/api/ai/subscribe", authenticate, handleSubscribe);
  app.post("/api/ai/earn-xp", authenticate, handleEarnXP);
  app.get("/api/ai/admin/users", authenticate, handleAdminGetUsers);
  app.get("/api/ai/admin/settings", authenticate, handleAdminGetSettings);
  app.post("/api/ai/admin/update-user", authenticate, handleAdminUpdateUser);
  app.post("/api/ai/admin/update-settings", authenticate, handleUpdateGlobalSettings);

  // 404 Handler for API routes to prevent falling back to HTML
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.originalUrl}` });
  });

  // Global Error Handler for API
  app.use((err: any, req: any, res: any, next: any) => {
    if (req.url.startsWith('/api')) {
      console.error('[API Error]', err);
      return res.status(500).json({ error: err.message || "Internal Server Error" });
    }
    next(err);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
