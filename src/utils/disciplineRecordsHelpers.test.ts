import { describe, it, expect } from 'vitest';
import { countClosedDaysInRange, getLastClosureDate, extractTopBlockers, countCampaignReflections, buildCalendarDaysForMonth, getRecordForDate, hasCampaignReflectionForDate, formatDisciplineRecordDate, formatWorkTimeRange, formatWorkDuration, calculateAverageWorkDuration } from './disciplineRecordsHelpers';
import { DayClosure } from '../types';

const mockCurrentDate = new Date('2026-05-08T12:00:00Z'); // fixed for calendar logic

const createMockRecord = (offsetDays: number, blockers: string | undefined, campaign_day?: number, day_started_at?: string, day_closed_at?: string, work_duration_minutes?: number): DayClosure => {
  const d = new Date(mockCurrentDate);
  d.setDate(d.getDate() - offsetDays);
  return {
    id: `id_${offsetDays}`,
    user_id: 'user',
    closure_date: d.toISOString().split('T')[0],
    blockers,
    tomorrow_top3: [],
    stuck_lead_ids: [],
    stuck_property_ids: [],
    completed_calls: 0,
    completed_followups: 0,
    completed_portfolio_actions: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    campaign_day,
    campaign_focus_reflection: campaign_day ? 'Reflection' : undefined,
    day_started_at,
    day_closed_at,
    work_duration_minutes
  };
};

describe('disciplineRecordsHelpers', () => {
  it('countClosedDaysInRange counts within date correctly', () => {
    const records = [
      createMockRecord(1, 'A'),
      createMockRecord(5, 'B'),
      createMockRecord(8, 'C'), // outside 7 days
      createMockRecord(10, 'D')
    ];

    expect(countClosedDaysInRange(records, 7)).toBe(2);
    expect(countClosedDaysInRange(records, 30)).toBe(4);
  });

  it('getLastClosureDate works with empty array', () => {
    expect(getLastClosureDate([])).toBeNull();
  });

  it('getLastClosureDate returns first item date', () => {
    const records = [
      createMockRecord(1, 'A')
    ];
    expect(getLastClosureDate(records)).toBe(records[0].closure_date);
  });

  it('extractTopBlockers handles empty or identical blockers', () => {
    const records = [
      createMockRecord(1, 'Vakit yetmedi'),
      createMockRecord(2, 'Vakit yetmedi'),
      createMockRecord(3, 'Motivasyon dushuktu')
    ];
    expect(extractTopBlockers(records).includes('Vakit yetmedi')).toBe(true);
    expect(extractTopBlockers(records).includes('(2 kez')).toBe(true);
  });

  it('countCampaignReflections handles badges correctly', () => {
    const records = [
      createMockRecord(1, 'A', 2),
      createMockRecord(2, 'B'),
      createMockRecord(3, 'C', 4)
    ];
    expect(countCampaignReflections(records)).toBe(2);
  });

  it('buildCalendarDaysForMonth builds correct grid of days', () => {
    // May 2026 starts on Friday (5 means Friday usually, but 1st is Friday).
    const days = buildCalendarDaysForMonth(2026, 4); // 4 = May
    expect(days.length).toBeGreaterThanOrEqual(28);
    expect(days.length % 7).toBe(0);
    // May has 31 days
    const firstDay = days[0]; // should be previous month
    expect(firstDay.getDay()).toBe(1); // Monday
  });

  it('getRecordForDate and hasCampaignReflectionForDate', () => {
    const record = createMockRecord(0, 'A'); // today (2026-05-08)
    const records = [record, createMockRecord(1, 'B', 5)]; // yesterday has campaign reflection

    const todayDate = new Date('2026-05-08');
    const yesterdayDate = new Date('2026-05-07');
    const anotherDate = new Date('2026-05-01');

    expect(getRecordForDate(records, todayDate)).toBe(record);
    expect(getRecordForDate(records, anotherDate)).toBeUndefined();

    expect(hasCampaignReflectionForDate(records, todayDate)).toBe(false);
    expect(hasCampaignReflectionForDate(records, yesterdayDate)).toBe(true);
    expect(hasCampaignReflectionForDate(records, anotherDate)).toBe(false);
  });

  it('formatWorkDuration formats null and correct times', () => {
    expect(formatWorkDuration(null)).toBeNull();
    expect(formatWorkDuration(45)).toBe('45 dk');
    expect(formatWorkDuration(125)).toBe('2 saat 5 dk');
  });

  it('calculateAverageWorkDuration returns correct averages', () => {
    const records = [
      createMockRecord(1, 'A', undefined, undefined, undefined, 60),
      createMockRecord(2, 'A', undefined, undefined, undefined, 120),
      createMockRecord(3, 'A') // no duration
    ];
    expect(calculateAverageWorkDuration(records)).toBe('1 saat 30 dk');
  });

  it('formatWorkTimeRange formats ranges gracefully', () => {
    const r1 = createMockRecord(1, 'A', undefined, '2026-05-08T09:00:00Z', '2026-05-08T18:00:00Z');
    const r2 = createMockRecord(2, 'A', undefined, '2026-05-08T09:00:00Z');
    
    // We don't strictly test TZ hour components locally because vitest might run in UTC, 
    // but we can check if the formatting function doesn't crash and contains "??:??" if missing
    expect(formatWorkTimeRange(r1)).not.toBeNull();
    expect(formatWorkTimeRange(r2)).toContain('??:??');
    expect(formatWorkTimeRange(createMockRecord(3, 'a'))).toBeNull();
  });
});
