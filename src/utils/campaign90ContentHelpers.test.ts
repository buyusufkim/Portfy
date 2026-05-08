import { describe, it, expect } from 'vitest';
import {
  parseQuestionsFromTextarea,
  serializeQuestionsToTextarea,
  normalizeCampaignDayStatus,
  getCampaignDayContentCompleteness
} from './campaign90ContentHelpers';

describe('campaign90ContentHelpers', () => {
  it('parseQuestionsFromTextarea converts text to array', () => {
    const text = `Soru 1
    
    Soru 2
    Soru 3  `;
    const result = parseQuestionsFromTextarea(text);
    expect(result).toEqual(['Soru 1', 'Soru 2', 'Soru 3']);
  });

  it('serializeQuestionsToTextarea converts array to text', () => {
    const arr = ['A', 'B'];
    expect(serializeQuestionsToTextarea(arr)).toBe('A\nB');
    expect(serializeQuestionsToTextarea(null)).toBe('');
  });

  it('normalizeCampaignDayStatus fallback to draft', () => {
    expect(normalizeCampaignDayStatus('published')).toBe('published');
    expect(normalizeCampaignDayStatus('inactive')).toBe('inactive');
    expect(normalizeCampaignDayStatus('unknown')).toBe('draft');
    expect(normalizeCampaignDayStatus(null)).toBe('draft');
  });

  it('getCampaignDayContentCompleteness calculates %', () => {
    expect(getCampaignDayContentCompleteness(null)).toBe(0);
    
    const partial = {
      title: 'Title',
      learning_content: 'Content'
    };
    expect(getCampaignDayContentCompleteness(partial)).toBe(Math.round((2/15)*100));

    const full = {
      title: 'A',
      short_summary: 'B',
      learning_content: 'C',
      mentor_message: 'D',
      task_brief: 'E',
      main_objective: 'F',
      module_title: 'G',
      field_example: 'H',
      practice_assignment: 'I',
      daily_questions: ['Q1'],
      learning_goals: ['G1'],
      mini_quiz: ['Qz1'],
      glossary_terms: ['Glos1'],
      task_items: ['T1'],
      homework: { k: 'v' }
    };
    expect(getCampaignDayContentCompleteness(full)).toBe(100);
  });
});
