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
    const text =
      await "The Portland spy ring was an espionage group active in the United Kingdom between 1953 and 1961. It comprised five people who obtained classified research documents from the Admiralty Underwater Weapons Establishment (AUWE) on the Isle of Portland, Dorset, and passed them to the Soviet Union. Two of the group, Harry Houghton and Ethel Gee worked at the AUWE and had access to classified information. They passed this to their handler, Konon Molody (pictured), a KGB agent acting under a Canadian passport in the name Gordon Lonsdale. Lonsdale would pass the documents to Lona and Morris Cohen, American communists living under the names Helen and Peter Kroger; they passed the information to Moscow. The ring was exposed in 1960 after a tip-off from the Polish spy Michael Goleniewski. The information he supplied was enough to identify Houghton. MI5 surveillance uncovered the rest of the group, who were arrested in January 1961 and tried that March. Sentences for the group ranged from 15 to 25 years.";

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
