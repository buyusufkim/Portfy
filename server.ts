import express, { Request, Response, NextFunction } from "express";
import path from "path";
import dotenv from "dotenv";

import { 
  authenticate, 
  requireAdmin, 
  aiLimiter, 
  xpLimiter, 
  tokenTrackerMiddleware, 
  handleUpdateProfile, 
  handleSubscribe, 
  handleAdminUpdateUser, 
  handleAdminDeleteUser, 
  handleAdminResetToken,
  handleAdminResetToday,
  handleAdminGetUsers, 
  handleAdminGetSettings, 
  handleUpdateGlobalSettings, 
  handleEarnXP, 
  handleAIGeneration, 
  AuthRequest,
  handleAdminGetUserNotes,
  handleAdminCreateUserNote,
  handleAdminDeleteUserNote,
  handleAdminGetAnnouncements,
  handleAdminCreateAnnouncement,
  handleAdminUpdateAnnouncement,
  handleAdminDeleteAnnouncement,
  handleAdminGetSupportTickets,
  handleAdminUpdateSupportTicket,
  handleAdminGetAuditLogs,
  handleAdminCreateTaskTemplate,
  handleAdminUpdateTaskTemplate,
  handleAdminDeleteTaskTemplate,
  handleVerifyTask,
  handleCompleteGamifiedTask,
  handleCompleteCampaignTask,
  handleGetDailyPlanToday,
  handleSaveDailyPlan,
  handleGetDayClosureToday,
  handleSaveDayClosure,
  handleGetDailyGamifiedTasks
} from "./server/ai-api.js";
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { fetchMarketData } from "./server/marketScraper.js";

// Meta Webhook İşleyicileri İçeri Aktarılıyor
import { handleMetaWebhookGet, handleMetaWebhookPost } from "./server/meta-api.js";
import { handleGetPortalData, handleCreatePortalToken, handleRevokePortalTokens } from "./server/portal-api.js";
import { handleMaintenanceRun } from "./server/momentum-api.js";

dotenv.config({ override: true });

const app = express();

app.get('/api/time/turkey', (_req, res) => {
  const now = new Date();
  
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const today = formatter.format(now); // yyyy-mm-dd format

  res.json({
    ok: true,
    timezone: 'Europe/Istanbul',
    iso: now.toISOString(),
    timestamp: now.getTime(),
    today: today
  });
});

app.get(["/health", "/api/health"], (_req, res) => {
  res.status(200).json({
    ok: true,
    time: new Date().toISOString(),
    env: {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY,
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY
    }
  });
});

export interface CustomRequest extends Request {
  rawBody?: Buffer;
}

app.use(express.json({
  limit: "50mb",
  verify: (req: CustomRequest, res: Response, buf: Buffer) => {
    if (req.url === "/api/webhooks/meta") {
      req.rawBody = buf;
    }
  }
}));

app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    const start = Date.now();
    
    res.on('finish', () => {
      const latency = Date.now() - start;
      const isProduction = process.env.NODE_ENV === "production";
      
      let logBody = '';
      if (!isProduction && req.method !== 'GET' && Object.keys(req.body || {}).length > 0) {
        const maskedBody = { ...req.body };
        const sensitiveFields = ['password', 'token', 'access_token', 'apiKey', 'apikey', 'secret', 'phone', 'email'];
        Object.keys(maskedBody).forEach(key => {
          if (sensitiveFields.some(sf => key.toLowerCase().includes(sf))) {
            maskedBody[key] = '***MASKED***';
          }
        });
        logBody = ` Body: ${JSON.stringify(maskedBody).substring(0, 500)}`;
      }
      
      console.log(`[API] ${req.method} ${req.url} ${res.statusCode} ${latency}ms${logBody}`);
    });
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
app.post("/api/ai/earn-xp", authenticate, xpLimiter, handleEarnXP);
app.post("/api/ai/verify-task", authenticate, handleVerifyTask);
app.post("/api/ai/complete-gamified-task", authenticate, handleCompleteGamifiedTask);
app.post("/api/ai/complete-campaign-task", authenticate, handleCompleteCampaignTask);
app.get("/api/ai/gamified-tasks/daily", authenticate, handleGetDailyGamifiedTasks);
app.get("/api/ai/daily-plan/today", authenticate, handleGetDailyPlanToday);
app.post("/api/ai/daily-plan/save", authenticate, handleSaveDailyPlan);
app.get("/api/ai/day-closure/today", authenticate, handleGetDayClosureToday);
app.post("/api/ai/day-closure/save", authenticate, handleSaveDayClosure);

// Admin Endpoints
app.get("/api/ai/admin/users", authenticate, requireAdmin, handleAdminGetUsers);
app.get("/api/ai/admin/settings", authenticate, requireAdmin, handleAdminGetSettings);
app.post("/api/ai/admin/update-user", authenticate, requireAdmin, handleAdminUpdateUser);
app.post("/api/ai/admin/delete-user", authenticate, requireAdmin, handleAdminDeleteUser);
app.post("/api/ai/admin/reset-token", authenticate, requireAdmin, handleAdminResetToken);
app.post("/api/ai/admin/reset-today", authenticate, requireAdmin, handleAdminResetToday);
app.post("/api/ai/admin/update-settings", authenticate, requireAdmin, handleUpdateGlobalSettings);

// Admin V3 Endpoints
app.get("/api/ai/admin/user-notes/:userId", authenticate, requireAdmin, handleAdminGetUserNotes);
app.post("/api/ai/admin/user-notes", authenticate, requireAdmin, handleAdminCreateUserNote);
app.delete("/api/ai/admin/user-notes/:id", authenticate, requireAdmin, handleAdminDeleteUserNote);
app.get("/api/ai/admin/announcements", authenticate, requireAdmin, handleAdminGetAnnouncements);
app.post("/api/ai/admin/announcements", authenticate, requireAdmin, handleAdminCreateAnnouncement);
app.patch("/api/ai/admin/announcements/:id", authenticate, requireAdmin, handleAdminUpdateAnnouncement);
app.delete("/api/ai/admin/announcements/:id", authenticate, requireAdmin, handleAdminDeleteAnnouncement);
app.get("/api/ai/admin/support-tickets", authenticate, requireAdmin, handleAdminGetSupportTickets);
app.patch("/api/ai/admin/support-tickets/:id", authenticate, requireAdmin, handleAdminUpdateSupportTicket);
app.get("/api/ai/admin/audit-logs", authenticate, requireAdmin, handleAdminGetAuditLogs);
app.post("/api/ai/admin/task-templates", authenticate, requireAdmin, handleAdminCreateTaskTemplate);
app.patch("/api/ai/admin/task-templates/:id", authenticate, requireAdmin, handleAdminUpdateTaskTemplate);
app.delete("/api/ai/admin/task-templates/:id", authenticate, requireAdmin, handleAdminDeleteTaskTemplate);

// Momentum Endpoints
app.post("/api/momentum/maintenance/run", authenticate, handleMaintenanceRun);

// Owner Portal Endpoints
app.get("/api/portal/:token", handleGetPortalData);
app.post("/api/portal/create", authenticate, handleCreatePortalToken);
app.post("/api/portal/revoke", authenticate, handleRevokePortalTokens);

const marketLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  keyGenerator: (req: Request) => {
    const userId = (req as AuthRequest).user?.id;
    if (userId) return `user:${userId}`;
    return ipKeyGenerator(req.ip || 'unknown');
  },
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
    res.status(500).json({ error: process.env.NODE_ENV === "development" && error instanceof Error ? error.message : "Piyasa verileri çekilemedi." });
  }
});

app.use("/api/*", (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.originalUrl}` });
});

export const safeErrorMessage = (error: unknown, fallback: string) =>
    process.env.NODE_ENV === "development" && error instanceof Error ? error.message : fallback;

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error('[API_UNHANDLED_ERROR]', {
    path: req.path,
    method: req.method,
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined
  });
  if (req.url.startsWith('/api')) {
    res.status(500).json({
      error: 'internal_server_error',
      message: err instanceof Error ? err.message : 'Unknown server error',
      path: req.path
    });
    return;
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