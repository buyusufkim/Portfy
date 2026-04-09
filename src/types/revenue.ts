import { Lead, Property } from '../types';

export interface RevenueStats {
  total_pipeline_value: number;
  potential_commission: number;
  weighted_revenue: number; // Based on probability
  today_opportunity: number;
  hot_leads_count: number;
  untracked_risk_count: number;
  missed_opportunities_value: number;
}

export interface Opportunity {
  id: string;
  title: string;
  value: number;
  probability: number;
  status: 'cold' | 'warm' | 'hot' | 'closing';
  last_activity: string;
}

export interface MissedOpportunity {
  id: string;
  reason: string;
  potential_value: number;
  lost_at: string;
  customer_name: string;
}
