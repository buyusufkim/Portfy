import { GoogleGenAI } from "@google/genai";
import { rateLimit } from "express-rate-limit";
import { User } from "@supabase/supabase-js";
import { Request, Response, NextFunction } from "express";

export interface AuthRequest extends Request {
  user?: User;
  accessToken?: string;
}
import { createClient } from "@supabase/supabase-js";
import { addMonths } from "date-fns";
import * as dotenv from "dotenv";

dotenv.config({ override: true });

function getGenerativeAI() {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GEMINI_SV_KEY || process.env.GOOGLE_API_KEY;
  if (!GEMINI_API_KEY) {
      console.warn("WARNING: GEMINI_API_KEY is not defined. AI won't work.");
      return null;
  }
  return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  throw new Error("CRITICAL: VITE_SUPABASE_URL is not defined in environment variables.");
}
if (!SUPABASE_ANON_KEY) {
  throw new Error("CRITICAL: VITE_SUPABASE_ANON_KEY is not defined in environment variables.");
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is required in production");
  } else {
    console.warn("WARNING: SUPABASE_SERVICE_ROLE_KEY is not defined. Privileged backend operations will fail.");
  }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin client for privileged operations - NO FALLBACK
const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;


const ALLOWED_MODELS = [
  "gemini-flash-latest",
  "gemini-3-flash-preview",
  "gemini-3.1-pro-preview",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite-preview",
  "gemini-2.0-pro-exp-02-05",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro-latest"
];

// Rate Limiting Middleware
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP/User to 100 requests per window
  keyGenerator: (req: AuthRequest) => req.user?.id || req.ip || 'unknown',
  message: { error: "Rate limit exceeded. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const xpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req: AuthRequest) => req.user?.id || req.ip || 'unknown',
  message: { error: "XP kazanım limitine ulaşıldı." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication Middleware
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    req.user = user;
    req.accessToken = token;
    next();
  } catch (err) {
    res.status(401).json({ error: "Authentication failed" });
  }
};

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });
    const adminId = req.user?.id;
    if (!adminId) return res.status(401).json({ error: "Unauthorized" });

    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', adminId)
      .single();

    if (adminError || adminProfile?.role !== 'admin') {
      return res.status(403).json({ error: "Unauthorized: Admin access required" });
    }
    next();
  } catch (error) {
    console.error("Require Admin Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const safeErrorMessage = (error: unknown, fallback: string) =>
    process.env.NODE_ENV === "development" && error instanceof Error ? error.message : fallback;

// --- YENİ: TOKEN MUHASEBE MIDDLEWARE'İ ---
// Yanıtı keser (intercept) ve token kullanımını arka planda asenkron olarak kaydeder.
export const tokenTrackerMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const originalJson = res.json.bind(res);
  
  res.json = function (body: Record<string, unknown> | null) {
    const bodyData = body as { usage?: { totalTokenCount?: number, totalTokens?: number } } | null;
    const totalTokens = bodyData?.usage?.totalTokenCount || bodyData?.usage?.totalTokens;
    const userId = req.user?.id; // authenticate'den geliyor

    // Sadece başarılı dönen ve içinde usage barındıran AI yanıtlarını yakala
    if (res.statusCode >= 200 && res.statusCode < 300 && userId && totalTokens && totalTokens > 0) {
      // Yanıtın gecikmemesi için fire-and-forget asenkron çalıştırıyoruz
      (async () => {
        if (!supabaseAdmin) return;
        try {
          const { data: profile, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select('ai_tokens_used')
            .eq('id', userId)
            .single();
            
          if (fetchError && fetchError.code !== 'PGRST116') { // Not found harici hatalar
            throw fetchError;
          }
            
          const currentTokens = profile?.ai_tokens_used || 0;
          const newTotal = currentTokens + totalTokens;
          
          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ ai_tokens_used: newTotal })
            .eq('id', userId);

          if (updateError) throw updateError;
            
          console.log(`[Token Muhasebe] Danışman ID: ${userId} | Harcanan: ${totalTokens} | Toplam: ${newTotal}`);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[Token Muhasebe Hatası]:", msg);
        }
      })();
    }
    
    // Akışı bozmadan orijinal json fonksiyonunu çağırıp frontend'e veriyi yolla
    return originalJson.call(this, body);
  };
  next();
};

export const handleAIGeneration = async (req: AuthRequest, res: Response) => {
  try {
    const { model, contents, systemInstruction, responseSchema } = req.body;
    const userId = req.user?.id;

    // 1. Model Allowlist Check
    const targetModel = model || "gemini-3-flash-preview";
    if (!ALLOWED_MODELS.includes(targetModel)) {
      return res.status(400).json({ error: `Geçersiz model seçimi: ${targetModel}. Sadece izin verilen modeller kullanılabilir.` });
    }

    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });

    // 2. Token Limit Check (Server-side Enforcement)
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('ai_tokens_used, tier')
      .eq('id', userId)
      .single();

    if (fetchError || !profile) {
      return res.status(404).json({ error: "Kullanıcı profili bulunamadı." });
    }

    const limit = profile.tier === 'pro' ? 10000 : 1000;
    const currentUsage = profile.ai_tokens_used || 0;

    if (currentUsage >= limit) {
      return res.status(403).json({ 
        error: "Yapay zeka kullanım limitiniz doldu.", 
        details: "Daha fazla kullanım için Portfy Pro paketinize geçiş yapabilir veya bir sonraki ayı bekleyebilirsiniz." 
      });
    }

    if (!contents) {
      return res.status(400).json({ error: "İşlenecek içerik (contents) gönderilmedi." });
    }

    const config: Record<string, unknown> = {
      responseMimeType: "application/json",
    };

    if (responseSchema) {
      config.responseSchema = responseSchema;
    }

    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    const genAi = getGenerativeAI();
    if (!genAi) {
      return res.status(500).json({ error: "Yapay zeka servisi yapılandırılmamış." });
    }

    const response = await genAi.models.generateContent({
      model: targetModel,
      contents: contents,
      config: config
    });

    const usageMetadata = response.usageMetadata;
    let cleanJson = response.text || "{}";
    cleanJson = cleanJson.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(cleanJson);
    
    // Sadece veriyi dönüyoruz. DB yazma işini middleware otomatik yakalayacak.
    res.json({ 
      success: true, 
      data: parsedData,
      usage: usageMetadata 
    });

  } catch (error: unknown) {
    console.error("AI Generation Backend Error:", error);
    res.status(500).json({ error: "Yapay zeka işlemi başarısız oldu", details: safeErrorMessage(error, "İşlem sırasında bir hata oluştu") });
  }
};

export const handleUpdateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { data } = req.body;
    const userId = req.user.id;

    const SAFE_FIELDS = [
      'display_name',
      'phone',
      'avatar_url',
      'avatar_color',
      'bio',
      'city',
      'district',
      'region',
      'has_seen_onboarding',
      'has_seen_tour',
      'notification_settings'
    ];

    const filteredData: Record<string, unknown> = {};
    Object.keys(data).forEach(key => {
      if (SAFE_FIELDS.includes(key)) {
        filteredData[key] = data[key];
      }
    });

    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
    const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
    
    const userSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${req.accessToken}` } }
    });

    const { error } = await userSupabase
      .from('profiles')
      .update(filteredData)
      .eq('id', userId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: unknown) {
    console.error("Profile Update Error:", error);
    res.status(500).json({ error: safeErrorMessage(error, "Profile update failed.") });
  }
};

export const handleSubscribe = async (req: AuthRequest, res: Response) => {
  console.log(`[handleSubscribe] START - Body:`, req.body);
  try {
    const { type } = req.body;
    const userId = req.user.id;

    console.log(`[handleSubscribe] Processing - User: ${userId}, Type: ${type}`);

    if (!['trial', '1-month', '3-month', '6-month', '12-month'].includes(type)) {
      return res.status(400).json({ error: "Invalid subscription type" });
    }

    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });

    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('subscription_type, role')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error(`[handleSubscribe] Error fetching profile:`, fetchError);
      return res.status(404).json({ 
        error: "User profile not found", 
        ...(process.env.NODE_ENV === "development" ? { details: fetchError } : {})
      });
    }
    if (!profile) {
      console.error(`[handleSubscribe] No profile found for id: ${userId}`);
      return res.status(404).json({ error: "User profile not found" });
    }

    if (type !== 'trial') {
      return res.status(403).json({ 
        error: "Direct upgrade blocked. Please complete payment or contact support for manual activation." 
      });
    }

    const d = new Date();
    d.setDate(d.getDate() + 7);
    const endDate = d.toISOString();

    console.log(`[handleSubscribe] Calling RPC activate_trial_v2 for ${userId}`);
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('activate_trial_v2', {
      p_user_id: userId,
      p_end_date: endDate
    });

    if (rpcError) {
      console.error("RPC Error (activate_trial_v2) - System Error:", rpcError);
      return res.status(500).json({ 
        error: process.env.NODE_ENV === "development" ? "Database RPC error" : "İşlem sırasında beklenmeyen bir hata oluştu.", 
        ...(process.env.NODE_ENV === "development" ? { details: rpcError.message, code: rpcError.code } : {})
      });
    }

    if (!rpcResult.success) {
      console.warn("Trial Activation Failed (Business Logic):", rpcResult.error, rpcResult.detail);
      return res.status(400).json({ 
        error: rpcResult.error,
        ...(process.env.NODE_ENV === "development" && rpcResult.detail ? { detail: rpcResult.detail } : {})
      });
    }

    console.log(`[handleSubscribe] SUCCESS for ${userId}`);
    res.json({ success: true, tier: 'pro', endDate });
  } catch (error: unknown) {
    console.error("Subscription Error:", error);
    res.status(500).json({ error: safeErrorMessage(error, "Abonelik hatası") });
  }
};

export const handleAdminUpdateUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });
    const { id, data } = req.body;

    if (!id || !data) {
      return res.status(400).json({ error: "Missing id or data" });
    }

    const ADMIN_UPDATE_ALLOWLIST = ['display_name', 'phone', 'role', 'subscription_type', 'subscription_end_date', 'tier', 'broker_level', 'avatar_url', 'city', 'district', 'region', 'is_active'];
    const filteredData: Record<string, unknown> = {};
    Object.keys(data).forEach(key => {
      if (ADMIN_UPDATE_ALLOWLIST.includes(key)) {
        filteredData[key] = data[key];
      }
    });

    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update(filteredData)
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: unknown) {
    console.error("Admin Update Error:", error);
    res.status(500).json({ error: safeErrorMessage(error, "Güncelleme hatası") });
  }
};

export const handleAdminDeleteUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Missing id" });
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: unknown) {
    console.error("Admin Delete User Error:", error);
    res.status(500).json({ error: safeErrorMessage(error, "Silme hatası") });
  }
};

export const handleAdminGetUsers = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error: unknown) {
    console.error("Admin Get Users Error:", error);
    res.status(500).json({ error: safeErrorMessage(error, "Get users hatası") });
  }
};

export const handleAdminGetSettings = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });
    const { data, error } = await supabaseAdmin
      .from('global_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error) throw error;

    res.json(data || {});
  } catch (error: unknown) {
    console.error("Admin Get Settings Error:", error);
    res.status(500).json({ error: safeErrorMessage(error, "Get settings hatası") });
  }
};

export const handleEarnXP = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });
    const { actionType, taskId, leadId, propertyId, sessionId, stats } = req.body;
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    if (!actionType) {
      return res.status(400).json({ error: "Missing actionType" });
    }

    const entityId = leadId || propertyId || sessionId || taskId || null;

    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('award_xp', {
      p_user_id: userId,
      p_action_type: actionType,
      p_entity_id: entityId,
      p_today: today,
      p_now: now,
      p_stats: stats || {}
    });

    if (rpcError) throw rpcError;

    if (!rpcResult.success) {
      return res.status(400).json({ error: rpcResult.error || "XP kazanılamadı" });
    }

    res.json(rpcResult);
  } catch (error: unknown) {
    console.error("Earn XP Error:", error);
    res.status(500).json({ error: safeErrorMessage(error, "Earn XP hatası") });
  }
};

export const handleUpdateGlobalSettings = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });
    const { settings } = req.body;

    if (!settings) {
      return res.status(400).json({ error: "Missing settings" });
    }

    const { error } = await supabaseAdmin
      .from('global_settings')
      .upsert({
        id: 'default',
        ...settings,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    res.json({ success: true });
  } catch (error: unknown) {
    console.error("Global Settings Update Error:", error);
    res.status(500).json({ error: safeErrorMessage(error, "Global ayarlar güncelleme hatası") });
  }
};