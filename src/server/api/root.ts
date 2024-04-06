import { athenaRouter } from './routers/athena';
import { postRouter } from '~/server/api/routers/post';
import { createTRPCRouter } from '~/server/api/trpc';
import { analysisRouter } from './routers/analysis';
import { jobRouter } from './routers/job';
import { sourceRouter } from './routers/source';
import { jobUpdatesRouter } from './routers/jobUpdates';
import { s3Router } from './routers/s3';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  athena: athenaRouter,
  post: postRouter,
  analysis: analysisRouter,
  job: jobRouter,
  source: sourceRouter,
  jobUpdates: jobUpdatesRouter,
  s3: s3Router,
});

// export type definition of API
export type AppRouter = typeof appRouter;
