import { supabase } from '../lib/supabase';

export interface AdminSystemHealth {
  ok: boolean;
  timestamp: string;
  environment: string;
  nodeVersion: string;
  uptimeSeconds: number;
  checks: {
    api: { ok: boolean; latencyMs: number };
    supabase: { ok: boolean; latencyMs: number; message?: string };
    aiProvider: { ok: boolean; latencyMs?: number; message?: string };
    marketProvider: { ok: boolean; latencyMs?: number; message?: string };
  };
}

export interface RuntimeErrorLog {
  id: string;
  request_id?: string;
  user_id?: string;
  route?: string;
  method?: string;
  status_code?: number;
  error_code?: string;
  message: string;
  source: string;
  severity: string;
  created_at: string;
  user?: {
    display_name: string;
    email: string;
  };
}

export interface AdminSystemHealthParams {
  limit?: number;
  offset?: number;
  sourceFilter?: string;
  severityFilter?: string;
  search?: string;
}

export interface RuntimeErrorSummary {
  totalCount: number;
  criticalCount: number;
  errorCount: number;
  warningCount: number;
  last24HoursCount: number;
  topSource: string | null;
}

export const adminSystemHealthService = {
  async getSystemHealth(): Promise<AdminSystemHealth> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    if (!token) throw new Error("No auth token");

    const response = await fetch('/api/admin/health', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 403) throw new Error("Yetkiniz yok.");
      if (response.status === 401) throw new Error("Oturum süresi dolmuş.");
      throw new Error(`Sistem sağlığı API hatası: ${response.status}`);
    }

    return response.json();
  },

  async getRuntimeErrorLogs(params: AdminSystemHealthParams): Promise<RuntimeErrorLog[]> {
    let query = supabase
      .from('runtime_error_logs')
      .select(`
        *,
        profiles!runtime_error_logs_user_id_fkey(
          display_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (params.sourceFilter && params.sourceFilter !== 'all') {
      query = query.eq('source', params.sourceFilter);
    }
    
    if (params.severityFilter && params.severityFilter !== 'all') {
      query = query.eq('severity', params.severityFilter);
    }

    if (params.search) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.search);
      // Filter intelligently, but supabase OR chaining with foreign table might be complex. 
      // We'll search primarily on message, route, or request_id.
      let orString = `message.ilike.%${params.search}%,route.ilike.%${params.search}%`;
      if (isUuid) {
           orString += `,request_id.eq.${params.search}`;
      }
      query = query.or(orString);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((row: any) => ({
      ...row,
      user: row.profiles || null
    }));
  },

  // Calculate summary based on logs instead of separate intense query to simplify
  calculateSummary(logs: RuntimeErrorLog[]): RuntimeErrorSummary {
    let criticalCount = 0;
    let errorCount = 0;
    let warningCount = 0;
    let last24HoursCount = 0;
    const sourceCounts: Record<string, number> = {};

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    logs.forEach(log => {
      if (log.severity === 'critical') criticalCount++;
      else if (log.severity === 'error') errorCount++;
      else if (log.severity === 'warning') warningCount++;

      if (new Date(log.created_at) > yesterday) {
        last24HoursCount++;
      }

      const s = log.source || 'unknown';
      sourceCounts[s] = (sourceCounts[s] || 0) + 1;
    });

    let topSource = null;
    let max = 0;
    for (const [s, count] of Object.entries(sourceCounts)) {
      if (count > max) {
        max = count;
        topSource = s;
      }
    }

    return {
      totalCount: logs.length,
      criticalCount,
      errorCount,
      warningCount,
      last24HoursCount,
      topSource
    };
  }
};
