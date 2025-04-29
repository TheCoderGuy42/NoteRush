import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";

export const typingEntry = createTRPCRouter({
  add: publicProcedure
    .input(
      z.object({
        wpm: z.number(),
        time: z.number(),
        mistakes: z.number(),
        accuracy: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.typingEntry.create({
        data: {
          accuracy: input.accuracy,
          time: input.time,
          wpm: input.wpm,
          mistakes: input.mistakes,
        },
      });
    }),

  getAll: publicProcedure.input(z.void()).query(async ({ ctx }) => {
    return await ctx.db.typingEntry.findMany();
  }),
  getSecretMessage: protectedProcedure.query(({ ctx, input }) => {
    return "you can now see this secret message, " + ctx.session.user.name;
  }),
});
