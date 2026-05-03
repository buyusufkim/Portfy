import { GoogleGenAI } from "@google/genai";
import { rateLimit } from "express-rate-limit";
import { User } from "@supabase/supabase-js";
import { Request, Response, NextFunction } from "express";
import { getEffectiveAiTokenLimit } from "../src/config/subscriptionLimits";

export interface AuthRequest extends Request {
  user?: User;
  accessToken?: string;
}
import { createClient } from "@supabase/supabase-js";
import { addMonths } from "date-fns";
import * as dotenv from "dotenv";
import { getTurkeyTodayISO } from "./time.js";

dotenv.config({ override: true });

function getGenerativeAI() {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY || GEMINI_API_KEY.includes("your-gemini-key")) {
    console.warn("WARNING: GEMINI_API_KEY is not defined or invalid.");
    return null;
  }
  return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  throw new Error(
    "CRITICAL: VITE_SUPABASE_URL is not defined in environment variables.",
  );
}
if (!SUPABASE_ANON_KEY) {
  throw new Error(
    "CRITICAL: VITE_SUPABASE_ANON_KEY is not defined in environment variables.",
  );
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "CRITICAL: SUPABASE_SERVICE_ROLE_KEY is required in production",
    );
  } else {
    console.warn(
      "WARNING: SUPABASE_SERVICE_ROLE_KEY is not defined. Privileged backend operations will fail.",
    );
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
  "gemini-1.5-pro-latest",
];

// Rate Limiting Middleware
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP/User to 100 requests per window
  keyGenerator: (req: AuthRequest) => req.user?.id || req.ip || "unknown",
  message: { error: "Rate limit exceeded. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const xpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req: AuthRequest) => req.user?.id || req.ip || "unknown",
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

    if (adminError || adminProfile?.role !== "admin") {
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
export const tokenTrackerMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const originalJson = res.json.bind(res);

  res.json = function (body: Record<string, unknown> | null) {
    const bodyData = body as {
      usage?: { totalTokenCount?: number; totalTokens?: number };
    } | null;
    const totalTokens =
      bodyData?.usage?.totalTokenCount || bodyData?.usage?.totalTokens;
    const userId = req.user?.id; // authenticate'den geliyor

    // Sadece başarılı dönen ve içinde usage barındıran AI yanıtlarını yakala
    if (
      res.statusCode >= 200 &&
      res.statusCode < 300 &&
      userId &&
      totalTokens &&
      totalTokens > 0
    ) {
      // Yanıtın gecikmemesi için fire-and-forget asenkron çalıştırıyoruz
      (async () => {
        if (!supabaseAdmin) return;
        try {
          const { error: rpcError } = await supabaseAdmin.rpc("increment_ai_tokens", { 
            p_user_id: userId, 
            p_tokens: totalTokens 
          });

          if (rpcError) throw rpcError;

          console.log(
            `[Token Muhasebe] Danışman ID: ${userId} | Harcanan (Atomic): ${totalTokens}`,
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
    const { model, contents, systemInstruction, responseSchema } = req.body;
    const userId = req.user?.id;

    // 1. Model Allowlist Check
    const targetModel = model || "gemini-3-flash-preview";
    if (!ALLOWED_MODELS.includes(targetModel)) {
      return res
        .status(400)
        .json({
          error: `Geçersiz model seçimi: ${targetModel}. Sadece izin verilen modeller kullanılabilir.`,
        });
    }

    if (!supabaseAdmin)
      return res.status(503).json({ error: "Privileged service unavailable" });

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

    if (!contents) {
      return res
        .status(400)
        .json({ error: "İşlenecek içerik (contents) gönderilmedi." });
    }

    const config: Record<string, unknown> = {
      responseMimeType: "application/json",
    };

    if (responseSchema) {
      config.responseSchema = responseSchema;
    } else {
      config.responseSchema = {
        type: "object",
        properties: {
          response: { type: "string", description: "Default response text" },
          status: { type: "string", description: "Status code or generic status" }
        }
      };
    }

    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    const genAi = getGenerativeAI();
    if (!genAi) {
      return res
        .status(500)
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
      
    let parsedData: any = {};
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

    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
    const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";

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
        return res.status(500).json({ error: error.message });
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
        return res.status(500).json({ error: error.message });
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
        return res.status(500).json({ error: error.message });
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
    
    // Normalize payload to match DB schema exactly like frontend
    const normalizedPayload = {
      user_id: userId,
      closure_date: todayStr,
      updated_at: new Date().toISOString(),
      wins: payload.wins,
      blockers: payload.blockers,
      tomorrow_top3: payload.top3_tomorrow || payload.tomorrow_top3,
      completed_calls: payload.calls || payload.completed_calls || 0,
      completed_portfolio_actions: payload.visits || payload.completed_portfolio_actions || 0,
      completed_followups: payload.completed_followups || 0
    };

    const { data, error } = await supabaseAdmin
      .from("day_closure")
      .upsert(normalizedPayload, { onConflict: "user_id, closure_date" })
      .select()
      .single();

    if (error) {
        return res.status(500).json({ error: error.message });
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

    if (actionType === 'START_DAY' || actionType === 'END_DAY') {
      const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single();
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      if (actionType === 'START_DAY') {
        const lastStartedDate = getTurkeyDateFromTimestamp(profile.last_day_started_at);
        if (lastStartedDate === today) return res.json({ success: true, message: 'Day already started today', xp_awarded: 0 });
        
        if (safeStats.early_start_reason) {
          await supabaseAdmin.from('work_discipline_logs').insert({
            user_id: userId, log_date: today, type: 'early_start', scheduled_time: profile.work_start_time, actual_time: now, reason: safeStats.early_start_reason
          });
        }
        
        const lastClosedDate = getTurkeyDateFromTimestamp(profile.last_ritual_completed_at);
        if (lastStartedDate && lastStartedDate < today) {
          const wasClosed = lastClosedDate === lastStartedDate;
          if (!wasClosed) {
            const { error: logError } = await supabaseAdmin.from('work_discipline_logs').insert({
              user_id: userId, log_date: lastStartedDate, type: 'missed_close_penalty', actual_time: now, reason: 'Önceki gün kapatılmadan yeni gün başlatıldı', xp_delta: -50
            });
            if (!logError) {
              profile.total_xp = Math.max(0, (profile.total_xp || 0) - 50);
              safeStats.missed_penalty_applied = true;
            }
          }
        }
      } else if (actionType === 'END_DAY') {
        if (getTurkeyDateFromTimestamp(profile.last_end_day_xp_at) === today) {
          return res.json({ success: true, message: 'End day XP already awarded for today', xp_awarded: 0 });
        }
        
        if (safeStats.early_close_reason) {
          await supabaseAdmin.from('work_discipline_logs').insert({
            user_id: userId, log_date: today, type: 'early_close', scheduled_time: profile.work_end_time, actual_time: now, reason: safeStats.early_close_reason
          });
        }
      }

      const v_amount = actionType === 'START_DAY' ? 50 : (actionType === 'END_DAY' ? 150 : 0);
      const v_new_xp = (profile.total_xp || 0) + v_amount;
      let v_new_level = 1;
      if (v_new_xp >= 15000) v_new_level = 4;
      else if (v_new_xp >= 5000) v_new_level = 3;
      else if (v_new_xp >= 1000) v_new_level = 2;

      let v_new_streak = profile.current_streak || 0;
      if (actionType === 'END_DAY') {
        const lastRitualTz = getTurkeyDateFromTimestamp(profile.last_ritual_completed_at);
        if (!lastRitualTz || lastRitualTz !== today) {
          const yesterdayObj = new Date(nowObj);
          yesterdayObj.setDate(yesterdayObj.getDate() - 1);
          const yesterdayStr = getTurkeyTodayISO(yesterdayObj);
          
          if (lastRitualTz && lastRitualTz === yesterdayStr) {
            v_new_streak += 1;
          } else {
            v_new_streak = 1;
          }
        }
      }

      // Update Profile
      await supabaseAdmin.from('profiles').update({
        total_xp: v_new_xp,
        broker_level: v_new_level,
        current_streak: v_new_streak,
        longest_streak: Math.max(v_new_streak, profile.longest_streak || 0),
        last_active_date: actionType === 'END_DAY' ? today : profile.last_active_date,
        last_day_started_at: actionType === 'START_DAY' ? now : profile.last_day_started_at,
        last_morning_ritual_xp_at: actionType === 'START_DAY' ? now : profile.last_morning_ritual_xp_at,
        last_ritual_completed_at: actionType === 'END_DAY' ? now : profile.last_ritual_completed_at,
        last_end_day_xp_at: actionType === 'END_DAY' ? now : profile.last_end_day_xp_at,
        updated_at: now
      }).eq('id', userId);

      // Update User Stats
      const { data: userStatsStr } = await supabaseAdmin.from('user_stats').select('*').eq('user_id', userId).eq('date', today).maybeSingle();
      if (userStatsStr) {
        await supabaseAdmin.from('user_stats').update({
          xp_earned: (userStatsStr.xp_earned || 0) + v_amount,
          day_started_at: actionType === 'START_DAY' && !userStatsStr.day_started_at ? now : userStatsStr.day_started_at,
          day_ended_at: actionType === 'END_DAY' ? now : userStatsStr.day_ended_at,
          tasks_completed: Math.max(userStatsStr.tasks_completed || 0, parseInt(safeStats.tasks_completed) || 0),
          calls_made: Math.max(userStatsStr.calls_made || 0, parseInt(safeStats.calls_made) || 0),
          visits_made: Math.max(userStatsStr.visits_made || 0, parseInt(safeStats.visits_made) || 0),
          potential_revenue_handled: Math.max(userStatsStr.potential_revenue_handled || 0, parseFloat(safeStats.potential_revenue_handled) || 0),
          updated_at: now
        }).eq('id', userStatsStr.id);
      } else {
        await supabaseAdmin.from('user_stats').insert({
          user_id: userId,
          date: today,
          xp_earned: v_amount,
          day_started_at: actionType === 'START_DAY' ? now : null,
          day_ended_at: actionType === 'END_DAY' ? now : null,
          tasks_completed: parseInt(safeStats.tasks_completed) || 0,
          calls_made: parseInt(safeStats.calls_made) || 0,
          visits_made: parseInt(safeStats.visits_made) || 0,
          potential_revenue_handled: parseFloat(safeStats.potential_revenue_handled) || 0,
        });
      }

      return res.json({
        success: true,
        xp_awarded: v_amount,
        new_total: v_new_xp,
        new_level: v_new_level,
        new_streak: v_new_streak
      });
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
    const { data, error } = await supabaseAdmin.from("admin_announcements").update(req.body).eq("id", id).select().single();
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
    const { data, error } = await supabaseAdmin.from("support_tickets").update({...req.body, updated_at: new Date().toISOString()}).eq("id", id).select().single();
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

