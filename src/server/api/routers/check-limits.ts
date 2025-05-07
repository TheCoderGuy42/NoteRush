import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const limits = createTRPCRouter({
  isAbovePdfLimit: protectedProcedure.input(z.void()).query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const userSubscriptions = await ctx.db.subscription.findMany({
      where: {
        referenceId: userId,
        plan: "pro",
        status: "active",
      },
    });

    const pdfLimit = userSubscriptions.length > 0 ? 50 : 5;

    const pdfCount = await ctx.db.pdf.count({
      where: {
        userId: userId,
      },
    });

    return pdfCount >= pdfLimit;
  }),

  hasActiveSubscription: protectedProcedure
    .input(z.void())
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;

      const userSubscription = await ctx.db.subscription.findFirst({
        where: {
          referenceId: userId,
          plan: "pro",
          status: "active",
        },
      });

      return !!userSubscription;
    }),
});
