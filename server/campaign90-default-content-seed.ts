import { SupabaseClient } from '@supabase/supabase-js';
import { CAMPAIGN_90_DAYS } from '../src/data/campaign90Template.js';
import { getCurriculumForDay } from '../src/data/campaignEducationCurriculum.js';
import { getGlossaryForDay, getHomeworkForDay } from '../src/data/campaignDayExpansions.js';

export async function processDbCampaign90SeedDefaults(supabaseAdmin: SupabaseClient | null, mode: 'missing_only' | 'fill_empty') {
  if (!supabaseAdmin) throw new Error("No supabaseAdmin");

  const { data: existingContents, error: fetchError } = await supabaseAdmin
    .from('campaign90_day_contents')
    .select('*');

  if (fetchError) throw fetchError;

  if (CAMPAIGN_90_DAYS.length !== 90) {
    return { error: `Beklenen gün sayısı 90 iken kaynaklarda ${CAMPAIGN_90_DAYS.length} gün bulundu. Veri bütünlüğünü kontrol ediniz.` };
  }

  let insertedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const template of CAMPAIGN_90_DAYS) {
    const dayNumber = template.day_number;
    const curriculum = getCurriculumForDay(dayNumber);
    const glossary = getGlossaryForDay(dayNumber);
    const homework = getHomeworkForDay(dayNumber);

    const quizQuestions = curriculum.mini_quiz && Array.isArray(curriculum.mini_quiz) 
      ? curriculum.mini_quiz.map(q => q.question) 
      : [];
    
    // Fallbacks
    const title = curriculum.lesson_title || template.day_title;
    const learningContent = curriculum.lesson_body || template.day_lesson_body;
    const mentorMessage = template.day_lesson_body;
    const taskBrief = template.main_objective;

    // Glossary formatting for simple string summary
    const vocabularyContent = glossary.slice(0, 5).map(g => `- ${g.term}: ${g.meaning}`).join('\n');

    const seedPayload = {
      day_number: dayNumber,
      title: title,
      short_summary: template.main_objective,
      learning_content: learningContent,
      mentor_message: mentorMessage,
      vocabulary_title: "Günün Terimleri",
      vocabulary_content: vocabularyContent,
      task_brief: taskBrief,
      daily_questions: quizQuestions,
      video_title: template.video_lesson_title,
      video_url: null,
      video_duration_minutes: null,
      status: 'published',
      week_number: template.week_number,
      phase_title: template.phase_title,
      main_objective: template.main_objective,
      module_title: curriculum.module_title,
      learning_goals: curriculum.learning_goals,
      field_example: curriculum.field_example,
      common_mistake: curriculum.common_mistake,
      pro_tip: curriculum.pro_tip,
      script_example: curriculum.script_example,
      mini_quiz: curriculum.mini_quiz,
      practice_assignment: curriculum.practice_assignment,
      glossary_terms: glossary,
      homework: homework,
      task_items: template.tasks,
      video_placeholder: template.video_lesson_placeholder,
      seed_source: 'hardcoded_campaign_v1',
      seeded_at: new Date().toISOString()
    };

    const existing = existingContents?.find(e => e.day_number === dayNumber);

    if (!existing) {
      if (mode === 'missing_only' || mode === 'fill_empty') {
        const { error } = await supabaseAdmin.from('campaign90_day_contents').insert(seedPayload);
        if (error) console.error("Seed insert error day", dayNumber, error);
        else insertedCount++;
      } else {
        skippedCount++;
      }
    } else {
      if (mode === 'fill_empty') {
        // Find empty keys
        const updatePayload: any = {};
        for (const [key, val] of Object.entries(seedPayload)) {
          if (existing[key] === null || existing[key] === undefined || existing[key] === '') {
             // For arrays like JSONB
             if (Array.isArray(val) && existing[key] && Array.isArray(existing[key]) && existing[key].length > 0) {
               // Leave as is
             } else {
               updatePayload[key] = val;
             }
          }
        }
        
        // Let's also check empty json arrays explicitly
        if (Array.isArray(existing.daily_questions) && existing.daily_questions.length === 0) updatePayload.daily_questions = seedPayload.daily_questions;
        if (Array.isArray(existing.learning_goals) && existing.learning_goals.length === 0) updatePayload.learning_goals = seedPayload.learning_goals;
        if (Array.isArray(existing.mini_quiz) && existing.mini_quiz.length === 0) updatePayload.mini_quiz = seedPayload.mini_quiz;
        if (Array.isArray(existing.glossary_terms) && existing.glossary_terms.length === 0) updatePayload.glossary_terms = seedPayload.glossary_terms;
        if (Array.isArray(existing.task_items) && existing.task_items.length === 0) updatePayload.task_items = seedPayload.task_items;
        if ((!existing.homework || Object.keys(existing.homework).length === 0) && seedPayload.homework) updatePayload.homework = seedPayload.homework;

        if (Object.keys(updatePayload).length > 0) {
           updatePayload.seed_source = 'hardcoded_campaign_v1_fill';
           updatePayload.seeded_at = new Date().toISOString();
           const { error } = await supabaseAdmin.from('campaign90_day_contents')
             .update(updatePayload)
             .eq('day_number', dayNumber);
           
           if (error) console.error("Seed update error day", dayNumber, error);
           else updatedCount++;
        } else {
           skippedCount++;
        }
      } else {
        skippedCount++;
      }
    }
  }

  return { insertedCount, updatedCount, skippedCount, totalDays: CAMPAIGN_90_DAYS.length, missingDays: CAMPAIGN_90_DAYS.length - existingContents.length };
}
