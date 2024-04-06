import { createTRPCRouter, publicProcedure } from '../trpc';

export const s3Router = createTRPCRouter({
  getS3Url: publicProcedure.query(() => {
    return process.env.S3_URL;
  }),
});
