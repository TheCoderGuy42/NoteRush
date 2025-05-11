import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { TRPCError } from "@trpc/server";
import { env } from "../../../env";

// Helper function to add delay
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry function with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;

    console.log(`Retrying operation after ${delay}ms, ${retries} retries left`);
    await sleep(delay);
    return withRetry(fn, retries - 1, delay * 1.5);
  }
}

export const s3Upload = createTRPCRouter({
  getPresignedUrl: protectedProcedure
    .input(
      z.object({
        filename: z.string(),
        contentType: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session?.user.id;

      // Debug logging to diagnose AWS credential issues
      console.log("AWS ENV DEBUG:");
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

      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You have to be logged in to upload and process PDFs.",
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

      const key = `uploads/${uuidv4()}-${input.filename.replace(/\s+/g, "-")}`;

      // Use the retry function for S3 operations
      const signedUrl = await withRetry(async () => {
        const s3Client = new S3Client({
          region: env.AWS_S3_REGION,
          credentials: {
            accessKeyId: env.AWS_S3_ACCESS_KEY_ID,
            secretAccessKey: env.AWS_S3_SECRET_ACCESS_KEY,
          },
        });

        const command = new PutObjectCommand({
          Bucket: env.AWS_S3_BUCKET_NAME,
          Key: key,
          ContentType: input.contentType,
        });

        return await getSignedUrl(s3Client, command, {
          expiresIn: 60 * 5,
        });
      });

      return {
        signedUrl,
        key,
        method: "PUT",
        headers: { "Content-Type": input.contentType },
        fields: {},
      };
    }),
});
