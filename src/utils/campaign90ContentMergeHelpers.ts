import { AdminCampaignDayContent } from '../services/adminCampaign90Service';
import { CampaignDayTemplate } from '../data/campaign90Template';

export const isPublishedCampaignContent = (content: any): boolean => {
  return !!content && content.status === 'published';
};

export const normalizeDailyQuestions = (questions: any): string[] => {
  if (!questions) return [];
  if (Array.isArray(questions)) return questions;
  if (typeof questions === 'string') return questions.split('\n').filter(Boolean);
  return [];
};

export const normalizeJsonArrayField = (field: any): any[] => {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  try {
    return JSON.parse(field);
  } catch (e) {
    return [];
  }
};

export const mergeCampaignDayContentWithFallback = (
  cmsContent: AdminCampaignDayContent | null | undefined,
  fallbackTemplate: CampaignDayTemplate | undefined,
  fallbackCurriculum: any,
  fallbackGlossary: any[],
  dayNumber: number
) => {
  const hasPublishedCMS = isPublishedCampaignContent(cmsContent);

  // Default values from fallback
  let title = fallbackTemplate?.day_title || `Gün ${dayNumber}`;
  let phaseTitle = fallbackTemplate?.phase_title;
  let shortSummary = fallbackCurriculum?.topic || '';
  
  let mainObjective = fallbackCurriculum?.objective || '';
  let learningContent = fallbackCurriculum?.dailyMantra || fallbackCurriculum?.education || '';
  let fieldExample = fallbackCurriculum?.fieldExample || fallbackCurriculum?.scriptExample || '';
  let scriptExample = fallbackCurriculum?.scriptExample || '';
  let mentorMessage = fallbackCurriculum?.mentorMessage || '';
  
  let moduleTitle = fallbackCurriculum?.moduleTitle || '';
  let learningGoals = fallbackCurriculum?.learningGoals || [];
  let commonMistake = fallbackCurriculum?.commonMistake || '';
  let proTip = fallbackCurriculum?.proTip || '';
  let practiceAssignment = fallbackCurriculum?.practiceAssignment || '';

  let vocabularyTitle = fallbackCurriculum?.vocabularyTitle || '';
  let vocabularyContent = fallbackCurriculum?.vocabularyContent || '';
  let dailyQuestions: string[] = [];
  let miniQuiz: any[] = [];
  let glossaryTerms: any[] = fallbackGlossary || [];
  
  let videoTitle = '';
  let videoUrl = '';
  let videoPlaceholder = '';

  if (hasPublishedCMS && cmsContent) {
    // Override with CMS content
    title = cmsContent.title || title;
    phaseTitle = cmsContent.phase_title || phaseTitle;
    shortSummary = cmsContent.short_summary || shortSummary;
    mainObjective = cmsContent.main_objective || mainObjective;
    learningContent = cmsContent.learning_content || learningContent;
    fieldExample = cmsContent.field_example || fieldExample;
    scriptExample = cmsContent.script_example || scriptExample;
    mentorMessage = cmsContent.mentor_message || mentorMessage;

    moduleTitle = cmsContent.module_title || moduleTitle;
    if (cmsContent.learning_goals) {
      if (Array.isArray(cmsContent.learning_goals)) {
         learningGoals = cmsContent.learning_goals;
      } else if (typeof cmsContent.learning_goals === 'string') {
         learningGoals = (cmsContent.learning_goals as string).split('\n').filter(Boolean);
      }
    }
    commonMistake = cmsContent.common_mistake || commonMistake;
    proTip = cmsContent.pro_tip || proTip;
    practiceAssignment = cmsContent.practice_assignment || practiceAssignment;

    vocabularyTitle = cmsContent.vocabulary_title || vocabularyTitle;
    vocabularyContent = cmsContent.vocabulary_content || vocabularyContent;

    dailyQuestions = normalizeDailyQuestions(cmsContent.daily_questions);
    
    if (cmsContent.mini_quiz) miniQuiz = normalizeJsonArrayField(cmsContent.mini_quiz);
    if (cmsContent.glossary_terms) glossaryTerms = normalizeJsonArrayField(cmsContent.glossary_terms);

    videoTitle = cmsContent.video_title || videoTitle;
    videoUrl = cmsContent.video_url || videoUrl;
    videoPlaceholder = cmsContent.video_placeholder || videoPlaceholder;
  }

  return {
    isCmsActive: hasPublishedCMS,
    title,
    phaseTitle,
    shortSummary,
    mainObjective,
    learningContent,
    fieldExample,
    scriptExample,
    mentorMessage,
    moduleTitle,
    learningGoals,
    commonMistake,
    proTip,
    practiceAssignment,
    vocabularyTitle,
    vocabularyContent,
    dailyQuestions,
    miniQuiz,
    glossaryTerms,
    videoTitle,
    videoUrl,
    videoPlaceholder
  };
};
