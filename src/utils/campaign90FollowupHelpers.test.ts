import { describe, it, expect } from 'vitest';
import { validateFollowupPayload, formatActionType } from './campaign90FollowupHelpers';

describe('campaign90FollowupHelpers', () => {
  it('validates and falls back invalid values', () => {
    const payload = {
        actionType: 'invalid_action',
        priority: 'super_high',
        status: 'unknown',
        note: '   test note   ',
        dueDate: 'invalid_date',
        dayNumber: 99
    };

    const res = validateFollowupPayload(payload);
    expect(res.valid).toBe(true);
    expect(res.data?.action_type).toBe('note');
    expect(res.data?.priority).toBe('normal');
    expect(res.data?.status).toBe('open');
    expect(res.data?.note).toBe('test note');
    expect(res.data?.due_date).toBeNull();
    expect(res.data?.day_number).toBeNull();
  });

  it('fails if note is missing', () => {
    const payload = { actionType: 'call' };
    const res = validateFollowupPayload(payload);
    expect(res.error).toBeDefined();
  });

  it('keeps valid values', () => {
    const payload = {
        actionType: 'whatsapp',
        priority: 'urgent',
        status: 'in_progress',
        note: 'send a message',
        dueDate: '2026-05-10',
        dayNumber: 15
    };

    const res = validateFollowupPayload(payload);
    expect(res.valid).toBe(true);
    expect(res.data?.action_type).toBe('whatsapp');
    expect(res.data?.priority).toBe('urgent');
    expect(res.data?.status).toBe('in_progress');
    expect(res.data?.due_date).toBe('2026-05-10');
    expect(res.data?.day_number).toBe(15);
  });

  it('formats action type', () => {
    expect(formatActionType('whatsapp')).toBe('WhatsApp Mesajı');
  });
});
