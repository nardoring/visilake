import { postRouter } from '~/server/api/routers/post';
import { createTRPCRouter } from '~/server/api/trpc';
import { analysisRouter } from './routers/analysis';
import { jobRouter } from './routers/job';
import { sourceRouter } from './routers/source';
import { jobUpdatesRouter } from './routers/jobUpdates';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  analysis: analysisRouter,
  job: jobRouter,
  source: sourceRouter,
  jobUpdates: jobUpdatesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
