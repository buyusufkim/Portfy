import { supabase } from './supabase';

export const generateContent = async (model: string, contents: string, config?: any) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({ model, contents, config }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return { text: data.text };
};
