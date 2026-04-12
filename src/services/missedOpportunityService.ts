import { MissedOpportunity, Property, Lead, Building } from '../types';
import { supabase } from '../lib/supabase';
import { leadService } from './leadService';
import { propertyService } from './propertyService';
import { fieldVisitService } from './fieldVisitService';

export const missedOpportunityService = {
  getMissedOpportunities: async (): Promise<MissedOpportunity[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const agentId = user.id;

    const [leads, properties, visits] = await Promise.all([
      leadService.getLeads(),
      propertyService.getProperties(),
      fieldVisitService.getFieldVisits()
    ]);

    const opportunities: MissedOpportunity[] = [];
    const now = new Date();

    // 1. Lead Follow-up (7+ days)
    leads.forEach(l => {
      const last = new Date(l.last_contact);
      const diff = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      if (diff >= 7) {
        opportunities.push({
          id: `lead-${l.id}`,
          type: 'lead_followup',
          title: `${l.name} ile temas kesildi`,
          description: `${diff} gündür bu müşteriyle iletişime geçmedin. Başkasına gitmeden hemen ara!`,
          target_id: l.id,
          days_delayed: diff,
          priority: diff > 14 ? 'high' : 'medium',
          potential_value: 100
        });
      }
    });

    // 2. Stale Properties (14+ days)
    properties.forEach(p => {
      if (['Satıldı', 'Pasif'].includes(p.status)) return;
      const last = new Date(p.updated_at);
      const diff = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      if (diff >= 14) {
        opportunities.push({
          id: `prop-${p.id}`,
          type: 'property_stale',
          title: `"${p.title}" portföyü unutuldu`,
          description: `${diff} gündür bu ilanda hiçbir güncelleme yapmadın. İlanın güncelliği düşüyor.`,
          target_id: p.id,
          days_delayed: diff,
          priority: diff > 30 ? 'high' : 'medium',
          potential_value: 200
        });
      }

      // 3. Price Drop Potential
      if (p.market_analysis?.status === 'Pahalı' && p.sale_probability < 0.4) {
        opportunities.push({
          id: `price-${p.id}`,
          type: 'price_drop_potential',
          title: `Fiyat revizyonu fırsatı: ${p.title}`,
          description: "Bu mülk pazarın üzerinde kalmış görünüyor. Malikle görüşüp fiyatı %5-10 aşağı çekersen satış ihtimali %40 artar.",
          target_id: p.id,
          days_delayed: 0,
          priority: 'high',
          potential_value: 500
        });
      }
    });

    // 4. Stale Visits (30+ days)
    visits.forEach(v => {
      const last = new Date(v.last_visit);
      const diff = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      if (diff >= 30) {
        opportunities.push({
          id: `visit-${v.id}`,
          type: 'visit_stale',
          title: `${v.address} ziyareti soğudu`,
          description: "Bu binayı 1 ay önce ziyaret etmiştin. Malikler taşınmış veya karar vermiş olabilir. Tekrar uğra!",
          target_id: v.id,
          days_delayed: diff,
          priority: 'medium',
          potential_value: 50
        });
      }
    });

    return opportunities.sort((a, b) => {
      const priorityMap = { high: 3, medium: 2, low: 1 };
      return priorityMap[b.priority] - priorityMap[a.priority];
    });
  }
};
