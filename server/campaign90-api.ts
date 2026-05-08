import { Response } from "express";
import { AuthRequest } from "./ai-api.js";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseAdmin = (supabaseUrl && supabaseServiceKey) ? createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
}) : null;

export const safeErrorMessage = (error: unknown, fallback: string) =>
    process.env.NODE_ENV === "development" && error instanceof Error ? error.message : fallback;

export const handleGetUserCampaignDayAnswers = async (req: AuthRequest, res: Response) => {
  try {
    const dayNumber = parseInt(req.params.dayNumber, 10);
    if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 90) {
      return res.status(400).json({ error: "Geçersiz gün numarası" });
    }

    if (!supabaseAdmin) return res.json({ answers: null });

    const { data: answerRow, error } = await supabaseAdmin
      .from("campaign90_day_answers")
      .select("answers")
      .eq("user_id", req.user!.id)
      .eq("day_number", dayNumber)
      .maybeSingle();

    if (error) {
       console.error("[C90] Get answers error:", error);
       return res.json({ answers: null });
    }

    res.json({ answers: answerRow?.answers || null });
  } catch (error: unknown) {
    console.error("[C90] Get answers catch error:", error);
    res.json({ answers: null });
  }
};

export const handlePutUserCampaignDayAnswers = async (req: AuthRequest, res: Response) => {
  try {
    const dayNumber = parseInt(req.params.dayNumber, 10);
    if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 90) {
      return res.status(400).json({ error: "Geçersiz gün numarası" });
    }

    const { answers } = req.body;
    if (!answers || typeof answers !== 'object') {
       return res.status(400).json({ error: "Geçersiz cevap formatı" });
    }

    if (!supabaseAdmin) return res.status(503).json({ error: "DB yok" });

    // We do basic sanitize by using the helper pattern manually, but let's just limit total keys / length
    // For safety, limit keys and total lengths (up to 5000 chars roughly)
    let validAnswers: Record<string, string> = {};
    let totalLen = 0;
    for (const [key, val] of Object.entries(answers)) {
      if (typeof key !== 'string' || typeof val !== 'string') continue;
      const sanitized = val.substring(0, 1000).trim();
      if (totalLen + sanitized.length > 5000) break;
      validAnswers[key.substring(0, 100)] = sanitized;
      totalLen += sanitized.length;
    }

    const payload = {
       user_id: req.user!.id,
       day_number: dayNumber,
       answers: validAnswers,
       answered_at: new Date().toISOString()
    };

    const { error } = await supabaseAdmin
       .from("campaign90_day_answers")
       .upsert(payload, { onConflict: "user_id, day_number" });

    if (error) {
       console.error("[C90] Put answers error:", error);
       return res.status(500).json({ error: "Kaydedilemedi" });
    }

    res.json({ success: true, message: "Cevaplar başarıyla kaydedildi" });
  } catch (error: unknown) {
    console.error("[C90] Put answers catch error:", error);
    res.status(500).json({ error: "Beklenmeyen hata" });
  }
};

export const handleGetUserCampaignDayContent = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) {
      return res.json({ content: null });
    }

    const dayNumber = parseInt(req.params.dayNumber, 10);
    if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 90) {
      return res.status(400).json({ error: "Geçersiz gün numarası (1-90 arası olmalı)" });
    }

    const { data: content, error } = await supabaseAdmin
      .from("campaign90_day_contents")
      .select("*")
      .eq("day_number", dayNumber)
      .eq("status", "published")
      .maybeSingle();

    if (error) {
       if (error.code === 'PGRST116' || error.message.includes('relation "public.campaign90_day_contents" does not exist')) {
          return res.json({ content: null });
       }
       console.error("[C90] Day content fetch error:", error);
       return res.json({ content: null }); // Fallback on db error
    }

    res.json({ content: content || null });
  } catch (error: unknown) {
    console.error("[C90] Catch error:", error);
    res.json({ content: null }); // Fallback on error
  }
};
