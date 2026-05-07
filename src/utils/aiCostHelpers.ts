export const USD_TO_TRY = 50;
export const COST_PER_MILLION_PROMPT_USD = 0.30;
export const COST_PER_MILLION_COMPLETION_USD = 2.50;

export const estimateGemini25FlashCostTRY = (promptTokens: number = 0, completionTokens: number = 0): number => {
  const promptCostUSD = (promptTokens / 1_000_000) * COST_PER_MILLION_PROMPT_USD;
  const completionCostUSD = (completionTokens / 1_000_000) * COST_PER_MILLION_COMPLETION_USD;
  return (promptCostUSD + completionCostUSD) * USD_TO_TRY;
};

export const estimateTokenCostTRY = (totalTokens: number = 0): number => {
  // Fallback: 75% input, 25% output
  const promptTokens = Math.floor(totalTokens * 0.75);
  const completionTokens = totalTokens - promptTokens;
  return estimateGemini25FlashCostTRY(promptTokens, completionTokens);
};

export const featureKeyToLabel = (featureKey?: string | null): string => {
  if (!featureKey) return 'Bilinmiyor';
  
  const rules: Record<string, string> = {
    'chat': 'Genel Sohbet',
    'admin_sql': 'Admin Raporu',
    'portfolio_marketing': 'Portföy Pazarlama',
    'portfolio_analysis': 'Portföy Analizi',
    'document_automation': 'Doküman Otomasyonu',
    'dashboard_coach': 'Dashboard AI Koç',
    'whatsapp_analysis': 'WhatsApp Analizi',
    'smart_match': 'Smart Match',
    'whatsapp_assistant': 'WhatsApp Asistan'
  };

  return rules[featureKey] || featureKey;
};

export const modelToLabel = (modelName?: string | null): string => {
  if (!modelName) return 'Bilinmiyor';
  if (modelName.includes('gemini-1.5-flash')) return 'Gemini 1.5 Flash';
  if (modelName.includes('gemini-2.0-flash') || modelName.includes('gemini-2.5-flash')) return 'Gemini 1.5/2.0 Flash';
  return modelName;
};

export const formatTRY = (value: number): string => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(value);
};

export const formatToken = (value: number): string => {
  return new Intl.NumberFormat('tr-TR').format(value);
};
