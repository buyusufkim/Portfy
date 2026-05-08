import { describe, it, expect } from 'vitest';
import { 
  normalizeQuestionKey, 
  buildInitialAnswers, 
  sanitizeCampaignAnswerText, 
  validateCampaignAnswersPayload,
  answersRecordToDisplayList
} from './campaign90AnswerHelpers';

describe('campaign90AnswerHelpers', () => {
  it('normalizeQuestionKey handles nulls and special chars', () => {
    expect(normalizeQuestionKey(null, 0)).toBe('question_0');
    expect(normalizeQuestionKey('What is your name?', 1)).toBe('question_1_what_is_your_name_');
  });

  it('buildInitialAnswers maps questions correctly', () => {
    const questions = ['Q1', 'Q2'];
    const r = buildInitialAnswers(questions, { 'question_0_q1': 'my answer' });
    expect(r['question_0_q1']).toBe('my answer');
    expect(r['question_1_q2']).toBe('');
  });

  it('sanitizeCampaignAnswerText limits length', () => {
    expect(sanitizeCampaignAnswerText(null)).toBe('');
    expect(sanitizeCampaignAnswerText('  hello  ')).toBe('hello');
    const longString = 'a'.repeat(2000);
    expect(sanitizeCampaignAnswerText(longString).length).toBe(1000);
  });

  it('validateCampaignAnswersPayload validates object', () => {
    expect(validateCampaignAnswersPayload(null)).toEqual({});
    expect(validateCampaignAnswersPayload({ k1: 'val1', k2: 123 })).toEqual({ k1: 'val1' });
    
    // total length check
    const huge = {
       k1: 'a'.repeat(1000),
       k2: 'b'.repeat(1000),
       k3: 'c'.repeat(1000),
       k4: 'd'.repeat(1000),
       k5: 'e'.repeat(1000),
       k6: 'f'.repeat(1000),
    };
    const valid = validateCampaignAnswersPayload(huge);
    expect(Object.keys(valid).length).toBeLessThan(6);
  });

  it('answersRecordToDisplayList', () => {
    const rec = { q1: 'A1', q2: 'A2', q3: '' };
    const list = answersRecordToDisplayList(rec);
    expect(list).toEqual([
      { questionKey: 'q1', answer: 'A1' },
      { questionKey: 'q2', answer: 'A2' }
    ]);
  });
});
