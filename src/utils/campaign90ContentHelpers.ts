export const parseLinesFromTextarea = (text: string | null | undefined): string[] => {
  if (!text) return [];
  return text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
};

export const serializeLinesToTextarea = (lines: string[] | null | undefined): string => {
  if (!lines || !Array.isArray(lines)) return '';
  return lines.join('\n');
};

export const parseQuestionsFromTextarea = parseLinesFromTextarea;
export const serializeQuestionsToTextarea = serializeLinesToTextarea;

export const safeParseJsonField = (jsonString: string, fallback: any = []) => {
  try {
    if (!jsonString || !jsonString.trim()) return fallback;
    return JSON.parse(jsonString);
  } catch (e) {
    throw new Error('Geçersiz JSON formatı');
  }
};

export const safeStringifyJsonField = (data: any): string => {
  if (!data) return '';
  try {
    return JSON.stringify(data, null, 2);
  } catch (e) {
    return '';
  }
};

export const normalizeCampaignDayStatus = (status: string | null | undefined): 'draft' | 'published' | 'inactive' => {
  if (status === 'published' || status === 'inactive') {
    return status;
  }
  return 'draft';
};

export const getCampaignDayContentCompleteness = (content: any): number => {
  if (!content) return 0;
  
  const fields = [
    'title',
    'short_summary',
    'learning_content',
    'mentor_message',
    'task_brief',
    'main_objective',
    'module_title',
    'field_example',
    'practice_assignment'
  ];

  let filled = 0;
  fields.forEach(f => {
    if (content[f] && typeof content[f] === 'string' && content[f].trim().length > 0) {
      filled++;
    }
  });

  const arrayFields = ['daily_questions', 'learning_goals', 'mini_quiz', 'glossary_terms', 'task_items'];
  arrayFields.forEach(f => {
    if (content[f] && Array.isArray(content[f]) && content[f].length > 0) {
      filled++;
    }
  });

  if (content.homework && Object.keys(content.homework).length > 0) {
    filled++;
  }

  const totalFields = fields.length + arrayFields.length + 1; // +1 for homework
  return Math.round((filled / totalFields) * 100);
};

export const hasCampaignDayRichContent = (content: any): boolean => {
  if (!content) return false;
  return (
    (content.mini_quiz && content.mini_quiz.length > 0) ||
    (content.glossary_terms && content.glossary_terms.length > 0) ||
    (content.task_items && content.task_items.length > 0) ||
    (content.video_placeholder && content.video_placeholder.trim().length > 0)
  );
}
