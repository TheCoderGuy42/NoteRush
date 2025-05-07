import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { aiService } from "./gemini-prompt";

const MAX_PDF_SIZE_BYTES = 4 * 1024 * 1024; // 10 MB

export const pdfProcessor = createTRPCRouter({
  add: protectedProcedure
    .input(
      z.object({
        pdfBase64: z.string(),
        filename: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.session?.user.id;

        if (!userId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in to upload and process PDFs.",
          });
        }

        // check if user has a Pro subscription
        const userSubscription = await ctx.db.subscription.findFirst({
          where: {
            referenceId: userId,
            plan: "pro",
            status: "active",
          },
        });

        const pdfLimit = userSubscription ? 50 : 5;

        const userPdfCount = await ctx.db.pdf.count({
          where: {
            userId: userId,
          },
        });

        if (userPdfCount >= pdfLimit) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: userSubscription
              ? `Pro users can upload up to ${pdfLimit} PDFs`
              : `Free users can upload up to ${pdfLimit} PDFs. Upgrade to Pro for up to 50 PDFs!`,
          });
        }

        let pdfBinary: Buffer;
        try {
          pdfBinary = Buffer.from(input.pdfBase64, "base64");
        } catch (error) {
          console.error("PDF parsing error:", error);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Failed to parse the PDF file. Please try a different file.",
          });
        }

        if (pdfBinary.length > MAX_PDF_SIZE_BYTES) {
          throw new TRPCError({
            code: "PAYLOAD_TOO_LARGE",
            message: `The PDF file '${input.filename}' is too large. Maximum size is ${MAX_PDF_SIZE_BYTES / (1024 * 1024)}MB.`,
          });
        }

        let paragraphs;
        try {
          paragraphs = await aiService.generateContent(input.pdfBase64);
        } catch (error) {
          console.error("AI processing error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Failed to process the PDF with AI. Please try again later.",
          });
        }

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
      } catch (error) {
        console.error("PDF processing error:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred while processing your PDF.",
        });
      }
    }),

  get: protectedProcedure.input(z.void()).query(async ({ ctx }) => {
    try {
      const userId = ctx.session.user.id;

      return await ctx.db.pdf.findMany({
        where: {
          userId: userId,
        },
        include: {
          paragraphs: {
            select: {
              text: true,
              id: true,
            },
            orderBy: {
              id: "asc",
            },
          },
        },
      });
    } catch (error) {
      console.error("Error fetching PDFs:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve your PDFs.",
      });
    }
  }),
});
