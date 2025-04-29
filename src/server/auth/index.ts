import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { env } from "@/env";

const prisma = new PrismaClient();
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    google: {
      clientId:
        "283356815990-sok2g49h8cfdb3hpn3e4kmge7rr1lkbc.apps.googleusercontent.com",
      clientSecret: "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",
    },
  },
});
