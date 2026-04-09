export type WhatsAppCustomerType = 'Alıcı' | 'Satıcı' | 'Kiracı' | 'Yatırımcı' | 'Diğer';
export type InterestLevel = 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik';

export interface WhatsAppAnalysis {
  customer_name: string;
  customer_type: WhatsAppCustomerType;
  interest_level: InterestLevel;
  hotness_score: number; // 0-100
  urgency: string;
  budget_signal: string;
  suggested_action: string;
  follow_up_date: string; // ISO date
  confidence_score: number; // 0-100
  summary: string;
  extracted_details: {
    location_preference?: string;
    property_type?: string;
    price_range?: string;
    reason_for_moving?: string;
  };
}

export interface WhatsAppAnalysisResponse {
  analysis: WhatsAppAnalysis;
  raw_text: string;
  generated_at: string;
}
