import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

// Avoid crashing if vars are missing
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export interface RuntimeErrorLogInput {
  requestId?: string;
  userId?: string | null;
  route?: string;
  method?: string;
  statusCode?: number;
  errorCode?: string;
  message: string;
  source?: 'server' | 'ai' | 'market' | 'portal' | 'meta' | 'unknown';
  severity?: 'info' | 'warning' | 'error' | 'critical';
  metadata?: Record<string, unknown>;
}

export const logRuntimeError = async (input: RuntimeErrorLogInput) => {
  try {
    if (!supabaseUrl) return; // Silent skip if no db configured

    // Basic sanitization: do not store API keys or raw bodies accidentally
    // Just stringifying the safe metadata fields would be done at call site,
    // but we can ensure no deeply nested objects crash it.
    let safeMetadata = input.metadata || {};

    // Remove any keys containing 'key', 'token', 'secret', 'password'
    const sanitizeMetadata = (obj: Record<string, any>) => {
      const sanitized: Record<string, any> = {};
      for (const [k, v] of Object.entries(obj)) {
        const lowerK = k.toLowerCase();
        if (lowerK.includes('key') || lowerK.includes('token') || lowerK.includes('secret') || lowerK.includes('password')) {
          sanitized[k] = '***REDACTED***';
        } else {
          sanitized[k] = v;
        }
      }
      return sanitized;
    };

    safeMetadata = sanitizeMetadata(safeMetadata);

    await supabase.from('runtime_error_logs').insert({
      request_id: input.requestId,
      user_id: input.userId,
      route: input.route,
      method: input.method,
      status_code: input.statusCode,
      error_code: input.errorCode,
      message: input.message,
      source: input.source || 'server',
      severity: input.severity || 'error',
      metadata: safeMetadata
    });
  } catch (error) {
    // Fire and forget, don't crash main request
    console.error('Failed to log runtime error to db:', error);
  }
};
