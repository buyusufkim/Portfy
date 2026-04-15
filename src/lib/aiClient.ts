import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateContent = async (model: string, contents: any, config?: any) => {
  if (!ai) {
    throw new Error("AI service configuration missing (API Key not found)");
  }

  const formattedContents = typeof contents === 'string' 
    ? [{ role: 'user', parts: [{ text: contents }] }]
    : contents;

  try {
    const response = await ai.models.generateContent({
      model: model || "gemini-flash-latest",
      contents: formattedContents,
      config
    });

    return { text: response.text };
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    throw error;
  }
};
