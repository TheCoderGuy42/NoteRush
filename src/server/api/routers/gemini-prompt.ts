import { GoogleGenAI } from "@google/genai";

import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

const ai = new GoogleGenAI({
  apiKey: "AIzaSyD-ays22lTA5268eKtCFg_1cgs_dwsTnRk",
});

const aiService = {
  generateContent: async (model: string, prompt: string) => {
    // const response = await ai.models.generateContent({
    //   model: model,
    //   contents: prompt,
    // });

    // const text = response.text;
    const text = await "during house order ";

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
        prompt: z.string().max(5000), //  length limits
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
