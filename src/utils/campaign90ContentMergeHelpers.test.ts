import { describe, it, expect } from 'vitest';
import { 
  isPublishedCampaignContent, 
  normalizeDailyQuestions, 
  normalizeJsonArrayField, 
  mergeCampaignDayContentWithFallback 
} from './campaign90ContentMergeHelpers';
import { CampaignDayTemplate } from '../data/campaign90Template';
import { AdminCampaignDayContent } from '../services/adminCampaign90Service';

describe('campaign90ContentMergeHelpers', () => {
  it('isPublishedCampaignContent', () => {
    expect(isPublishedCampaignContent(null)).toBe(false);
    expect(isPublishedCampaignContent({ status: 'draft' })).toBe(false);
    expect(isPublishedCampaignContent({ status: 'inactive' })).toBe(false);
    expect(isPublishedCampaignContent({ status: 'published' })).toBe(true);
  });

  it('normalizeDailyQuestions', () => {
    expect(normalizeDailyQuestions(null)).toEqual([]);
    expect(normalizeDailyQuestions(['Q1', 'Q2'])).toEqual(['Q1', 'Q2']);
    expect(normalizeDailyQuestions('Q1\nQ2')).toEqual(['Q1', 'Q2']);
  });

  it('normalizeJsonArrayField', () => {
    expect(normalizeJsonArrayField(null)).toEqual([]);
    expect(normalizeJsonArrayField([{ term: 'A' }])).toEqual([{ term: 'A' }]);
    expect(normalizeJsonArrayField('[{"term":"A"}]')).toEqual([{ term: 'A' }]);
    expect(normalizeJsonArrayField('invalid')).toEqual([]);
  });

  it('mergeCampaignDayContentWithFallback - fallback only', () => {
    const fallbackTemplate: CampaignDayTemplate = {
      day_number: 1,
      week_number: 1,
      day_title: 'Fallback Day',
      phase_title: 'Fallback Phase',
      day_lesson_title: '',
      day_lesson_body: '',
      video_lesson_title: '',
      video_lesson_placeholder: '',
      main_objective: '',
      tasks: []
    };
    const fallbackCurriculum = {
      topic: 'Fallback Topic',
      objective: 'Fallback Objective'
    };
    const fallbackGlossary = [{ term: 'Term1' }];

    const merged = mergeCampaignDayContentWithFallback(null, fallbackTemplate, fallbackCurriculum, fallbackGlossary, 1);
    
    expect(merged.isCmsActive).toBe(false);
    expect(merged.title).toBe('Fallback Day');
    expect(merged.phaseTitle).toBe('Fallback Phase');
    expect(merged.shortSummary).toBe('Fallback Topic');
    expect(merged.glossaryTerms).toEqual([{ term: 'Term1' }]);
  });

  it('mergeCampaignDayContentWithFallback - cms active', () => {
    const fallbackTemplate: CampaignDayTemplate = {
      day_number: 1,
      week_number: 1,
      day_title: 'Fallback Day',
      phase_title: 'Fallback Phase',
      day_lesson_title: '',
      day_lesson_body: '',
      video_lesson_title: '',
      video_lesson_placeholder: '',
      main_objective: '',
      tasks: []
    };
    const fallbackCurriculum = {};
    const fallbackGlossary: any[] = [];

    const cmsContent: AdminCampaignDayContent = {
      day_number: 1,
      title: 'CMS Title',
      status: 'published',
      short_summary: 'CMS Summary',
      daily_questions: ['CMS Q1'],
      video_title: null,
      video_url: null,
      video_duration_minutes: null,
      learning_content: null,
      mentor_message: null,
      vocabulary_title: null,
      vocabulary_content: null,
      task_brief: null
    };

    const merged = mergeCampaignDayContentWithFallback(cmsContent, fallbackTemplate, fallbackCurriculum, fallbackGlossary, 1);
    
    expect(merged.isCmsActive).toBe(true);
    expect(merged.title).toBe('CMS Title');
    expect(merged.shortSummary).toBe('CMS Summary');
    expect(merged.dailyQuestions).toEqual(['CMS Q1']);
  });
});
