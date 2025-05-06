import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { aiService } from "./gemini-prompt";
import * as fs from "fs";
import * as path from "path";

import pdf_parse from "pdf-parse";

// Import pdf-parse dynamically to avoid the initialization error
// This is necessary because pdf-parse tries to access test files on import
// which don't exist in serverless environments
// const getPdfParse = async () => {
//   return (await import("pdf-parse")).default;
// };

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

        let pdfData;
        try {
          const pdfBinary = Buffer.from(input.pdfBase64, "base64");
          // Get the pdf-parse module dynamically
          pdfData = await pdf_parse(pdfBinary);
        } catch (error) {
          console.error("PDF parsing error:", error);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Failed to parse the PDF file. Please try a different file.",
          });
        }

        if (!pdfData?.text || pdfData.text.trim().length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST", // It's bad input if you don't accept empty PDFs
            message: `The PDF file '${input.filename}' does not contain any extractable text.`,
          });
        }

        let paragraphs;
        try {
          paragraphs = await aiService.generateContent(pdfData.text);
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
