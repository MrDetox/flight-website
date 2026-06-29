import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateMicroItinerary(city: string, duration: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a one-line enticing teaser for a ${duration} layover in ${city}. Focus on 2-3 iconic or hidden gem activities. Keep it under 100 characters. Start with a sparkle emoji.`,
    });
    return response.text || "✨ Explore the city's hidden gems and iconic landmarks.";
  } catch (error) {
    console.error("Error generating teaser:", error);
    return "✨ Discover the best of " + city + " during your stay.";
  }
}

export async function generateActivities(city: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `List 5 diverse activities for a traveler in ${city}. Return as a JSON array of objects with id, title, description, and category (e.g., Culture, Food, Adventure).`,
      config: {
        responseMimeType: "application/json",
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error generating activities:", error);
    return [];
  }
}
