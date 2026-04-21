import express from "express";
import path from "path";
import dotenv from "dotenv";

// UZANTI .js OLARAK DÜZELTİLDİ. Node.js ESM kuralları gereği derlenmiş dosyayı işaret etmelidir.
import { 
  authenticate, aiLimiter, tokenTrackerMiddleware, handleUpdateProfile, handleSubscribe, 
  handleAdminUpdateUser, handleAdminDeleteUser, handleAdminGetUsers, 
  handleAdminGetSettings, handleUpdateGlobalSettings, handleEarnXP, handleAIGeneration 
} from "./server/ai-api.js";

// ✅ YENİ MARKET SCRAPER İÇERİ AKTARILDI (ESM formatına uygun olarak .js uzantısıyla)
import { fetchMarketData } from "./server/marketScraper.js";

dotenv.config({ override: true });

const app = express();

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

// ✅ YENİ MARKET ANALİZ ENDPOİNTİ - GÜVENLİ HALE GETİRİLDİ
app.post('/api/market/analyze', authenticate, async (req: any, res: any) => {
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

// VERCEL ORTAMINDA DEĞİLSEK SUNUCUYU BAŞLAT
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

// Vercel'in API'yi okuyabilmesi için Export Edilmesi Zorunludur
export default app;