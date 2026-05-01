export interface AICoachAction {
  id: string;
  type: "call" | "visit" | "followup" | "update" | "rescue" | "social";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
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

export interface AICoachMainFocus {
  title: string;
  reason: string;
  targetRoute: string; // e.g. "/tasks", "/crm", "/portfolio"
}

export interface AICoachSuggestedAction {
  title: string;
  description: string;
  targetRoute: string; // e.g. "/crm", "/tasks"
  priority: "high" | "medium" | "low";
}

export interface AICoachInteractiveResponse {
  coachComment: string;
  mainFocus: AICoachMainFocus[];
  suggestedActions: AICoachSuggestedAction[];
  emptyReason: string | null;
}

export interface AICoachResponse {
  insight: AICoachInteractiveResponse;
  generated_at: string;
}

