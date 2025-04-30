import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { typingEntry } from "./routers/typing-entry";
import { geminiPrompt } from "./routers/gemini-prompt";
import { pdfProcessor } from "./routers/pdf-processor";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  typingEntry: typingEntry,
  geminiPrompt: geminiPrompt,
  pdfProcessor: pdfProcessor,
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
