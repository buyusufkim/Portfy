export const featureKeyToLabel = (key: string | null | undefined): string => {
  if (!key) return 'Bilinmeyen İşlem';
  const labels: Record<string, string> = {
    'dashboard_coach': 'Dashboard AI Koç',
    'ai_coach': 'AI Koç',
    'property_marketing_content': 'Portföy Pazarlama',
    'whatsapp_analysis': 'WhatsApp Analizi',
    'whatsapp_lead_extract': 'WhatsApp Lead Çıkarma',
    'business_card_parse': 'Kartvizit Okuma',
    'generic_safe_json': 'Genel AI İşlemi'
  };
  return labels[key] || 'AI İşlemi';
};

export const shortRequestId = (id: string | null | undefined): string => {
  if (!id) return '';
  return id.substring(0, 8);
};
