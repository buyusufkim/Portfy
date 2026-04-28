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
          const { data: profile, error: fetchError } = await supabaseAdmin
            .from("profiles")
            .select("ai_tokens_used")
            .eq("id", userId)
            .single();

          if (fetchError && fetchError.code !== "PGRST116") {
            // Not found harici hatalar
            throw fetchError;
          }

          const currentTokens = profile?.ai_tokens_used || 0;
          const newTotal = currentTokens + totalTokens;

          const { error: updateError } = await supabaseAdmin
            .from("profiles")
            .update({ ai_tokens_used: newTotal })
            .eq("id", userId);

          if (updateError) throw updateError;

          console.log(
            `[Token Muhasebe] Danışman ID: ${userId} | Harcanan: ${totalTokens} | Toplam: ${newTotal}`,
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
      .select("ai_tokens_used, tier")
      .eq("id", userId)
      .single();

    if (fetchError || !profile) {
      return res.status(404).json({ error: "Kullanıcı profili bulunamadı." });
    }

    const limit = profile.tier === "pro" ? 10000 : 1000;
    const currentUsage = profile.ai_tokens_used || 0;

    if (currentUsage >= limit) {
      return res.status(403).json({
        error: "Yapay zeka kullanım limitiniz doldu.",
        details:
          "Daha fazla kullanım için Portfy Pro paketinize geçiş yapabilir veya bir sonraki ayı bekleyebilirsiniz.",
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

export const handleAdminGetUsers = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin)
      return res.status(503).json({ error: "Privileged service unavailable" });
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data);
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
      today: clientToday,
      now: clientNow,
    } = req.body;
    const userId = req.user.id;

    const getLocalDateISO = (d = new Date()) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const today = clientToday || getLocalDateISO();
    const now = clientNow || new Date().toISOString();

    if (!actionType) {
      return res.status(400).json({ error: "Missing actionType" });
    }

    const entityId = leadId || propertyId || sessionId || taskId || null;

    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
      "award_xp",
      {
        p_user_id: userId,
        p_action_type: actionType,
        p_entity_id: entityId,
        p_today: today,
        p_now: now,
        p_stats: stats || {},
      },
    );

    if (rpcError) throw rpcError;

    if (!rpcResult.success) {
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
    const { error } = await supabaseAdmin.from("admin_user_notes").delete().eq("id", id);
    if (error) throw error;
    await logAdminAudit(req.user?.id || '', null, 'USER_NOTE_DELETED', { noteId: id });
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
