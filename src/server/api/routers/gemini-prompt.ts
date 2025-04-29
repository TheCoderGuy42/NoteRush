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
      await "The Portland spy ring was an espionage group active in the UK between 1953 and 1961. It comprised five people who obtained classified research documents from the Admiralty Underwater Weapons Establishment (AUWE) on the Isle of Portland, Dorset, and passed them to the Soviet Union.Two of the group's members, Harry Houghton and Ethel Gee, were British. They worked at the AUWE and had access to the areas where the research was stored. After they obtained the information it was passed to their handler, Konon Molody—who was acting under the name Gordon Lonsdale. He was a KGB agent acting in the UK under a Canadian passport. Lonsdale would pass the documents in microdot format to Lona and Morris Cohen, two American communists who had moved to the UK using New Zealand passports in the names Helen and Peter Kroger. The Krogers would get the information to Moscow, often by using the cover of an antiquarian book dealer. The ring was exposed in 1960 following a tip-off from the Polish spy Michael Goleniewski about a mole in the Admiralty. The information he supplied was enough to identify Houghton. Surveillance by MI5—the UK's domestic counter-intelligence service—established the connection between Houghton and Gee, and then between them and Lonsdale and finally the Krogers. All five were arrested in January 1961 and put on trial that March. Sentences for the group ranged from fifteen years (for Houghton and Gee) to twenty years (for the Krogers) to twenty-five years (for Lonsdale).Lonsdale was released in 1964 in a spy swap for the British businessman Greville Wynne. The Krogers were exchanged in October 1969 as part of a swap with Gerald Brooke, a British national held on largely falsified claims. The last to be freed were Houghton and Gee, who were given early release in May 1970.";

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
