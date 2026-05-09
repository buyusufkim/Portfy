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

export const buildCalendarDaysForMonth = (year: number, month: number): Date[] => {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let firstDayOfWeek = firstDay.getDay() - 1;
  if(firstDayOfWeek === -1) firstDayOfWeek = 6;

  for (let i = firstDayOfWeek; i > 0; i--) {
    days.push(new Date(year, month, 1 - i));
  }

  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }

  const remaining = days.length % 7;
  if (remaining !== 0) {
    const toAdd = 7 - remaining;
    for (let i = 1; i <= toAdd; i++) {
      days.push(new Date(year, month + 1, i));
    }
  }

  return days;
};

export const getRecordForDate = (records: DayClosure[], date: Date): DayClosure | undefined => {
  const isoDate = new Date(date).toLocaleDateString('sv').split('T')[0]; // simple stable yyyy-mm-dd fallback depending on timezone though sv locale yields YYYY-MM-DD
  // actually simpler to just manual format:
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const target = `${yyyy}-${mm}-${dd}`;
  
  return records.find(r => r.closure_date === target);
};

export const hasCampaignReflectionForDate = (records: DayClosure[], date: Date): boolean => {
  const record = getRecordForDate(records, date);
  return !!record && (!!record.campaign_focus_reflection || !!record.campaign_day);
};

export const formatDisciplineRecordDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

export const formatWorkTimeRange = (record: DayClosure): string | null => {
  if (!record.day_started_at && !record.day_closed_at) return null;
  
  const startStr = record.day_started_at 
    ? new Date(record.day_started_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : '??:??';
    
  const endStr = record.day_closed_at
    ? new Date(record.day_closed_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : '??:??';
    
  return `${startStr} - ${endStr}`;
};

export const formatWorkDuration = (minutes: number | null | undefined): string | null => {
  if (minutes === null || minutes === undefined) return null;
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  if (hours === 0) return `${mins} dk`;
  return `${hours} saat ${mins} dk`;
};

export const calculateAverageWorkDuration = (records: DayClosure[]): string | null => {
  const validRecords = records.filter(r => r.work_duration_minutes != null);
  if (validRecords.length === 0) return null;
  const total = validRecords.reduce((sum, r) => sum + (r.work_duration_minutes || 0), 0);
  const avg = Math.round(total / validRecords.length);
  return formatWorkDuration(avg);
};
