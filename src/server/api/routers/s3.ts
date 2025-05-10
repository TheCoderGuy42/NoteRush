import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { TRPCError } from "@trpc/server";

export const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY!,
  },
});

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

      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: key,
        ContentType: input.contentType,
      });

      const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 60 * 5,
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
