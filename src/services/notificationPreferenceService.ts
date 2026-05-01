import { supabase } from '../lib/supabase';
import { NotificationPreference } from '../types';

const defaultPreferences: Pick<NotificationPreference, 'type' | 'in_app' | 'email' | 'push' | 'whatsapp' | 'frequency'>[] = [
  { type: "new_lead", in_app: true, email: false, push: false, whatsapp: false, frequency: "instant" },
  { type: "price_revision", in_app: true, email: false, push: false, whatsapp: false, frequency: "instant" },
  { type: "ai_recommendation", in_app: true, email: false, push: false, whatsapp: false, frequency: "daily" },
  { type: "market_report", in_app: true, email: false, push: false, whatsapp: false, frequency: "weekly" },
  { type: "system_announcement", in_app: true, email: false, push: false, whatsapp: false, frequency: "instant" }
];

export async function getNotificationPreferences(userId: string): Promise<NotificationPreference[]> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching notification preferences:', error);
    throw error;
  }

  return data as NotificationPreference[];
}

export async function ensureDefaultNotificationPreferences(userId: string): Promise<NotificationPreference[]> {
  const existingPrefs = await getNotificationPreferences(userId);
  const existingTypes = new Set(existingPrefs.map(p => p.type));

  const toInsert = defaultPreferences
    .filter(dp => !existingTypes.has(dp.type))
    .map(dp => ({
      ...dp,
      user_id: userId
    }));

  if (toInsert.length > 0) {
    const { error } = await supabase
      .from('notification_preferences')
      .insert(toInsert);

    if (error) {
       console.error('Error ensuring default notification preferences:', error);
       // we might be running into a unique constraint if another request inserted it
       // ignore throwing here and just fetch them again
    }
  }

  // Fetch fresh ones to ensure we return the correct list
  const { data: finalPrefs, error: fetchError } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId);

  if (fetchError) {
     console.error('Error fetching final notification preferences:', fetchError);
     throw fetchError;
  }
  
  // Sort them based on defaultPreferences order
  const orderMap = defaultPreferences.reduce((acc, pref, index) => {
     acc[pref.type] = index;
     return acc;
  }, {} as Record<string, number>);

  return (finalPrefs as NotificationPreference[]).sort((a, b) => {
     return (orderMap[a.type] || 0) - (orderMap[b.type] || 0);
  });
}

export async function updateNotificationPreference(
  userId: string, 
  type: NotificationPreference["type"], 
  data: Partial<Pick<NotificationPreference, "in_app" | "email" | "push" | "whatsapp" | "frequency">>
): Promise<NotificationPreference> {
  const { data: updated, error } = await supabase
    .from('notification_preferences')
    .update(data)
    .eq('user_id', userId)
    .eq('type', type)
    .select()
    .single();

  if (error) {
    console.error('Error updating notification preference:', error);
    throw error;
  }

  return updated as NotificationPreference;
}
