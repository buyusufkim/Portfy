import { describe, it, expect } from 'vitest';
import { calculateReflectionMetrics } from './campaign90ReflectionStatusHelpers';

describe('campaign90ReflectionStatusHelpers', () => {
  const getTurkeyTodayISO = (d: Date) => d.toISOString().split('T')[0];
  const todayStr = '2026-05-08';
  const nowMs = new Date(`${todayStr}T12:00:00Z`).getTime();

  it('handles empty answers array', () => {
    const res = calculateReflectionMetrics([], 'active', todayStr, nowMs, getTurkeyTodayISO);
    expect(res.lastAnswerAt).toBeNull();
    expect(res.totalAnsweredDays).toBe(0);
    expect(res.answeredToday).toBe(false);
    expect(res.missingTodayAnswer).toBe(true);
    expect(res.reflectionStatus).toBe('none');
  });

  it('handles answered today', () => {
    const uAns = [{ answered_at: '2026-05-08T10:00:00Z', day_number: 5 }];
    const res = calculateReflectionMetrics(uAns, 'active', todayStr, nowMs, getTurkeyTodayISO);
    expect(res.lastAnswerDayNumber).toBe(5);
    expect(res.totalAnsweredDays).toBe(1);
    expect(res.answeredToday).toBe(true);
    expect(res.missingTodayAnswer).toBe(false);
    expect(res.reflectionStatus).toBe('answered_today');
  });

  it('handles missing today', () => {
    // 1 day ago
    const uAns = [{ answered_at: '2026-05-07T10:00:00Z', day_number: 4 }];
    const res = calculateReflectionMetrics(uAns, 'active', todayStr, nowMs, getTurkeyTodayISO);
    expect(res.answeredToday).toBe(false);
    expect(res.missingTodayAnswer).toBe(true);
    expect(res.reflectionStatus).toBe('missing_today');
  });

  it('handles stale reflections', () => {
    // 4 days ago
    const uAns = [{ answered_at: '2026-05-04T10:00:00Z', day_number: 3 }];
    const res = calculateReflectionMetrics(uAns, 'active', todayStr, nowMs, getTurkeyTodayISO);
    expect(res.answeredToday).toBe(false);
    expect(res.missingTodayAnswer).toBe(true);
    expect(res.daysSinceLastAnswer).toBe(4);
    expect(res.reflectionStatus).toBe('stale');
  });

  it('does not mark missing for inactive campaign', () => {
    const uAns = [{ answered_at: '2026-05-07T10:00:00Z', day_number: 4 }];
    const res = calculateReflectionMetrics(uAns, 'paused', todayStr, nowMs, getTurkeyTodayISO);
    expect(res.missingTodayAnswer).toBe(false);
    expect(res.reflectionStatus).toBe('missing_today'); // status remains the same, but flag missingTodayAnswer is false
  });
});
