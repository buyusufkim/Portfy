export interface AICoachAction {
  id: string;
  type: 'call' | 'visit' | 'followup' | 'update' | 'rescue';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  target_id?: string; // Lead or Property ID
  target_name?: string;
  points: number;
}

export interface AICoachInsight {
  score: number;
  briefing: string;
  actions: AICoachAction[];
  warnings: string[];
  performance_evaluation: string;
  is_rescue_mode_recommended: boolean;
}

export interface AICoachResponse {
  insight: AICoachInsight;
  generated_at: string;
}
