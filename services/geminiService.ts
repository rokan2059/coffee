
import { GoogleGenAI } from "@google/genai";

export const generateDescription = async (itemName: string, category: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a short, enticing, and sophisticated menu description (max 20 words) for a "${itemName}" in the "${category}" category of a premium coffee shop. Make it sound delicious.`,
      config: {
        temperature: 0.7,
        topP: 0.8,
        maxOutputTokens: 50,
      }
    });

    return response.text?.trim() || "A delicious addition to our premium menu selection.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Crafted with the finest ingredients and passion for quality.";
  }
};
