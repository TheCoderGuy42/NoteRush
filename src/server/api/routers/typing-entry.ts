import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";

export const typingEntry = createTRPCRouter({
  add: protectedProcedure
    .input(
      z.object({
        wpm: z.number(),
        time: z.number(),
        mistakes: z.number(),
        accuracy: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const newEntry = await ctx.db.typingEntry.create({
        data: {
          accuracy: input.accuracy,
          time: input.time,
          wpm: input.wpm,
          mistakes: input.mistakes,
          userId: userId,
        },
      });

      return newEntry;
    }),

  getAll: protectedProcedure.input(z.void()).query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return await ctx.db.typingEntry.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        id: "desc",
      },
    });
  }),
});
