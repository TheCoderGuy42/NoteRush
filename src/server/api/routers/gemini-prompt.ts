import { GoogleGenAI } from "@google/genai";

import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

const ai = new GoogleGenAI({
  apiKey: "AIzaSyD-ays22lTA5268eKtCFg_1cgs_dwsTnRk",
});

const aiService = {
  generateContent: async (model: string, prompt: string) => {
    // Check if the prompt is PDF content
    if (prompt.length > 200) {
      // This is likely PDF content, so just use it directly without additional processing
      console.log("Using PDF content directly for typing test");
      return prompt;
    }

    // For normal operation (not PDF content), use static text or uncomment the Gemini API call
    // const geminiModel = ai.getGenerativeModel({ model: model });
    // const result = await geminiModel.generateContent(prompt);
    // const text = result.response.text();

    // Using static text as a placeholder
    const text = await "The Portland spy ring";

    console.log("AI Response Text:", text);
    return text;
  },
};

export const geminiPrompt = createTRPCRouter({
  // Procedure to interact with the AI
  generate: publicProcedure
    .input(
      z.object({
        model: z.string(),
        prompt: z.string().max(20000), // Increased max length to handle PDF content
      }),
    )
    .query(async ({ input }) => {
      const generatedText = await aiService.generateContent(
        input.model,
        input.prompt,
      );
      return {
        generatedText: generatedText,
      };
    }),
});
