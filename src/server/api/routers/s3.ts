import { createTRPCRouter, publicProcedure } from '../trpc';

export const s3Router = createTRPCRouter({
  getS3Url: publicProcedure.query(async () => {
    return process.env.S3_URL;
  }),
});
