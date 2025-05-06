import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { aiService } from "./gemini-prompt";
import pdfparse from "pdf-parse";
// Import pdf-parse dynamically to avoid the initialization error

export const pdfProcessor = createTRPCRouter({
  add: protectedProcedure
    .input(
      z.object({
        pdfBase64: z.string(),
        filename: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session?.user.id;

      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to upload and process PDFs.",
        });
      }

      const userPdfCount = await ctx.db.pdf.count({
        where: {
          userId: userId, // Filter by the current user
        },
      });

      if (userPdfCount > 5) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Max 5 PDF's",
        });
      }

      const pdfBinary = Buffer.from(input.pdfBase64, "base64");
      const pdfData = await pdfparse(pdfBinary);

      if (!pdfData?.text || pdfData.text.trim().length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST", // It's bad input if you don't accept empty PDFs
          message: `The PDF file '${input.filename}' does not contain any extractable text.`,
        });
      }

      const paragraphs = await aiService.generateContent(pdfData.text);

      if (!paragraphs || paragraphs.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No suitable paragraphs found by AI.",
        });
      }

      const newPdf = await ctx.db.pdf.create({
        data: {
          userId: userId,
          paragraphs: {
            createMany: {
              data: paragraphs.map((paragraphText) => ({
                text: paragraphText,
              })),
            },
          },
          title: input.filename,
        },
      });
      return newPdf;
    }),

  get: protectedProcedure.input(z.void()).query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    return await ctx.db.pdf.findMany({
      where: {
        userId: userId,
      },
      include: {
        paragraphs: {
          select: {
            text: true,
          },
          orderBy: {
            id: "asc",
          },
        },
      },
    });
  }),
});
