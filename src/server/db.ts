import { PrismaClient } from "@prisma/client";
import { env } from "@/env";
import { withAccelerate } from "@prisma/extension-accelerate";

const createPrismaClient = () => new PrismaClient().$extends(withAccelerate());

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
