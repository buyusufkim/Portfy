import { Response } from "express";
import { AuthRequest } from "./ai-api.js";
import { createClient } from "@supabase/supabase-js";

export const handleGetSystemHealth = async (req: AuthRequest, res: Response) => {
  const timestamp = new Date().toISOString();
  
  // Basic checks
  const apiCheck = { ok: true, latencyMs: 0 };
  const supabaseCheck = { ok: false, latencyMs: 0, message: "Not checked" };
  const aiProviderCheck = { ok: false, message: "Unconfigured" };
  const marketProviderCheck = { ok: false, message: "Unconfigured" };

  try {
    // 1. Supabase Check
    const sbStart = Date.now();
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    if (supabaseUrl && supabaseServiceKey) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
      // Lightweight query
      const { error } = await supabaseAdmin.from('profiles').select('id').limit(1);
      supabaseCheck.latencyMs = Date.now() - sbStart;
      if (error) {
        supabaseCheck.ok = false;
        supabaseCheck.message = "Database query failed";
      } else {
        supabaseCheck.ok = true;
        supabaseCheck.message = "Connected";
      }
    } else {
      supabaseCheck.message = "Missing Supabase env vars";
    }

    // 2. AI Provider Check
    if (process.env.GEMINI_API_KEY) {
      // In MVP, we just check presence. Optionally, could do a minimal actual ping to Google AI API.
      aiProviderCheck.ok = true;
      aiProviderCheck.message = "Configured";
    } else {
      aiProviderCheck.ok = false;
      aiProviderCheck.message = "Missing API key";
    }

    // 3. Market Provider Check
    if (process.env.EVOMI_API_KEY) {
      marketProviderCheck.ok = true;
      marketProviderCheck.message = "Configured";
    } else {
      marketProviderCheck.ok = false;
      marketProviderCheck.message = "Missing API key";
    }

    res.json({
      ok: true,
      timestamp,
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      uptimeSeconds: Math.floor(process.uptime()),
      checks: {
        api: apiCheck,
        supabase: supabaseCheck,
        aiProvider: aiProviderCheck,
        marketProvider: marketProviderCheck
      }
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      timestamp,
      environment: process.env.NODE_ENV || 'development',
      error: "Health check failed."
    });
  }
};
