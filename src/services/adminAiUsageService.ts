import { supabase } from '../lib/supabase';
import { estimateTokenCostTRY, estimateGemini25FlashCostTRY } from '../utils/aiCostHelpers';

export interface AdminAiUsageParams {
  limit?: number;
  offset?: number;
  featureFilter?: string;
  userSearch?: string;
  statusFilter?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface AdminAiUsageSummary {
  totalRequests: number;
  totalTokens: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  estimatedCostTRY: number;
  avgTokensPerRequest: number;
  topFeatures: { label: string; requests: number; tokens: number; cost: number }[];
  topModels: { label: string; requests: number; tokens: number; cost: number }[];
  topUsers?: { userId: string; email: string; name: string; tier: string; requests: number; tokens: number; cost: number }[];
  errorCount: number;
}

export const adminAiUsageService = {
  async getAdminAiUsageLogs(params: AdminAiUsageParams) {
    let query = supabase
      .from('ai_request_logs')
      .select(`
        *,
        profiles!ai_request_logs_user_id_fkey(
          display_name,
          email,
          phone,
          tier,
          subscription_type,
          subscription_end_date
        )
      `)
      .order('created_at', { ascending: false });

    if (params.featureFilter && params.featureFilter !== 'all') {
      query = query.eq('feature_key', params.featureFilter);
    }
    if (params.statusFilter) {
      query = query.eq('status_code', params.statusFilter);
    }
    if (params.dateFrom) {
      query = query.gte('created_at', params.dateFrom);
    }
    if (params.dateTo) {
      query = query.lte('created_at', params.dateTo);
    }
    if (params.limit) {
      query = query.limit(params.limit);
    }

    const { data: rawData, error } = await query;

    if (error) throw error;

    // Supabase returns foreign key records as 'profiles' because of join alias. We map it nicely.
    // Also handling missing profile data if left join is null or user deleted.
    const mapped = (rawData || []).map((row: any) => ({
      ...row,
      user_profile: row.profiles || null
    }));

    if (params.userSearch) {
      const q = params.userSearch.toLowerCase();
      return mapped.filter(r => 
        (r.user_profile?.display_name || '').toLowerCase().includes(q) ||
        (r.user_profile?.email || '').toLowerCase().includes(q)
      );
    }

    return mapped;
  },

  async getAdminAiUsageSummary(params: AdminAiUsageParams): Promise<AdminAiUsageSummary> {
    let query = supabase
      .from('ai_request_logs')
      .select(`
        id, user_id, prompt_tokens, completion_tokens, total_tokens, 
        model_name, feature_key, status_code, created_at,
        profiles!ai_request_logs_user_id_fkey(display_name, email, tier)
      `);
      
    if (params.dateFrom) query = query.gte('created_at', params.dateFrom);
    if (params.dateTo) query = query.lte('created_at', params.dateTo);
    if (params.featureFilter && params.featureFilter !== 'all') query = query.eq('feature_key', params.featureFilter);

    const { data, error } = await query;
    if (error) throw error;

    let totalRequests = 0;
    let totalTokens = 0;
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let errorCount = 0;

    const featureMap: Record<string, any> = {};
    const modelMap: Record<string, any> = {};
    const userMap: Record<string, any> = {};

    (data || []).forEach((row: any) => {
      totalRequests++;
      totalTokens += (row.total_tokens || 0);
      totalPromptTokens += (row.prompt_tokens || 0);
      totalCompletionTokens += (row.completion_tokens || 0);
      
      let cost = 0;
      if (row.prompt_tokens || row.completion_tokens) {
        cost = estimateGemini25FlashCostTRY(row.prompt_tokens || 0, row.completion_tokens || 0);
      } else {
        cost = estimateTokenCostTRY(row.total_tokens || 0);
      }

      if (row.status_code && row.status_code >= 400) {
        errorCount++;
      }

      const fk = row.feature_key || 'unknown';
      if (!featureMap[fk]) featureMap[fk] = { label: fk, requests: 0, tokens: 0, cost: 0 };
      featureMap[fk].requests++;
      featureMap[fk].tokens += (row.total_tokens || 0);
      featureMap[fk].cost += cost;

      const model = row.model_name || 'unknown';
      if (!modelMap[model]) modelMap[model] = { label: model, requests: 0, tokens: 0, cost: 0 };
      modelMap[model].requests++;
      modelMap[model].tokens += (row.total_tokens || 0);
      modelMap[model].cost += cost;

      const uid = row.user_id;
      if (uid) {
        if (!userMap[uid]) {
          userMap[uid] = { 
            userId: uid, 
            email: row.profiles?.email || 'Bilinmiyor', 
            name: row.profiles?.display_name || 'İsimsiz', 
            tier: row.profiles?.tier || 'free',
            requests: 0, 
            tokens: 0, 
            cost: 0 
          };
        }
        userMap[uid].requests++;
        userMap[uid].tokens += (row.total_tokens || 0);
        userMap[uid].cost += cost;
      }
    });

    const estimatedCostTRY = data && data.length > 0 
      ? Object.values(featureMap).reduce((acc: number, curr: any) => acc + curr.cost, 0)
      : 0;

    const topFeatures = Object.values(featureMap).sort((a: any, b: any) => b.tokens - a.tokens);
    const topModels = Object.values(modelMap).sort((a: any, b: any) => b.tokens - a.tokens);
    const topUsers = Object.values(userMap).sort((a: any, b: any) => b.tokens - a.tokens).slice(0, 10);

    return {
      totalRequests,
      totalTokens,
      totalPromptTokens,
      totalCompletionTokens,
      estimatedCostTRY,
      avgTokensPerRequest: totalRequests > 0 ? Math.round(totalTokens / totalRequests) : 0,
      topFeatures,
      topModels,
      topUsers,
      errorCount
    };
  }
};
