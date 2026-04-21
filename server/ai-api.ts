import { GoogleGenAI } from "@google/genai";
import { rateLimit } from "express-rate-limit";
import { createClient } from "@supabase/supabase-js";
import { addMonths } from "date-fns";

// API anahtarını SADECE burada, sunucuda okuyoruz.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

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
  console.warn("WARNING: SUPABASE_SERVICE_ROLE_KEY is not defined. Privileged backend operations will fail.");
} else {
  console.log("SUPABASE_SERVICE_ROLE_KEY is present.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin client for privileged operations - NO FALLBACK
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const ALLOWED_MODELS = [
  "gemini-flash-latest",
  "gemini-3-flash-preview",
  "gemini-3.1-pro-preview",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite-preview",
  "gemini-2.0-pro-exp-02-05"
];

// Rate Limiting Middleware
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP/User to 100 requests per window
  keyGenerator: (req: any) => req.user?.id || req.ip,
  message: { error: "Rate limit exceeded. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication Middleware
export const authenticate = async (req: any, res: any, next: any) => {
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
    next();
  } catch (err) {
    res.status(401).json({ error: "Authentication failed" });
  }
};

// --- YENİ: TOKEN MUHASEBE MIDDLEWARE'İ ---
// Yanıtı keser (intercept) ve token kullanımını arka planda asenkron olarak kaydeder.
export const tokenTrackerMiddleware = (req: any, res: any, next: any) => {
  const originalJson = res.json;
  
  res.json = function (body: any) {
    const totalTokens = body?.usage?.totalTokenCount || body?.usage?.totalTokens;
    const userId = req.user?.id; // authenticate'den geliyor

    // Sadece başarılı dönen ve içinde usage barındıran AI yanıtlarını yakala
    if (res.statusCode >= 200 && res.statusCode < 300 && userId && totalTokens && totalTokens > 0) {
      // Yanıtın gecikmemesi için fire-and-forget asenkron çalıştırıyoruz
      (async () => {
        try {
          const { data: profile, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select('ai_tokens_used')
            .eq('uid', userId)
            .single();
            
          if (fetchError && fetchError.code !== 'PGRST116') { // Not found harici hatalar
            throw fetchError;
          }
            
          const currentTokens = profile?.ai_tokens_used || 0;
          const newTotal = currentTokens + totalTokens;
          
          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ ai_tokens_used: newTotal })
            .eq('uid', userId);

          if (updateError) throw updateError;
            
          console.log(`[Token Muhasebe] Danışman ID: ${userId} | Harcanan: ${totalTokens} | Toplam: ${newTotal}`);
        } catch (err: any) {
          console.error("[Token Muhasebe Hatası]:", err.message);
        }
      })();
    }
    
    // Akışı bozmadan orijinal json fonksiyonunu çağırıp frontend'e veriyi yolla
    return originalJson.call(this, body);
  };
  next();
};

export const handleAIGeneration = async (req: any, res: any) => {
  try {
    if (!ai) {
      return res.status(500).json({ error: "Sunucuda Gemini API anahtarı eksik. Sistem yöneticisine bildirin." });
    }

    const { model, contents, systemInstruction, responseSchema } = req.body;
    const userId = req.user?.id;

    // 1. Model Allowlist Check
    const targetModel = model || "gemini-2.0-flash";
    if (!ALLOWED_MODELS.includes(targetModel)) {
      return res.status(400).json({ error: `Geçersiz model seçimi: ${targetModel}. Sadece izin verilen modeller kullanılabilir.` });
    }

    // 2. Token Limit Check (Server-side Enforcement)
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('ai_tokens_used, tier')
      .eq('uid', userId)
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

    const config: any = {
      responseMimeType: "application/json",
    };

    if (responseSchema) {
      config.responseSchema = responseSchema;
    }

    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    const response = await ai.models.generateContent({
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

  } catch (error: any) {
    console.error("AI Generation Backend Error:", error);
    res.status(500).json({ error: "Yapay zeka işlemi başarısız oldu", details: error.message });
  }
};

export const handleUpdateProfile = async (req: any, res: any) => {
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

    const filteredData: any = {};
    Object.keys(data).forEach(key => {
      if (SAFE_FIELDS.includes(key)) {
        filteredData[key] = data[key];
      }
    });

    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update(filteredData)
      .eq('uid', userId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error("Profile Update Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const handleSubscribe = async (req: any, res: any) => {
  console.log(`[handleSubscribe] START - Body:`, req.body);
  try {
    const { type } = req.body;
    const userId = req.user.id;

    console.log(`[handleSubscribe] Processing - User: ${userId}, Type: ${type}`);

    if (!['trial', '1-month', '3-month', '6-month', '12-month'].includes(type)) {
      return res.status(400).json({ error: "Invalid subscription type" });
    }

    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('subscription_type, role')
      .eq('uid', userId)
      .single();

    if (fetchError || !profile) {
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
        error: "Database RPC error", 
        details: rpcError.message,
        code: rpcError.code 
      });
    }

    if (!rpcResult.success) {
      console.warn("Trial Activation Failed (Business Logic):", rpcResult.error, rpcResult.detail);
      return res.status(400).json({ 
        error: rpcResult.error,
        detail: rpcResult.detail 
      });
    }

    console.log(`[handleSubscribe] SUCCESS for ${userId}`);
    res.json({ success: true, tier: 'pro', endDate });
  } catch (error: any) {
    console.error("Subscription Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const handleAdminUpdateUser = async (req: any, res: any) => {
  try {
    const { uid, data } = req.body;
    const adminId = req.user.id;

    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('uid', adminId)
      .single();

    if (adminError || adminProfile?.role !== 'admin') {
      return res.status(403).json({ error: "Unauthorized: Admin access required" });
    }

    if (!uid || !data) {
      return res.status(400).json({ error: "Missing uid or data" });
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update(data)
      .eq('uid', uid);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error("Admin Update Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const handleAdminDeleteUser = async (req: any, res: any) => {
  try {
    const { uid } = req.body;
    const adminId = req.user.id;

    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('uid', adminId)
      .single();

    if (adminError || adminProfile?.role !== 'admin') {
      return res.status(403).json({ error: "Unauthorized: Admin access required" });
    }

    if (!uid) {
      return res.status(400).json({ error: "Missing uid" });
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(uid);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error("Admin Delete User Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const handleAdminGetUsers = async (req: any, res: any) => {
  try {
    const adminId = req.user.id;

    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('uid', adminId)
      .single();

    if (adminError || adminProfile?.role !== 'admin') {
      return res.status(403).json({ error: "Unauthorized: Admin access required" });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error("Admin Get Users Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const handleAdminGetSettings = async (req: any, res: any) => {
  try {
    const adminId = req.user.id;

    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('uid', adminId)
      .single();

    if (adminError || adminProfile?.role !== 'admin') {
      return res.status(403).json({ error: "Unauthorized: Admin access required" });
    }

    const { data, error } = await supabaseAdmin
      .from('global_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error) throw error;

    res.json(data || {});
  } catch (error: any) {
    console.error("Admin Get Settings Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const handleEarnXP = async (req: any, res: any) => {
  try {
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
      return res.status(400).json({ error: rpcResult.error });
    }

    res.json(rpcResult);
  } catch (error: any) {
    console.error("Earn XP Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const handleUpdateGlobalSettings = async (req: any, res: any) => {
  try {
    const { settings } = req.body;
    const adminId = req.user.id;

    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('uid', adminId)
      .single();

    if (adminError || adminProfile?.role !== 'admin') {
      return res.status(403).json({ error: "Unauthorized: Admin access required" });
    }

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
  } catch (error: any) {
    console.error("Global Settings Update Error:", error);
    res.status(500).json({ error: error.message });
  }
};