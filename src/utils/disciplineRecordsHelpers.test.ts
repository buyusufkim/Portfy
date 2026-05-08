import { describe, it, expect } from 'vitest';
import { countClosedDaysInRange, getLastClosureDate, extractTopBlockers, countCampaignReflections } from './disciplineRecordsHelpers';
import { DayClosure } from '../types';

const mockCurrentDate = new Date(); // assume e.g. 2026-05-08

const createMockRecord = (offsetDays: number, blockers: string | undefined, campaign_day?: number): DayClosure => {
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
    campaign_focus_reflection: campaign_day ? 'Reflection' : undefined
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
});
