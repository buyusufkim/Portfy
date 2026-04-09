import { Lead, Property, LeadStatus } from '../types';
import { RevenueStats } from '../types/revenue';

const STATUS_PROBABILITY: Record<string, number> = {
  'Aday': 0.15,
  'Sıcak': 0.65,
  'Yetki Alındı': 0.90,
  'Pasif': 0.0,
  'Yeni': 0.20,
  'Hazırlanıyor': 0.40,
  'Yayında': 0.60,
  'İlgi Var': 0.75,
  'Pazarlık': 0.85,
  'Satıldı': 1.0,
};

export const calculateRevenueStats = (
  leads: Lead[],
  properties: Property[],
  missedOpportunities: any[] = []
): RevenueStats => {
  // Total Pipeline Value (Sum of all active property prices)
  const activeProperties = properties.filter(p => !['Satıldı', 'Pasif'].includes(p.status));
  const totalPipelineValue = activeProperties.reduce((sum, p) => sum + (p.price || 0), 0);

  // Potential Commission (Sum of price * commission_rate)
  const potentialCommission = activeProperties.reduce((sum, p) => {
    const rate = p.commission_rate || 2; // Default 2%
    return sum + ((p.price * rate) / 100);
  }, 0);

  // Weighted Revenue (Sum of potential commission * probability)
  const weightedRevenue = activeProperties.reduce((sum, p) => {
    const rate = p.commission_rate || 2;
    const probability = STATUS_PROBABILITY[p.status] || 0.5;
    return sum + (((p.price * rate) / 100) * probability);
  }, 0);

  // Today's Opportunity (Weighted revenue from hot leads and properties in 'Pazarlık' or 'İlgi Var')
  const todayOpportunity = activeProperties
    .filter(p => ['Pazarlık', 'İlgi Var'].includes(p.status))
    .reduce((sum, p) => {
      const rate = p.commission_rate || 2;
      return sum + ((p.price * rate) / 100);
    }, 0);

  // Hot Leads Count
  const hotLeadsCount = leads.filter(l => l.status === 'Sıcak').length;

  // Untracked Risk Count (Leads not contacted in more than 3 days)
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const untrackedRiskCount = leads.filter(l => {
    if (!l.last_contact) return true;
    return new Date(l.last_contact) < threeDaysAgo;
  }).length;

  // Missed Opportunities Value
  const missedOpportunitiesValue = missedOpportunities.reduce((sum, mo) => sum + (mo.potential_value || 0), 0);

  return {
    total_pipeline_value: totalPipelineValue,
    potential_commission: potentialCommission,
    weighted_revenue: weightedRevenue,
    today_opportunity: todayOpportunity,
    hot_leads_count: hotLeadsCount,
    untracked_risk_count: untrackedRiskCount,
    missed_opportunities_value: missedOpportunitiesValue,
  };
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value);
};
