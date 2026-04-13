import { GoogleGenAI } from "@google/genai";
import { rateLimit } from "express-rate-limit";
import { createClient } from "@supabase/supabase-js";
import { addMonths } from "date-fns";

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
  throw new Error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is not defined. Privileged backend operations will fail.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin client for privileged operations - NO FALLBACK
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const ALLOWED_MODELS = [
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

export const handleGenerate = async (req: any, res: any) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return res.status(500).json({ error: "AI service configuration missing" });
    }
    
    const { model, contents, config } = req.body;

    if (!contents) {
      return res.status(400).json({ error: "Missing 'contents' in request body" });
    }

    const requestedModel = model || "gemini-3-flash-preview";
    if (!ALLOWED_MODELS.includes(requestedModel)) {
      return res.status(400).json({ error: "Invalid model requested" });
    }
    
    const ai = new GoogleGenAI({ apiKey });
    
    const formattedContents = typeof contents === 'string' 
      ? [{ role: 'user', parts: [{ text: contents }] }]
      : contents;

    const response = await (ai as any).models.generateContent({
      model: requestedModel,
      contents: formattedContents,
      config
    });
    
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    const status = error.status || 500;
    const message = status === 500 ? "An error occurred while generating content" : error.message;
    res.status(status).json({ error: message });
  }
};

export const handleUpdateProfile = async (req: any, res: any) => {
  try {
    const { data } = req.body;
    const userId = req.user.id;

    // List of fields that are safe for users to update themselves
    const SAFE_FIELDS = [
      'display_name',
      'phone',
      'avatar_url',
      'avatar_color',
      'bio',
      'city',
      'district',
      'has_seen_onboarding',
      'has_seen_tour',
      'notification_settings'
    ];

    // Filter out any protected fields
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
  try {
    const { type } = req.body;
    const userId = req.user.id;

    if (!['trial', '1-month', '3-month', '6-month', '12-month'].includes(type)) {
      return res.status(400).json({ error: "Invalid subscription type" });
    }

    // Fetch current profile to check if trial was already used
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('subscription_type, role')
      .eq('uid', userId)
      .single();

    if (fetchError || !profile) {
      return res.status(404).json({ error: "User profile not found" });
    }

    // Production Safety: Only allow 'trial' if the user has no active subscription.
    // Paid tiers are blocked here because there is no payment verification logic yet.
    // Users must contact admin or use the admin panel for manual upgrades.
    if (type !== 'trial') {
      return res.status(403).json({ 
        error: "Direct upgrade blocked. Please complete payment or contact support for manual activation." 
      });
    }

    // If requesting trial, ensure they haven't used one before
    if (profile.subscription_type !== 'none') {
      return res.status(400).json({ error: "Trial already used or active subscription exists." });
    }

    let endDate: string;
    let tier: 'pro' | 'elite' | 'master' = 'pro';

    // Trial is always 15 days and 'pro' tier
    const d = new Date();
    d.setDate(d.getDate() + 15);
    endDate = d.toISOString();
    tier = 'pro';

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_type: type,
        subscription_end_date: endDate,
        tier: tier
      })
      .eq('uid', userId);

    if (error) throw error;

    res.json({ success: true, tier, endDate });
  } catch (error: any) {
    console.error("Subscription Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const handleAdminUpdateUser = async (req: any, res: any) => {
  try {
    const { uid, data } = req.body;
    const adminId = req.user.id;

    // Verify requester is actually an admin
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

export const handleAdminGetUsers = async (req: any, res: any) => {
  try {
    const adminId = req.user.id;

    // Verify requester is actually an admin
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

    // Verify requester is actually an admin
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

    // Trusted XP amounts for specific actions
    const XP_CONFIG: Record<string, number> = {
      'MORNING_RITUAL': 50,
      'EVENING_RITUAL': 100,
      'END_DAY': 150,
      'START_DAY': 0,
      'ADD_LEAD': 20,
      'ADD_PROPERTY': 50,
      'RESCUE_SESSION_BONUS': 150,
      'COMPLETE_BASIC_TASK': 10,
      'COMPLETE_TASK': 0, // Fetched from DB
    };

    // Fetch current profile for verification and updates
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('uid', userId)
      .single();

    if (fetchError || !profile) throw new Error("Profile not found");

    let amount = 0;
    let verificationTable: string | null = null;
    let verificationId: string | null = null;
    let profileXpField: string | null = null;

    // 1. Audit and Verify Action
    switch (actionType) {
      case 'MORNING_RITUAL':
        if (profile.last_morning_ritual_xp_at?.startsWith(today)) {
          return res.status(400).json({ error: "Morning ritual XP already awarded for today" });
        }
        amount = XP_CONFIG['MORNING_RITUAL'];
        profileXpField = 'last_morning_ritual_xp_at';
        break;

      case 'EVENING_RITUAL':
        if (profile.last_evening_ritual_xp_at?.startsWith(today)) {
          return res.status(400).json({ error: "Evening ritual XP already awarded for today" });
        }
        amount = XP_CONFIG['EVENING_RITUAL'];
        profileXpField = 'last_evening_ritual_xp_at';
        break;

      case 'END_DAY':
        if (profile.last_end_day_xp_at?.startsWith(today)) {
          return res.status(400).json({ error: "End day XP already awarded for today" });
        }
        amount = XP_CONFIG['END_DAY'];
        profileXpField = 'last_end_day_xp_at';
        break;

      case 'START_DAY':
        amount = XP_CONFIG['START_DAY'];
        break;

      case 'ADD_LEAD':
        if (!leadId) return res.status(400).json({ error: "Missing leadId" });
        verificationTable = 'leads';
        verificationId = leadId;
        amount = XP_CONFIG['ADD_LEAD'];
        break;

      case 'ADD_PROPERTY':
        if (!propertyId) return res.status(400).json({ error: "Missing propertyId" });
        verificationTable = 'properties';
        verificationId = propertyId;
        amount = XP_CONFIG['ADD_PROPERTY'];
        break;

      case 'RESCUE_SESSION_BONUS':
        if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });
        verificationTable = 'rescue_sessions';
        verificationId = sessionId;
        amount = XP_CONFIG['RESCUE_SESSION_BONUS'];
        break;

      case 'COMPLETE_BASIC_TASK':
        if (!taskId) return res.status(400).json({ error: "Missing taskId" });
        verificationTable = 'personal_tasks';
        verificationId = taskId;
        amount = XP_CONFIG['COMPLETE_BASIC_TASK'];
        break;

      case 'COMPLETE_TASK':
        if (!taskId) return res.status(400).json({ error: "Missing taskId" });
        verificationTable = 'gamified_tasks';
        verificationId = taskId;
        break;

      default:
        return res.status(400).json({ error: "Invalid or unsupported actionType" });
    }

    // 2. Database Verification for Entity-based XP
    if (verificationTable && verificationId) {
      const { data: entity, error: entityError } = await supabaseAdmin
        .from(verificationTable)
        .select('*')
        .eq('id', verificationId)
        .single();

      if (entityError || !entity) return res.status(404).json({ error: `${verificationTable} record not found` });
      if (entity.agent_id !== userId) return res.status(403).json({ error: "Unauthorized access to record" });
      
      // Check if already rewarded
      if (entity.xp_awarded) {
        return res.status(400).json({ error: "XP already awarded for this action" });
      }

      // Special checks for specific tables
      if (verificationTable === 'gamified_tasks') {
        if (!entity.is_completed) return res.status(400).json({ error: "Task is not completed" });
        amount = entity.points || 10;
      }
      if (verificationTable === 'personal_tasks') {
        if (!entity.is_completed) return res.status(400).json({ error: "Personal task is not completed" });
      }
      if (verificationTable === 'rescue_sessions') {
        if (entity.status !== 'completed') return res.status(400).json({ error: "Rescue session is not completed" });
      }

      // Mark as rewarded
      const { error: markError } = await supabaseAdmin
        .from(verificationTable)
        .update({ xp_awarded: true })
        .eq('id', verificationId);
      
      if (markError) throw markError;
    }

    // 3. Prepare Profile Updates
    const profileUpdates: any = { 
      last_active_date: today,
      updated_at: now
    };

    if (profileXpField) {
      profileUpdates[profileXpField] = now;
    }

    if (actionType === 'MORNING_RITUAL' || actionType === 'START_DAY') {
      profileUpdates.last_day_started_at = now;
    }

    if (actionType === 'EVENING_RITUAL' || actionType === 'END_DAY') {
      profileUpdates.last_ritual_completed_at = now;
      
      if (actionType === 'EVENING_RITUAL') {
        // Server-side Streak Calculation
        const lastActive = profile.last_active_date;
        let newStreak = profile.current_streak || 0;
        
        if (lastActive !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          if (lastActive === yesterdayStr) {
            newStreak += 1;
          } else {
            newStreak = 1;
          }
        }
        profileUpdates.current_streak = newStreak;
        profileUpdates.longest_streak = Math.max(newStreak, profile.longest_streak || 0);
      }
    }

    const newXP = (profile.total_xp || 0) + amount;
    
    // Level calculation logic
    let newLevel = 1;
    if (newXP >= 15000) newLevel = 4;
    else if (newXP >= 5000) newLevel = 3;
    else if (newXP >= 1000) newLevel = 2;

    profileUpdates.total_xp = newXP;
    profileUpdates.broker_level = newLevel;

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdates)
      .eq('uid', userId);

    if (updateError) throw updateError;

    // 4. Update user_stats for today
    try {
      const { data: daily } = await supabaseAdmin
        .from('user_stats')
        .select('*')
        .eq('agent_id', userId)
        .eq('date', today)
        .maybeSingle();

      const statsUpdate: any = {
        xp_earned: ((daily?.xp_earned || 0) + amount)
      };

      if (actionType === 'START_DAY') {
        statsUpdate.day_started_at = now;
      }
      if (actionType === 'END_DAY' || actionType === 'EVENING_RITUAL') {
        statsUpdate.day_ended_at = now;
        if (stats) {
          if (stats.tasks_completed !== undefined) statsUpdate.tasks_completed = stats.tasks_completed;
          if (stats.calls_made !== undefined) statsUpdate.calls_made = stats.calls_made;
          if (stats.visits_made !== undefined) statsUpdate.visits_made = stats.visits_made;
          if (stats.potential_revenue_handled !== undefined) statsUpdate.potential_revenue_handled = stats.potential_revenue_handled;
        }
      }

      if (daily) {
        await supabaseAdmin
          .from('user_stats')
          .update(statsUpdate)
          .eq('id', daily.id);
      } else {
        await supabaseAdmin
          .from('user_stats')
          .insert({ 
            agent_id: userId, 
            date: today, 
            ...statsUpdate 
          });
      }
    } catch (e) {
      console.error("user_stats update error in handleEarnXP:", e);
    }

    res.json({ 
      success: true, 
      total_xp: newXP, 
      broker_level: newLevel, 
      awarded: amount,
      current_streak: profileUpdates.current_streak || profile.current_streak
    });
  } catch (error: any) {
    console.error("Earn XP Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const handleUpdateGlobalSettings = async (req: any, res: any) => {
  try {
    const { settings } = req.body;
    const adminId = req.user.id;

    // Verify requester is actually an admin
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
