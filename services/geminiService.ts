import { GoogleGenerativeAI } from "@google/genai";

// Replace 'YOUR_API_KEY' with your actual key from Google AI Studio
// For security on GitHub, it's better to use: import.meta.env.VITE_GEMINI_API_KEY
const genAI = new GoogleGenerativeAI("YOUR_API_KEY");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const geminiService = {
  generate: async (prompt: string) => {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Sorry, I couldn't process that request.";
    }
  }
};
