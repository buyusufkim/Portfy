import { GoogleGenAI } from "@google/genai";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { User } from "@supabase/supabase-js";
import { Request, Response, NextFunction } from "express";
import { 
  getEffectiveAiTokenLimit, 
  ProfileForSubscriptionRules 
} from "../src/shared/subscriptionRules.js";

const isAdminRole = (role?: string | null): boolean => {
  return role === 'admin' || role === 'super_admin';
};

export interface AuthRequest extends Request {
  user?: User;
  accessToken?: string;
}
import { createClient } from "@supabase/supabase-js";
import { addMonths } from "date-fns";
import * as dotenv from "dotenv";
import { getTurkeyTodayISO } from "./time.js";
import { getFeatureConfig } from "./ai-features.js";

dotenv.config({ override: true });

export function calculateContentTextLength(contents: unknown): number {
  if (typeof contents === "string") {
    return contents.length;
  }
  if (Array.isArray(contents)) {
    let length = 0;
    for (const item of contents) {
      if (item && typeof item === "object" && Array.isArray(item.parts)) {
        for (const part of item.parts) {
          if (part && typeof part.text === "string") {
            length += part.text.length;
          }
          if (part && part.inlineData && typeof part.inlineData.data === "string") {
            // Rough size estimate for base64: character count
            length += part.inlineData.data.length; 
          }
        }
      }
    }
    return length;
  }
  return 0;
}

export const getGenerativeAI = () => {
  const GEMINI_API_KEY = process.env.GEMINI_SV_KEY || process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY || GEMINI_API_KEY.includes("your-gemini-key")) {
    console.warn("WARNING: GEMINI_SV_KEY and GEMINI_API_KEY are not defined or invalid.");
    return null;
  }
  return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
};

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL) {
  console.error(
    "CRITICAL: SUPABASE_URL or VITE_SUPABASE_URL is not defined in environment variables.",
  );
}
if (!SUPABASE_ANON_KEY) {
  console.error(
    "CRITICAL: SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY is not defined in environment variables.",
  );
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  if (process.env.NODE_ENV === "production") {
    console.error(
      "CRITICAL: SUPABASE_SERVICE_ROLE_KEY is required in production",
    );
  } else {
    console.warn(
      "WARNING: SUPABASE_SERVICE_ROLE_KEY is not defined. Privileged backend operations will fail.",
    );
  }
}

const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Admin client for privileged operations - NO FALLBACK
const supabaseAdmin = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

const ALLOWED_MODELS = [
  "gemini-flash-latest",
  "gemini-3-flash-preview",
  "gemini-3.1-pro-preview",
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite-preview",
  "gemini-2.0-pro-exp-02-05",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro-latest",
];

function getRateLimitKey(req: Request): string {
  const userId = (req as AuthRequest).user?.id;
  if (userId) return `user:${userId}`;
  return ipKeyGenerator(req.ip || "unknown");
}

// Rate Limiting Middleware
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP/User to 100 requests per window
  keyGenerator: getRateLimitKey,
  message: { error: "Rate limit exceeded. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const xpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: getRateLimitKey,
  message: { error: "XP kazanım limitine ulaşıldı." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication Middleware
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!supabase) {
      return res.status(503).json({ error: "Supabase client not configured" });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

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

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!supabaseAdmin)
      return res.status(503).json({ error: "Privileged service unavailable" });
    const adminId = req.user?.id;
    if (!adminId) return res.status(401).json({ error: "Unauthorized" });

    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", adminId)
      .single();

    if (adminError || !isAdminRole(adminProfile?.role)) {
      return res
        .status(403)
        .json({ error: "Unauthorized: Admin access required" });
    }
    next();
  } catch (error) {
    console.error("Require Admin Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const safeErrorMessage = (error: unknown, fallback: string) =>
  process.env.NODE_ENV === "development" && error instanceof Error
    ? error.message
    : fallback;

// --- YENİ: TOKEN MUHASEBE MIDDLEWARE'İ ---
// Yanıtı keser (intercept) ve token kullanımını arka planda asenkron olarak kaydeder.
export function normalizeAiUsage(usage: any): { promptTokens: number; completionTokens: number; totalTokens: number } {
  if (!usage) return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  const promptTokens = usage.promptTokenCount || usage.prompt_tokens || 0;
  const completionTokens = usage.candidatesTokenCount || usage.completion_tokens || 0;
  let totalTokens = usage.totalTokenCount || usage.total_tokens || usage.totalTokens || 0;
  
  if (!totalTokens) {
    totalTokens = promptTokens + completionTokens;
  }
  
  return {
    promptTokens,
    completionTokens,
    totalTokens
  };
}

export const tokenTrackerMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const originalJson = res.json.bind(res);

  res.json = function (body: Record<string, unknown> | null) {
    const bodyData = body as {
      usage?: unknown;
    } | null;
    
    const usageObj = normalizeAiUsage(bodyData?.usage);
    const totalTokens = usageObj.totalTokens;
    const userId = req.user?.id; // authenticate'den geliyor

    // Sadece başarılı dönen ve içinde usage barındıran AI yanıtlarını yakala
    if (
      res.statusCode >= 200 &&
      res.statusCode < 300 &&
      userId &&
      totalTokens > 0
    ) {
      // Yanıtın gecikmemesi için fire-and-forget asenkron çalıştırıyoruz
      (async () => {
        if (!supabaseAdmin) return;
        try {
          // RPC üzerinden tokenleri profiles üzerine atomic olarak ekle
          const { error: rpcError } = await supabaseAdmin.rpc("increment_ai_tokens", { 
            p_user_id: userId, 
            p_tokens: totalTokens 
          });

          if (rpcError) throw rpcError;

          // Sonrasında ek logları alalım
          const featureKey = req.body?.featureKey || 'unknown';
          const reqModel = req.body?.model || 'unknown';
          const responseModel = (bodyData as any)?.model || reqModel; // resolved model eğer dönerse

          const { error: logError } = await supabaseAdmin.from('ai_request_logs').insert({
            user_id: userId,
            prompt_tokens: usageObj.promptTokens,
            completion_tokens: usageObj.completionTokens,
            total_tokens: totalTokens,
            model_name: responseModel,
            feature_key: featureKey,
            request_id: (req as any).requestId || null,
            status_code: res.statusCode
          });

          if (logError) {
             console.error("[Token Muhasebe Hatası] AI log insert edilemedi:", logError);
          }

          console.log(
            `[Token Muhasebe] Danışman ID: ${userId} | Harcanan (Atomic): ${totalTokens}`
          );
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
    const { model, contents, systemInstruction, responseSchema, featureKey } = req.body;
    const userId = req.user?.id;

    let featureConfig;
    try {
      if (!featureKey) {
        return res.status(400).json({ error: "invalid_ai_feature", message: "AI featureKey zorunludur." });
      }
      featureConfig = getFeatureConfig(featureKey);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Bilinmeyen AI feature hatası";
      return res.status(400).json({ error: "invalid_ai_feature", message });
    }

    // 1. Model Allowlist Check
    const targetModel = model || featureConfig.defaultModel;
    if (!ALLOWED_MODELS.includes(targetModel) || !featureConfig.allowedModels.includes(targetModel)) {
      return res
        .status(400)
        .json({
          error: `Geçersiz model seçimi: ${targetModel}. Sadece izin verilen modeller kullanılabilir.`,
        });
    }

    if (!supabaseAdmin)
      return res.status(503).json({ error: "Privileged service unavailable" });

    if (!contents) {
      return res
        .status(400)
        .json({ error: "İşlenecek içerik (contents) gönderilmedi." });
    }

    const inputLength = calculateContentTextLength(contents);
    if (inputLength > featureConfig.maxInputChars) {
      return res.status(413).json({ error: "İşlenecek içerik boyutu çok büyük." });
    }

    // 2. Token Limit Check (Server-side Enforcement)
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("ai_tokens_used, tier, ai_token_limit, role, subscription_type, subscription_end_date")
      .eq("id", userId)
      .single();

    if (fetchError || !profile) {
      return res.status(404).json({ error: "Kullanıcı profili bulunamadı." });
    }

    const limit = getEffectiveAiTokenLimit(profile);
    const currentUsage = profile.ai_tokens_used || 0;

    if (currentUsage >= limit) {
      return res.status(403).json({
        error: "Yapay zeka kullanım limitiniz doldu.",
        details:
          "Daha fazla kullanım için paketinizi yükseltebilirsiniz. Mevcut limitinizi aştınız.",
      });
    }

    const config: Record<string, unknown> = {
      responseMimeType: "application/json",
    };

    if (featureConfig.responseSchema) {
      config.responseSchema = featureConfig.responseSchema;
    } else if (responseSchema && featureConfig.allowClientResponseSchema) {
      config.responseSchema = responseSchema;
    } else if (featureKey === "generic_safe_json" && !responseSchema) {
      // Fallback schema for generic
      config.responseSchema = {
        type: "object",
        properties: {
          response: { type: "string", description: "Default response text" },
          status: { type: "string", description: "Status code or generic status" }
        }
      };
    } else if (!featureConfig.responseSchema && !featureConfig.allowClientResponseSchema) {
      // Not allowed to provide schema and registry didn't define one, just don't set responseSchema.
    } else if (responseSchema) {
      // Client schema ignored
      console.warn(`Feature ${featureKey} disabled client responseSchema. Ignored.`);
    }

    if (featureConfig.systemInstruction) {
      config.systemInstruction = featureConfig.systemInstruction;
    } else if (systemInstruction && featureConfig.allowClientSystemInstruction) {
      config.systemInstruction = systemInstruction;
    } else if (systemInstruction) {
      console.warn(`Feature ${featureKey} disabled client systemInstruction. Ignored.`);
    }

    const genAi = getGenerativeAI();
    if (!genAi) {
      return res
        .status(503)
        .json({ error: "Yapay zeka servisi yapılandırılmamış." });
    }

    const response = await genAi.models.generateContent({
      model: targetModel,
      contents: contents,
      config: config,
    });

    const usageMetadata = response.usageMetadata;
    let cleanJson = response.text || "{}";
    
    if (typeof cleanJson !== "string") {
      cleanJson = String(cleanJson);
    }
    
    cleanJson = cleanJson
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
      
    let parsedData: Record<string, unknown> | unknown[] = {};
    try {
      if (cleanJson) {
        parsedData = JSON.parse(cleanJson);
        // Schema validate + safe fallback: ensure it's an object/array at least
        if (typeof parsedData !== "object" || parsedData === null) {
          console.warn("AI didn't return an object/array. Fallback.");
          parsedData = { response: String(parsedData), warning: "Invalid schema mapped to default" };
        }
      }
    } catch (e) {
      console.error("AI JSON parse error:", e);
      const debugId = `parse_err_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      return res.status(422).json({ 
         error: "AI_PARSE_ERROR",
         message: "Model dönüşü anlaşılamadı, veri formatı hatalı.",
         debug_id: debugId,
         ...(process.env.NODE_ENV !== "production" ? { raw_output: cleanJson.substring(0, 120) } : {})
      });
    }

    // Sadece veriyi dönüyoruz. DB yazma işini middleware otomatik yakalayacak.
    res.json({
      success: true,
      data: parsedData,
      usage: usageMetadata,
    });
  } catch (error: unknown) {
    console.error("AI Generation Backend Error:", error);
    
    // Log the AI error
    const errorMessage = error instanceof Error ? error.message : String(error);
    import("./runtime-logger.js").then(({ logRuntimeError }) => {
      logRuntimeError({
        requestId: (req as any).requestId,
        userId: req.user?.id,
        route: '/api/ai/generate',
        method: 'POST',
        statusCode: 500,
        message: errorMessage,
        source: 'ai',
        severity: 'error',
        errorCode: 'AI_PROVIDER_ERROR'
      });
    }).catch(err => console.error('Failed to load runtime-logger', err));

    res
      .status(500)
      .json({
        error: "Yapay zeka işlemi başarısız oldu",
        details: safeErrorMessage(error, "İşlem sırasında bir hata oluştu"),
      });
  }
};

export const handleUpdateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { data } = req.body;
    const userId = req.user.id;

    const SAFE_FIELDS = [
      "display_name",
      "phone",
      "avatar_url",
      "avatar_color",
      "bio",
      "city",
      "district",
      "region",
      "has_seen_onboarding",
      "has_seen_tour",
      "notification_settings",
      "company_name",
      "title",
      "whatsapp",
      "instagram",
      "website",
      "expertise_areas",
      "working_style",
      "preferred_start_time",
      "ai_coach_tone",
      "notification_preference"
    ];

    const filteredData: Record<string, unknown> = {};
    Object.keys(data).forEach((key) => {
      if (SAFE_FIELDS.includes(key)) {
        filteredData[key] = data[key];
      }
    });

    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res.status(503).json({ error: "Supabase client not configured" });
    }

    const userSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${req.accessToken}` } },
    });

    const { data: updatedData, error } = await userSupabase
      .from("profiles")
      .update(filteredData)
      .eq("id", userId)
      .select("id")
      .single();

    if (error) throw error;
    if (!updatedData) {
      return res
        .status(403)
        .json({ error: "Profile not found or permission denied" });
    }

    res.json({ success: true });
  } catch (error: unknown) {
    console.error("Profile Update Error:", error);
    res
      .status(500)
      .json({ error: safeErrorMessage(error, "Profile update failed.") });
  }
};

export const handleSubscribe = async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.body;
    const userId = req.user.id;

    console.log(
      `[handleSubscribe] Processing - User: ${userId}, Type: ${type}`,
    );

    if (
      !["trial", "1-month", "3-month", "6-month", "12-month"].includes(type)
    ) {
      return res.status(400).json({ error: "Invalid subscription type" });
    }

    if (!supabaseAdmin)
      return res.status(503).json({ error: "Privileged service unavailable" });

    const { data: profile, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("subscription_type, role")
      .eq("id", userId)
      .single();

    if (fetchError) {
      console.error(`[handleSubscribe] Error fetching profile:`, fetchError);
      return res.status(404).json({
        error: "User profile not found",
        ...(process.env.NODE_ENV === "development"
          ? { details: fetchError }
          : {}),
      });
    }
    if (!profile) {
      console.error(`[handleSubscribe] No profile found for id: ${userId}`);
      return res.status(404).json({ error: "User profile not found" });
    }

    if (type !== "trial") {
      return res.status(403).json({
        error:
          "Direct upgrade blocked. Please complete payment or contact support for manual activation.",
      });
    }

    const d = new Date();
    d.setDate(d.getDate() + 7);
    const endDate = d.toISOString();

    console.log(
      `[handleSubscribe] Calling RPC activate_trial_v2 for ${userId}`,
    );
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
      "activate_trial_v2",
      {
        p_user_id: userId,
        p_end_date: endDate,
      },
    );

    if (rpcError) {
      console.error("RPC Error (activate_trial_v2) - System Error:", rpcError);
      return res.status(500).json({
        error:
          process.env.NODE_ENV === "development"
            ? "Database RPC error"
            : "İşlem sırasında beklenmeyen bir hata oluştu.",
        ...(process.env.NODE_ENV === "development"
          ? { details: rpcError.message, code: rpcError.code }
          : {}),
      });
    }

    if (!rpcResult.success) {
      console.warn(
        "Trial Activation Failed (Business Logic):",
        rpcResult.error,
        rpcResult.detail,
      );
      return res.status(400).json({
        error: rpcResult.error,
        ...(process.env.NODE_ENV === "development" && rpcResult.detail
          ? { detail: rpcResult.detail }
          : {}),
      });
    }

    console.log(`[handleSubscribe] SUCCESS for ${userId}`);
    res.json({ success: true, tier: "pro", endDate });
  } catch (error: unknown) {
    console.error("Subscription Error:", error);
    res.status(500).json({ error: safeErrorMessage(error, "Abonelik hatası") });
  }
};

export const handleAdminUpdateUser = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    if (!supabaseAdmin)
      return res.status(503).json({ error: "Privileged service unavailable" });
    const { id, data } = req.body;

    if (!id || !data) {
      return res.status(400).json({ error: "Missing id or data" });
    }

    const ADMIN_UPDATE_ALLOWLIST = [
      "display_name",
      "phone",
      "role",
      "subscription_type",
      "subscription_end_date",
      "tier",
      "broker_level",
      "avatar_url",
      "city",
      "district",
      "region",
      "is_active",
    ];
    const filteredData: Record<string, unknown> = {};
    Object.keys(data).forEach((key) => {
      if (ADMIN_UPDATE_ALLOWLIST.includes(key)) {
        filteredData[key] = data[key];
      }
    });

    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const { data: updatedData, error } = await supabaseAdmin
      .from("profiles")
      .update(filteredData)
      .eq("id", id)
      .select("id")
      .single();

    if (error) throw error;
    if (!updatedData) {
      return res.status(404).json({ error: "User not found" });
    }

    await logAdminAudit(req.user?.id || '', id, 'USER_SUBSCRIPTION_UPDATED', filteredData);

    res.json({ success: true, id: updatedData.id });
  } catch (error: unknown) {
    console.error("Admin Update Error:", error);
    res
      .status(500)
      .json({ error: safeErrorMessage(error, "Güncelleme hatası") });
  }
};

export const handleAdminDeleteUser = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    if (!supabaseAdmin)
      return res.status(503).json({ error: "Privileged service unavailable" });
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Missing id" });
    }

    if (id === req.user.id) {
      return res.status(400).json({ error: "Cannot delete your own admin account" });
    }

    const { data: userProfile } = await supabaseAdmin.from('profiles').select('display_name, email').eq('id', id).maybeSingle();

    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (error) throw error;

    await logAdminAudit(req.user?.id || '', null, 'USER_DELETED', { 
      deletedUserId: id,
      display_name: userProfile?.display_name,
      email: userProfile?.email
    });

    res.json({ success: true });
  } catch (error: unknown) {
    console.error("Admin Delete User Error:", error);
    res.status(500).json({ error: safeErrorMessage(error, "Silme hatası") });
  }
};

export const handleAdminResetToken = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    if (!supabaseAdmin)
      return res.status(503).json({ error: "Privileged service unavailable" });
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Missing id" });
    }

    const { data: updatedData, error } = await supabaseAdmin
      .from("profiles")
      .update({ ai_tokens_used: 0 })
      .eq("id", id)
      .select("id")
      .single();

    if (error) throw error;
    if (!updatedData) {
      return res.status(404).json({ error: "User not found" });
    }

    await logAdminAudit(req.user?.id || '', id, 'USER_TOKEN_RESET', { action: 'ai_tokens_used reset to 0' });

    res.json({ success: true });
  } catch (error: unknown) {
    console.error("Admin Reset Token Error:", error);
    res.status(500).json({ error: safeErrorMessage(error, "Token sıfırlama hatası") });
  }
};

export const handleAdminResetToday = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    if (!supabaseAdmin)
      return res.status(503).json({ error: "Privileged service unavailable" });

    // Endpoint must ONLY use the authenticated admin's own ID
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const todayStr = getTurkeyTodayISO(new Date());

    // 1. Reset profiles.last_day_started_at, last_ritual_completed_at, etc
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        last_day_started_at: null,
        last_ritual_completed_at: null,
        last_morning_ritual_xp_at: null,
        last_evening_ritual_xp_at: null,
        last_end_day_xp_at: null,
        // Optional: you can decrement streak later if needed, but not required yet
      })
      .eq("id", userId);

    if (profileError) throw profileError;

    // 2. Delete today's daily plan
    const { error: planError } = await supabaseAdmin
      .from("daily_plan")
      .delete()
      .eq("user_id", userId)
      .eq("plan_date", todayStr);

    if (planError) throw planError;

    // 3. Delete today's day closure
    const { error: closureError } = await supabaseAdmin
      .from("day_closure")
      .delete()
      .eq("user_id", userId)
      .eq("closure_date", todayStr);

    if (closureError) throw closureError;

    // 4. Delete today's ritual-related micro_goals (day_start_focus, day_close_tomorrow_focus, daily_focus)
    const todayObj = new Date(todayStr); // Parses as UTC standard time e.g. '2026-05-03' defaults to Midnight UTC
    const tomorrowObj = new Date(todayObj);
    tomorrowObj.setDate(tomorrowObj.getDate() + 1);

    const { error: mgError } = await supabaseAdmin
      .from("micro_goals")
      .delete()
      .eq("user_id", userId)
      .in("target_metric", ["day_start_focus", "day_close_tomorrow_focus", "daily_focus"])
      .gte("deadline", todayObj.toISOString())
      .lt("deadline", tomorrowObj.toISOString());

    if (mgError) throw mgError;

    await logAdminAudit(userId, userId, 'RESET_TODAY_DEBUG', { action: `Reset daily logs for ${todayStr}` });

    res.json({ success: true, message: `Bugünkü (${todayStr}) test kayıtlarınız temizlendi.` });
  } catch (error: unknown) {
    console.error("Admin Reset Today Error:", error);
    res.status(500).json({ error: safeErrorMessage(error, "Bugünü sıfırlama hatası") });
  }
};

export const handleAdminGetUsers = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin)
      return res.status(503).json({ error: "Privileged service unavailable" });

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 50));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabaseAdmin
      .from("profiles")
      .select("id, email, display_name, phone, role, subscription_type, subscription_end_date, tier, broker_level, city, district, region, is_active, ai_tokens_used, ai_token_limit, created_at, updated_at", { count: 'exact' })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    res.json({ data, page, pageSize, count });
  } catch (error: unknown) {
    console.error("Admin Get Users Error:", error);
    res
      .status(500)
      .json({ error: safeErrorMessage(error, "Get users hatası") });
  }
};

export const handleAdminGetSettings = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    if (!supabaseAdmin)
      return res.status(503).json({ error: "Privileged service unavailable" });
    const { data, error } = await supabaseAdmin
      .from("system_settings")
      .select("whatsapp_number")
      .eq("id", 1)
      .maybeSingle();

    if (error) throw error;

    res.json(data || {});
  } catch (error: unknown) {
    console.error("Admin Get Settings Error:", error);
    res
      .status(500)
      .json({ error: safeErrorMessage(error, "Get settings hatası") });
  }
};

export const handleGetDailyPlanToday = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin)
      return res.status(503).json({ error: "Privileged service unavailable" });

    const userId = req.user.id;
    const todayStr = getTurkeyTodayISO(new Date());

    const { data, error } = await supabaseAdmin
      .from("daily_plan")
      .select("*")
      .eq("user_id", userId)
      .eq("plan_date", todayStr)
      .maybeSingle();

    if (error) {
        return res.status(500).json({ error: safeErrorMessage(error, "Failed to get daily plan") });
    }

    return res.json(data || null);
  } catch (error: unknown) {
    console.error("Get Daily Plan Error:", error);
    res.status(500).json({ error: safeErrorMessage(error, "Failed to get daily plan") });
  }
};

export const handleSaveDailyPlan = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin)
      return res.status(503).json({ error: "Privileged service unavailable" });

    const userId = req.user.id;
    const todayStr = getTurkeyTodayISO(new Date());
    
    // Discard any date/today/plan_date from req.body
    const payload = { ...req.body };
    delete payload.plan_date;
    delete payload.date;
    delete payload.today;
    delete payload.user_id;

    const { data, error } = await supabaseAdmin
      .from("daily_plan")
      .upsert(
        { 
          ...payload, 
          user_id: userId, 
          plan_date: todayStr, 
          updated_at: new Date().toISOString() 
        }, 
        { onConflict: "user_id, plan_date" }
      )
      .select()
      .single();

    if (error) {
        return res.status(500).json({ error: safeErrorMessage(error, "Failed to save daily plan") });
    }

    return res.json(data);
  } catch (error: unknown) {
    console.error("Save Daily Plan Error:", error);
    res.status(500).json({ error: safeErrorMessage(error, "Failed to save daily plan") });
  }
};

export const handleGetDayClosureToday = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin)
      return res.status(503).json({ error: "Privileged service unavailable" });

    const userId = req.user.id;
    const todayStr = getTurkeyTodayISO(new Date());

    const { data, error } = await supabaseAdmin
      .from("day_closure")
      .select("*")
      .eq("user_id", userId)
      .eq("closure_date", todayStr)
      .maybeSingle();

    if (error) {
        return res.status(500).json({ error: safeErrorMessage(error, "Failed to get day closure") });
    }

    return res.json(data || null);
  } catch (error: unknown) {
    console.error("Get Day Closure Error:", error);
    res.status(500).json({ error: safeErrorMessage(error, "Failed to get day closure") });
  }
};

export const handleSaveDayClosure = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin)
      return res.status(503).json({ error: "Privileged service unavailable" });

    const userId = req.user.id;
    const todayStr = getTurkeyTodayISO(new Date());
    
    const payload = req.body;
    
    // Fetch profile to get last_day_started_at
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("last_day_started_at")
      .eq("id", userId)
      .single();

    const nowIso = new Date().toISOString();
    let day_started_at = payload.day_started_at || null;
    let day_closed_at = payload.day_closed_at || nowIso;
    let work_duration_minutes = payload.work_duration_minutes || null;

    if (!day_started_at && profile?.last_day_started_at) {
        // Only use if it corresponds to today roughly
        const startTodayStr = getTurkeyTodayISO(new Date(profile.last_day_started_at));
        if (startTodayStr === todayStr) {
            day_started_at = profile.last_day_started_at;
        }
    }

    if (day_started_at && day_closed_at && work_duration_minutes === null) {
        const diffMs = new Date(day_closed_at).getTime() - new Date(day_started_at).getTime();
        work_duration_minutes = Math.max(0, Math.floor(diffMs / 60000));
    }
    
    // Normalize payload to match DB schema exactly like frontend
    const normalizedPayload = {
      user_id: userId,
      closure_date: todayStr,
      updated_at: nowIso,
      wins: payload.wins,
      blockers: payload.blockers,
      tomorrow_top3: payload.top3_tomorrow || payload.tomorrow_top3,
      completed_calls: payload.calls || payload.completed_calls || 0,
      completed_portfolio_actions: payload.visits || payload.completed_portfolio_actions || 0,
      completed_followups: payload.completed_followups || 0,
      early_close_reason: payload.early_close_reason,
      campaign_focus_reflection: payload.campaign_focus_reflection,
      discipline_score: payload.discipline_score,
      campaign_day: payload.campaign_day,
      day_started_at,
      day_closed_at,
      work_duration_minutes
    };

    const { data, error } = await supabaseAdmin
      .from("day_closure")
      .upsert(normalizedPayload, { onConflict: "user_id, closure_date" })
      .select()
      .single();

    if (error) {
        return res.status(500).json({ error: safeErrorMessage(error, "Failed to save day closure") });
    }

    return res.json(data);
  } catch (error: unknown) {
    console.error("Save Day Closure Error:", error);
    res.status(500).json({ error: safeErrorMessage(error, "Failed to save day closure") });
  }
};

const verifyGamifiedTaskServer = async (userId: string, taskId: string): Promise<{ verified: boolean, message?: string }> => {
    if (!supabaseAdmin) return { verified: false, message: "Privileged service unavailable" };

    const { data: task, error: taskError } = await supabaseAdmin
        .from("gamified_tasks")
        .select("id,user_id,title,source,auto_verify,template_id,action_type,is_completed,date")
        .eq("id", taskId)
        .eq("user_id", userId)
        .single();

    if (taskError || !task) {
        return { verified: false, message: "Task not found" };
    }

    const { title, source, auto_verify } = task;

    if (!title) {
        return { verified: false, message: "Missing title" };
    }

    const getTurkeyDateFromTimestamp = (value?: string | null): string | null => {
      if (!value) return null;
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return null;
      return getTurkeyTodayISO(d);
    };

    const todayStr = getTurkeyTodayISO(new Date());
    const titleLower = title.toLowerCase();

    if (titleLower.includes("müşteri") || titleLower.includes("lead")) {
        const { count } = await supabaseAdmin
            .from("leads")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .gte("created_at", `${todayStr}T00:00:00+03:00`);
            
        const match = titleLower.match(/(\d+)/);
        const target = match ? parseInt(match[1], 10) : 1;

        if ((count || 0) >= target) return { verified: true };
        return {
            verified: false,
            message: `Bugün ${count || 0}/${target} müşteri ekledin. ${target - (count || 0)} kişi daha eklemelisin!`,
        };
    }

    if (titleLower.includes("portföy")) {
        const { count } = await supabaseAdmin
            .from("properties")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .gte("created_at", `${todayStr}T00:00:00+03:00`);

        const match = titleLower.match(/(\d+)/);
        const target = match ? parseInt(match[1], 10) : 1;

        if ((count || 0) >= target) return { verified: true };
        return {
            verified: false,
            message: `Bugün ${count || 0}/${target} portföy ekledin. ${target - (count || 0)} portföy daha eklemelisin!`,
        };
    }

    if (titleLower.includes("görev")) {
        const { count } = await supabaseAdmin
            .from("personal_tasks")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("is_completed", true)
            .gte("updated_at", `${todayStr}T00:00:00+03:00`);

        const match = titleLower.match(/(\d+)/);
        const target = match ? parseInt(match[1], 10) : 1;

        if ((count || 0) >= target) return { verified: true };
        return {
            verified: false,
            message: `Bugün ${count || 0}/${target} kişisel görev tamamladın!`,
        };
    }

    if (titleLower.includes("sabah ritüeli") || titleLower.includes("erken başla")) {
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("last_day_started_at")
            .eq("id", userId)
            .single();
        const startedDate = getTurkeyDateFromTimestamp(profile?.last_day_started_at);
        if (startedDate === todayStr) return { verified: true };
        return {
            verified: false,
            message: "Sabah ritüelini henüz tamamlamadın.",
        };
    }

    if (titleLower.includes("akşam ritüeli") || titleLower.includes("kapanış")) {
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("last_ritual_completed_at,last_end_day_xp_at")
            .eq("id", userId)
            .single();
        const endedDate = getTurkeyDateFromTimestamp(profile?.last_ritual_completed_at);
        const xpDate = getTurkeyDateFromTimestamp(profile?.last_end_day_xp_at);
        if (endedDate === todayStr || xpDate === todayStr) return { verified: true };
        return { verified: false, message: "Gün kapanışını henüz yapmadın." };
    }

    if (source === "admin_template") {
        if (!task.template_id) {
            return { verified: false, message: "Template ID eksik." };
        }
        const { data: template } = await supabaseAdmin
            .from("task_templates")
            .select("auto_verify")
            .eq("id", task.template_id)
            .single();
            
        if (template && template.auto_verify === true) {
            return { verified: true };
        }
        return { verified: false, message: "Bu şablon otomatik doğrulanamıyor." };
    }

    if (source === "admin" && auto_verify === true) {
        return { verified: true };
    }

    return {
        verified: false,
        message: "Bu görev otomatik doğrulanamıyor.",
    };
};

export const handleVerifyTask = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.body;
    const userId = req.user.id;

    if (!taskId) {
        return res.status(400).json({ error: "Missing taskId" });
    }

    const verification = await verifyGamifiedTaskServer(userId, taskId);
    if (!verification.verified && verification.message === "Task not found") {
        return res.status(404).json({ error: "Task not found" });
    }

    return res.json(verification);
  } catch (error: unknown) {
    console.error("Verify Task Error:", error);
    res.status(500).json({ error: safeErrorMessage(error, "Görev doğrulama hatası") });
  }
};

export const handleCompleteGamifiedTask = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin)
      return res.status(503).json({ error: "Privileged service unavailable" });
      
    const { taskId } = req.body;
    const userId = req.user.id;

    if (!taskId) {
        return res.status(400).json({ error: "Missing taskId" });
    }

    const { data: task, error: taskError } = await supabaseAdmin
        .from("gamified_tasks")
        .select("is_completed,xp_awarded")
        .eq("id", taskId)
        .eq("user_id", userId)
        .single();

    if (taskError || !task) {
        return res.status(404).json({ error: "Task not found" });
    }

    if (task.xp_awarded) {
        return res.json({ success: true, message: "Task XP is already awarded" });
    }

    const verification = await verifyGamifiedTaskServer(userId, taskId);

    if (!verification.verified) {
        return res.status(400).json({ 
            error: "Verification failed", 
            message: verification.message 
        });
    }

    const nowObj = new Date();
    const today = getTurkeyTodayISO(nowObj);
    const now = nowObj.toISOString();

    if (!task.is_completed) {
        const { error: updateError } = await supabaseAdmin
            .from("gamified_tasks")
            .update({
                is_completed: true,
                completed_at: now
            })
            .eq("id", taskId)
            .eq("user_id", userId);

        if (updateError) {
            throw updateError;
        }
    }

    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
      "award_xp",
      {
        p_user_id: userId,
        p_action_type: "COMPLETE_TASK",
        p_entity_id: taskId,
        p_today: today,
        p_now: now,
      }
    );

    if (rpcError) {
        console.error("RPC Error in completeGamifiedTask:", rpcError);
        return res.status(500).json({ error: "Failed to award XP" });
    }

    if (rpcResult && !rpcResult.success && rpcResult.error !== "XP already awarded") {
         return res.status(400).json({ error: rpcResult.error || "Failed to award XP" });
    }

    return res.json({ success: true, result: rpcResult });

  } catch (error: unknown) {
    console.error("Complete Gamified Task Error:", error);
    res.status(500).json({ error: safeErrorMessage(error, "Failed to complete task") });
  }
};

export const handleEarnXP = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin)
      return res.status(503).json({ error: "Privileged service unavailable" });
    const {
      actionType,
      taskId,
      leadId,
      propertyId,
      sessionId,
      stats,
    } = req.body;
    const userId = req.user.id;

    // Use server time regardless of client payload
    const nowObj = new Date();
    const today = getTurkeyTodayISO(nowObj);
    const now = nowObj.toISOString();

    if (!actionType) {
      return res.status(400).json({ error: "Missing actionType" });
    }

    if (actionType === "COMPLETE_TASK") {
      return res.status(403).json({ error: "Gamified task XP must be awarded through /api/ai/complete-gamified-task." });
    }

    const entityId = leadId || propertyId || sessionId || taskId || null;

    const safeStats = stats && typeof stats === 'object' ? { ...stats } : {};

    const getTurkeyDateFromTimestamp = (value?: string | null): string | null => {
      if (!value) return null;
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return null;
      return getTurkeyTodayISO(d);
    };

    if (actionType === 'DAILY_FOCUS_COMPLETED') {
      if (!entityId) {
        return res.status(400).json({ error: "Missing taskId for DAILY_FOCUS_COMPLETED" });
      }

      // Safe server-side branch for DAILY_FOCUS_COMPLETED, fixed 25 XP
      const { data: goal, error: goalError } = await supabaseAdmin
        .from('micro_goals')
        .select('*')
        .eq('id', entityId)
        .eq('user_id', userId)
        .single();
        
      if (goalError || !goal) {
        return res.status(400).json({ error: "Micro goal not found" });
      }
      
      if (goal.xp_awarded) {
        return res.json({ success: true, message: "XP already awarded", xp_awarded: 0 });
      }

      // Mark as awarded
      await supabaseAdmin.from('micro_goals').update({ xp_awarded: true }).eq('id', entityId);

      // Now we can update overall XP using a custom RPC or directly doing it from profiles table
      const { data: profile } = await supabaseAdmin.from('profiles').select('total_xp, broker_level').eq('id', userId).single();
      if (profile) {
         const newXp = (profile.total_xp || 0) + 25;
         let newLevel = 1;
         if (newXp >= 15000) newLevel = 4;
         else if (newXp >= 5000) newLevel = 3;
         else if (newXp >= 1000) newLevel = 2;
         await supabaseAdmin.from('profiles').update({ total_xp: newXp, broker_level: newLevel }).eq('id', userId);
         
         const { data: currentStats } = await supabaseAdmin.from('user_stats').select('xp_earned, tasks_completed').eq('user_id', userId).eq('date', today).maybeSingle();
         if (currentStats) {
             await supabaseAdmin.from('user_stats').update({ xp_earned: (currentStats.xp_earned || 0) + 25, tasks_completed: (currentStats.tasks_completed || 0) + 1 }).eq('user_id', userId).eq('date', today);
         } else {
             await supabaseAdmin.from('user_stats').insert({ user_id: userId, date: today, xp_earned: 25, tasks_completed: 1, calls_made: 0, visits_made: 0 });
         }
      }
      return res.json({ success: true, xp_awarded: 25, new_total: profile ? (profile.total_xp || 0) + 25 : 25 });
    }

    if (actionType === 'START_DAY' || actionType === 'END_DAY') {
      const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
        "award_day_xp_event",
        {
          p_user_id: userId,
          p_action_type: actionType,
          p_today: today,
          p_now: now,
          p_stats: safeStats
        }
      );

      if (rpcError) throw rpcError;

      if (!rpcResult.success) {
        console.error("handleEarnXP day event failed:", rpcResult);
        if (rpcResult.error && rpcResult.error.includes("already awarded")) {
          return res.json({
            success: true,
            message: rpcResult.error,
            xp_awarded: 0,
          });
        }
        return res.status(400).json({ error: rpcResult.error || "XP kazanılamadı" });
      }

      return res.json(rpcResult);
    }

    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
      "award_xp",
      {
        p_user_id: userId,
        p_action_type: actionType,
        p_entity_id: entityId,
        p_today: today,
        p_now: now,
        p_stats: safeStats,
      },
    );

    if (rpcError) throw rpcError;

    if (!rpcResult.success) {
      console.error("handleEarnXP failed:", rpcResult);
      if (rpcResult.error && rpcResult.error.includes("already awarded")) {
        return res.json({
          success: true,
          message: rpcResult.error,
          xp_awarded: 0,
        });
      }
      return res
        .status(400)
        .json({ error: rpcResult.error || "XP kazanılamadı" });
    }

    res.json(rpcResult);
  } catch (error: unknown) {
    console.error("Earn XP Error:", error);
    res.status(500).json({ error: safeErrorMessage(error, "Earn XP hatası") });
  }
};

export const handleUpdateGlobalSettings = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    if (!supabaseAdmin)
      return res.status(503).json({ error: "Privileged service unavailable" });
    const { settings } = req.body;

    if (!settings) {
      return res.status(400).json({ error: "Missing settings" });
    }

    const { error } = await supabaseAdmin.from("system_settings").upsert({
      id: 1,
      key: "whatsapp_activation",
      whatsapp_number: settings.whatsapp_number,
    }).select("id").single();

    if (error) throw error;

    await logAdminAudit(req.user?.id || '', null, 'SYSTEM_SETTINGS_UPDATED', { whatsapp_number: settings.whatsapp_number });

    res.json({ success: true });
  } catch (error: unknown) {
    console.error("Global Settings Update Error:", error);
    res
      .status(500)
      .json({
        error: safeErrorMessage(error, "Global ayarlar güncelleme hatası"),
      });
  }
};

// --- ADMIN V3 FEATURES ---

const logAdminAudit = async (adminId: string, targetUserId: string | null, action: string, metadata: object = {}) => {
  if (!supabaseAdmin) return;
  try {
    await supabaseAdmin.from('admin_audit_logs').insert({
      admin_id: adminId,
      target_user_id: targetUserId,
      action,
      metadata
    });
  } catch (err) {
    console.error(err);
  }
};

export const handleAdminGetUserNotes = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });
    const { userId } = req.params;
    const { data, error } = await supabaseAdmin.from("admin_user_notes").select("*, admin:profiles!admin_id(display_name)").eq("user_id", userId).order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error: unknown) {
    res.status(500).json({ error: safeErrorMessage(error, "Error fetching notes") });
  }
};

export const handleAdminCreateUserNote = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });
    const { userId, note } = req.body;
    const { data, error } = await supabaseAdmin.from("admin_user_notes").insert({
      user_id: userId,
      admin_id: req.user?.id,
      note
    }).select().single();
    if (error) throw error;
    await logAdminAudit(req.user?.id || '', userId, 'USER_NOTE_CREATED', { noteId: data.id });
    res.json(data);
  } catch (error: unknown) {
    res.status(500).json({ error: safeErrorMessage(error, "Error creating note") });
  }
};

export const handleAdminDeleteUserNote = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });
    const { id } = req.params;
    const adminId = req.user?.id;

    // First fetch the note to check ownership
    const { data: note, error: fetchError } = await supabaseAdmin
      .from("admin_user_notes")
      .select("admin_id, user_id")
      .eq("id", id)
      .single();

    if (fetchError || !note) {
      return res.status(404).json({ error: "Not found or already deleted" });
    }

    if (note.admin_id !== adminId) {
      return res.status(403).json({ error: "Only the creator can delete this note." });
    }

    const { error } = await supabaseAdmin.from("admin_user_notes").delete().eq("id", id);
    if (error) throw error;
    await logAdminAudit(adminId || '', note.user_id, 'USER_NOTE_DELETED', { noteId: id });
    res.json({ success: true });
  } catch (error: unknown) {
    res.status(500).json({ error: safeErrorMessage(error, "Error deleting note") });
  }
};

export const handleAdminGetAnnouncements = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });
    const { data, error } = await supabaseAdmin.from("admin_announcements").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error: unknown) {
    res.status(500).json({ error: safeErrorMessage(error, "Error fetching announcements") });
  }
};

export const handleAdminCreateAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });
    const { data, error } = await supabaseAdmin.from("admin_announcements").insert({
      ...req.body,
      created_by: req.user?.id
    }).select().single();
    if (error) throw error;
    await logAdminAudit(req.user?.id || '', null, 'ANNOUNCEMENT_CREATED', { announcementId: data.id });
    res.json(data);
  } catch (error: unknown) {
    res.status(500).json({ error: safeErrorMessage(error, "Error creating announcement") });
  }
};

export const handleAdminUpdateAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });
    const { id } = req.params;
    
    const ALLOWLIST = ['title', 'content', 'is_active', 'starts_at', 'ends_at', 'priority', 'type', 'target_audience'];
    const filteredData: Record<string, unknown> = {};
    for (const key of ALLOWLIST) {
      if (req.body[key] !== undefined) {
        filteredData[key] = req.body[key];
      }
    }
    
    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const { data, error } = await supabaseAdmin.from("admin_announcements").update(filteredData).eq("id", id).select().single();
    if (error) throw error;
    await logAdminAudit(req.user?.id || '', null, 'ANNOUNCEMENT_UPDATED', { announcementId: id });
    res.json(data);
  } catch (error: unknown) {
    res.status(500).json({ error: safeErrorMessage(error, "Error updating announcement") });
  }
};

export const handleAdminDeleteAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });
    const { id } = req.params;
    const { error } = await supabaseAdmin.from("admin_announcements").delete().eq("id", id);
    if (error) throw error;
    await logAdminAudit(req.user?.id || '', null, 'ANNOUNCEMENT_DELETED', { announcementId: id });
    res.json({ success: true });
  } catch (error: unknown) {
    res.status(500).json({ error: safeErrorMessage(error, "Error deleting announcement") });
  }
};

export const handleAdminGetSupportTickets = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });
    const { data, error } = await supabaseAdmin.from("support_tickets").select("*, user:profiles!user_id(display_name, email)").order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error: unknown) {
    res.status(500).json({ error: safeErrorMessage(error, "Error fetching tickets") });
  }
};

export const handleAdminUpdateSupportTicket = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });
    const { id } = req.params;

    const ALLOWLIST = ['status', 'priority', 'admin_note', 'assigned_to', 'resolved_at'];
    const filteredData: Record<string, unknown> = {};
    for (const key of ALLOWLIST) {
      if (req.body[key] !== undefined) {
        filteredData[key] = req.body[key];
      }
    }
    
    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    filteredData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin.from("support_tickets").update(filteredData).eq("id", id).select().single();
    if (error) throw error;
    await logAdminAudit(req.user?.id || '', data.user_id, 'SUPPORT_TICKET_UPDATED', { ticketId: id, status: req.body.status });
    res.json(data);
  } catch (error: unknown) {
    res.status(500).json({ error: safeErrorMessage(error, "Error updating ticket") });
  }
};

export const handleAdminCreateTaskTemplate = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });
    const { data } = req.body;
    
    // Allowlist explicitly listing the allowed fields
    const ALLOWLIST = [
      'title', 'description', 'points', 'category', 'auto_verify',
      'recurrence_type', 'interval_days', 'recurrence_days', 'day_of_month',
      'start_date', 'end_date', 'target_scope', 'auto_generate', 'is_active', 'action_type'
    ];
    const filteredData: Record<string, unknown> = {};
    if (data) Object.keys(data).forEach(key => {
      if (ALLOWLIST.includes(key)) filteredData[key] = data[key];
    });

    const { data: newTemplate, error } = await supabaseAdmin
      .from('task_templates')
      .insert([filteredData])
      .select()
      .single();

    if (error) throw error;
    await logAdminAudit(req.user?.id || '', newTemplate.id, 'TASK_TEMPLATE_CREATED', filteredData);
    
    res.json({ success: true, data: newTemplate });
  } catch (error) {
    console.error("Admin Create Task Template Error:", error);
    res.status(500).json({ error: safeErrorMessage(error, "Error creating task template") });
  }
};

export const handleAdminUpdateTaskTemplate = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });
    const { id } = req.params;
    const { data } = req.body;
    
    const ALLOWLIST = [
      'title', 'description', 'points', 'category', 'auto_verify',
      'recurrence_type', 'interval_days', 'recurrence_days', 'day_of_month',
      'start_date', 'end_date', 'target_scope', 'auto_generate', 'is_active', 'action_type'
    ];
    const filteredData: Record<string, unknown> = {};
    if (data) Object.keys(data).forEach(key => {
      if (ALLOWLIST.includes(key)) filteredData[key] = data[key];
    });

    const { data: updated, error } = await supabaseAdmin
      .from('task_templates')
      .update(filteredData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await logAdminAudit(req.user?.id || '', id, 'TASK_TEMPLATE_UPDATED', filteredData);
    
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Admin Update Task Template Error:", error);
    res.status(500).json({ error: safeErrorMessage(error, "Error updating task template") });
  }
};

export const handleAdminDeleteTaskTemplate = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });
    const { id } = req.params;
    
    const { error } = await supabaseAdmin.from('task_templates').delete().eq('id', id);
    if (error) throw error;
    
    await logAdminAudit(req.user?.id || '', id, 'TASK_TEMPLATE_DELETED', {});
    res.json({ success: true });
  } catch (error) {
    console.error("Admin Delete Task Template Error:", error);
    res.status(500).json({ error: safeErrorMessage(error, "Error deleting task template") });
  }
};

export const handleAdminGetAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });
    const { data, error } = await supabaseAdmin.from("admin_audit_logs").select("*, admin:profiles!admin_id(display_name), target:profiles!target_user_id(display_name)").order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    res.json(data);
  } catch (error: unknown) {
    res.status(500).json({ error: safeErrorMessage(error, "Error fetching logs") });
  }
};

export const handleCompleteCampaignTask = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });

    const { taskId } = req.body;
    const userId = req.user.id;

    if (!taskId) return res.status(400).json({ error: "Missing taskId" });

    const nowObj = new Date();
    const todayStr = getTurkeyTodayISO(nowObj);
    const nowStr = nowObj.toISOString();

    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc("complete_campaign_task_and_award_xp", {
      p_user_id: userId,
      p_task_id: taskId,
      p_today: todayStr,
      p_now: nowStr
    });

    if (rpcError) {
      console.error("RPC complete_campaign_task_and_award_xp failed", rpcError);
      return res.status(500).json({ error: "İşlem sırasında sunucu hatası oluştu" });
    }

    if (!rpcResult.success) {
      const errorMsg = rpcResult.error || "Bilinmeyen hata";
      if (errorMsg === 'Task not found') return res.status(404).json({ error: errorMsg });
      if (errorMsg === 'Unauthorized') return res.status(403).json({ error: errorMsg });
      return res.status(400).json({ error: errorMsg });
    }

    return res.json(rpcResult);
  } catch (error: unknown) {
    console.error("Complete Campaign Task Error:", error);
    res.status(500).json({ error: safeErrorMessage(error, "Error completing task") });
  }
};

export const handleGetDailyGamifiedTasks = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });
    const userId = req.user.id;
    const nowObj = new Date();
    const today = getTurkeyTodayISO(nowObj);

    // 1. Kullanıcı profili bilgisini al (hedef kitle kontrolü için)
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("tier, subscription_type")
      .eq("id", userId)
      .single();

    // 2. Bugünkü gamified görevleri getir
    let { data: tasks } = await supabaseAdmin
      .from("gamified_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today);

    // 3. Aktif Task Template'leri getir (auto_generate = true olanlar)
    const { data: templates } = await supabaseAdmin
      .from("task_templates")
      .select("*")
      .eq("auto_generate", true)
      .eq("is_active", true)
      .lte("start_date", today);

    const userTier = profile?.tier || "free";
    const userSub = profile?.subscription_type || "none";

    type GamifiedTaskInsert = {
      user_id: string;
      title: string;
      points: number;
      category: string;
      date: string;
      is_completed: boolean;
      template_id?: string | null;
      source?: string;
      action_type?: string;
      auto_verify?: boolean;
    };

    // 4. Template kontrolü & lazy creation
    const newTasksToInsert: GamifiedTaskInsert[] = [];

    if (templates && templates.length > 0) {
      for (const t of templates) {
        // end_date kontrolü
        if (t.end_date && t.end_date < today) continue;

        // Target Scope Kontrolü
        if (t.target_scope === "free" && userTier !== "free" && userSub !== "none") continue;
        if (t.target_scope === "trial" && userSub !== "trial") continue;
        if (t.target_scope === "master" && userTier !== "master") continue;

        let shouldGenerate = false;

        // Recurrence Kontrolü
        if (t.recurrence_type === "once") {
          if (t.start_date === today) shouldGenerate = true;
        } else if (t.recurrence_type === "daily") {
          shouldGenerate = true;
        } else if (t.recurrence_type === "interval" && t.interval_days > 0) {
          const startDate = new Date(t.start_date);
          const currentDate = new Date(today);
          const diffTime = Math.abs(currentDate.getTime() - startDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays % t.interval_days === 0) {
            shouldGenerate = true;
          }
        } else if (t.recurrence_type === "weekly" && t.recurrence_days?.length > 0) {
          const currentDayOfWeek = new Date(today).getDay(); // 0 is Sunday, 1 is Monday ...
          if (t.recurrence_days.includes(currentDayOfWeek)) {
            shouldGenerate = true;
          }
        } else if (t.recurrence_type === "monthly" && t.day_of_month) {
          const currentDayOfMonth = new Date(today).getDate();
          if (currentDayOfMonth === t.day_of_month) {
            shouldGenerate = true;
          }
        }

        if (shouldGenerate) {
          const templateAlreadyGenerated = tasks?.some(
            (task: { template_id: string | null; date: string }) => task.template_id === t.id && task.date === today
          );

          if (!templateAlreadyGenerated) {
            newTasksToInsert.push({
              user_id: userId,
              title: t.title,
              points: t.points || 10,
              category: t.category,
              date: today,
              is_completed: false,
              template_id: t.id,
              source: "admin_template",
              action_type: t.action_type || "general",
              auto_verify: t.auto_verify,
            });
          }
        }
      }
    }

    // Default task fallback if no tasks and no new templates to insert
    if ((!tasks || tasks.length === 0) && newTasksToInsert.length === 0) {
      newTasksToInsert.push(
        { user_id: userId, title: "Güne Erken Başla (Sabah Ritüelini Tamamla)", points: 100, category: "main", date: today, is_completed: false },
        { user_id: userId, title: "Bugün 3 Yeni Lead Ekle", points: 150, category: "smart", date: today, is_completed: false },
        { user_id: userId, title: "Bugün 1 Yeni Portföy Ekle", points: 300, category: "smart", date: today, is_completed: false },
        { user_id: userId, title: "Akşam Gün Kapanışını (Ritüeli) Tamamla", points: 100, category: "main", date: today, is_completed: false },
        { user_id: userId, title: "1 Kişisel Görev Tamamla", points: 50, category: "sweet", date: today, is_completed: false }
      );
    }

    if (newTasksToInsert.length > 0) {
      const { data: insertedTasks, error: insertError } = await supabaseAdmin
        .from("gamified_tasks")
        .insert(newTasksToInsert)
        .select();

      if (!insertError && insertedTasks) {
         if(!tasks) tasks = [];
         tasks = [...tasks, ...insertedTasks];
      } else if (insertError) {
         console.warn("Could not insert recurring tasks. Might be a unique constraint violation", insertError);
      }
    }

    return res.json({ success: true, tasks: tasks || [] });

  } catch (error: unknown) {
    console.error("Get Daily Gamified Tasks Error:", error);
    res.status(500).json({ error: safeErrorMessage(error, "Failed to get daily gamified tasks") });
  }
};

