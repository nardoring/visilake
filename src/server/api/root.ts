import { postRouter } from "~/server/api/routers/post";
import { createTRPCRouter } from "~/server/api/trpc";
import { analysisRouter } from "./routers/analysis";
import { useCaseRouter } from "./routers/useCase";
import { tagRouter } from "./routers/tag";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  analysis: analysisRouter,
  useCase: useCaseRouter,
  tag: tagRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
