export const normalizeQuestionKey = (question: string | null | undefined, index: number): string => {
  if (!question) return `question_${index}`;
  const substr = question.trim().substring(0, 50).replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  return `question_${index}_${substr}`;
};

export const buildInitialAnswers = (questions: string[], existingAnswers: Record<string, string> | null) => {
  const obj: Record<string, string> = {};
  questions.forEach((q, idx) => {
    const key = normalizeQuestionKey(q, idx);
    obj[key] = existingAnswers?.[key] || '';
  });
  return obj;
};

export const sanitizeCampaignAnswerText = (text: string | null | undefined): string => {
  if (!text) return '';
  return text.substring(0, 1000).trim();
};

export const validateCampaignAnswersPayload = (payload: any): Record<string, string> => {
  if (!payload || typeof payload !== 'object') return {};
  const valid: Record<string, string> = {};
  let totalLength = 0;
  for (const [key, val] of Object.entries(payload)) {
    if (typeof key !== 'string' || typeof val !== 'string') continue;
    const sanitizedVal = sanitizeCampaignAnswerText(val);
    if (totalLength + sanitizedVal.length > 5000) {
      // stop adding if total exceeds limit
      break;
    }
    valid[key.substring(0, 100)] = sanitizedVal; // limit key length too
    totalLength += sanitizedVal.length;
  }
  return valid;
};

export interface DisplayAnswer {
  questionKey: string;
  answer: string;
}

export const answersRecordToDisplayList = (answers: Record<string, string> | null | undefined): DisplayAnswer[] => {
  if (!answers || typeof answers !== 'object') return [];
  return Object.entries(answers).map(([key, val]) => ({
    questionKey: key,
    answer: typeof val === 'string' ? val : ''
  })).filter(a => a.answer.trim().length > 0);
};
