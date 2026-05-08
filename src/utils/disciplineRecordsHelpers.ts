import { DayClosure } from '../types';

export const countClosedDaysInRange = (records: DayClosure[], days: number): number => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffISO = cutoffDate.toISOString().split('T')[0];

  return records.filter(r => r.closure_date >= cutoffISO).length;
};

export const getLastClosureDate = (records: DayClosure[]): string | null => {
  if (!records || records.length === 0) return null;
  // Assumes records are sorted descending by closure_date
  return records[0].closure_date;
};

export const extractTopBlockers = (records: DayClosure[]): string => {
  const blockersMap: Record<string, number> = {};
  
  records.forEach(r => {
    if (r.blockers && r.blockers.trim().length > 3) {
      const b = r.blockers.trim();
      blockersMap[b] = (blockersMap[b] || 0) + 1;
    }
  });

  const sortedBlockers = Object.entries(blockersMap)
    .sort((a, b) => b[1] - a[1]);

  if (sortedBlockers.length === 0) return "Sürekli tekrar eden bir engel yok.";
  
  const top = sortedBlockers[0];
  if (top[1] > 1) {
    return `"${top[0]}" (${top[1]} kez takıldın)`;
  }
  
  return sortedBlockers.map(b => b[0]).slice(0, 1).join(', ') || "Belirgin bir engel yok.";
};

export const countCampaignReflections = (records: DayClosure[]): number => {
  return records.filter(r => r.campaign_focus_reflection || r.campaign_day).length;
};
