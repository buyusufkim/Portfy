import express, { Request, Response, NextFunction } from "express";
import path from "path";
import dotenv from "dotenv";

import { authenticate, aiLimiter, tokenTrackerMiddleware, handleUpdateProfile, handleSubscribe, handleAdminUpdateUser, handleAdminDeleteUser, handleAdminGetUsers, handleAdminGetSettings, handleUpdateGlobalSettings, handleEarnXP, handleAIGeneration, AuthRequest } from "./server/ai-api.js";
import { rateLimit } from 'express-rate-limit';
import { fetchMarketData } from "./server/marketScraper.js";

// Meta Webhook İşleyicileri İçeri Aktarılıyor
import { handleMetaWebhookGet, handleMetaWebhookPost } from "./server/meta-api.js";
import { handleGetPortalData, handleCreatePortalToken, handleRevokePortalTokens } from "./server/portal-api.js";

dotenv.config({ override: true });

const app = express();

app.use(express.json({ limit: "100kb" }));

app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    console.log(`[API Request] ${req.method} ${req.url}`);
  }
  next();
});

// YENİ: Meta Webhook Rotaları
app.get("/api/webhooks/meta", handleMetaWebhookGet);
app.post("/api/webhooks/meta", handleMetaWebhookPost);

// Secure Profile Endpoints
app.post("/api/ai/generate", authenticate, aiLimiter, tokenTrackerMiddleware, handleAIGeneration);
app.post("/api/ai/profile/update", authenticate, handleUpdateProfile);
app.post("/api/ai/subscribe", authenticate, handleSubscribe);
app.post("/api/ai/earn-xp", authenticate, handleEarnXP);

// Admin Endpoints
app.get("/api/ai/admin/users", authenticate, handleAdminGetUsers);
app.get("/api/ai/admin/settings", authenticate, handleAdminGetSettings);
app.post("/api/ai/admin/update-user", authenticate, handleAdminUpdateUser);
app.post("/api/ai/admin/delete-user", authenticate, handleAdminDeleteUser);
app.post("/api/ai/admin/update-settings", authenticate, handleUpdateGlobalSettings);

// Owner Portal Endpoints
app.get("/api/portal/:token", handleGetPortalData);
app.post("/api/portal/create", authenticate, handleCreatePortalToken);
app.post("/api/portal/revoke", authenticate, handleRevokePortalTokens);

const marketLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  keyGenerator: (req: AuthRequest) => req.user?.id || req.ip || 'unknown',
  message: { error: "Piyasa analizi için kullanım limitine ulaştınız. Lütfen daha sonra tekrar deneyin." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/api/market/analyze', authenticate, marketLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { city, district, neighborhood, propertyType, m2 } = req.body;
    
    if (!city || !district) {
      return res.status(400).json({ error: 'İl ve ilçe bilgisi zorunludur.' });
    }

    const marketData = await fetchMarketData({
      city,
      district,
      neighborhood: neighborhood || '',
      propertyType: propertyType || 'Konut',
      m2: m2 || 100
    });

    res.json(marketData);
  } catch (error) {
    console.error('Market Analiz Hatası:', error);
    res.status(500).json({ error: 'Piyasa verileri çekilemedi.' });
  }
});

app.use("/api/*", (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.originalUrl}` });
});

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (req.url.startsWith('/api')) {
    console.error('[API Error]', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : "Internal Server Error" });
  }
  next(err);
});

if (!process.env.VERCEL) {
  const PORT = 3000;
  if (process.env.NODE_ENV !== "production") {
    import("vite").then(async ({ createServer }) => {
      const vite = await createServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

export default app;