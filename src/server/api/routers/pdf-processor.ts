import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { aiService } from "./gemini-prompt";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "../../../env";

async function getFileAsBuffer(key: string) {
  // Debug logging to diagnose AWS credential issues
  console.log("PDF Processor - AWS ENV DEBUG:");
  console.log("AWS_S3_REGION:", env.AWS_S3_REGION);
  console.log(
    "AWS_S3_ACCESS_KEY_ID:",
    env.AWS_S3_ACCESS_KEY_ID
      ? env.AWS_S3_ACCESS_KEY_ID.substring(0, 5) + "..."
      : "MISSING",
  );
  console.log(
    "AWS_S3_SECRET_ACCESS_KEY:",
    env.AWS_S3_SECRET_ACCESS_KEY ? "***set***" : "***missing***",
  );
  console.log("AWS_S3_BUCKET_NAME:", env.AWS_S3_BUCKET_NAME);

  const s3Client = new S3Client({
    region: env.AWS_S3_REGION,
    credentials: {
      accessKeyId: env.AWS_S3_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_S3_SECRET_ACCESS_KEY,
    },
  });
  const getObjectParams = {
    Bucket: env.AWS_S3_BUCKET_NAME,
    Key: key,
  };

  const command = new GetObjectCommand(getObjectParams);

  const s3Object = await s3Client.send(command);

  if (s3Object.Body) {
    const byteArray = await s3Object.Body.transformToByteArray(); // Get raw bytes
    return Buffer.from(byteArray).toString("base64");
  }

  return undefined;
}

export const pdfProcessor = createTRPCRouter({
  add: protectedProcedure
    .input(
      z.object({
        s3Key: z.string(),
        filename: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session?.user.id;

      const base64Encoding = await getFileAsBuffer(input.s3Key);

      if (!base64Encoding) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to pull file from S3.",
        });
      }

      let paragraphs;
      try {
        paragraphs = await aiService.generateContent(base64Encoding);
      } catch (error) {
        console.error("AI processing error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process the PDF with AI. Please try again later.",
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
