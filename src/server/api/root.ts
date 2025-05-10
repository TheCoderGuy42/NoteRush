import {
  createCallerFactory,
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";
import { typingEntry } from "@/server/api/routers/typing-entry";
import { pdfProcessor } from "./routers/pdf-processor";
import { limits } from "./routers/check-limits";
import { s3Upload } from "./routers/s3";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  typingEntry: typingEntry,
  pdfProcessor: pdfProcessor,
  limits: limits,
  s3Upload: s3Upload,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
