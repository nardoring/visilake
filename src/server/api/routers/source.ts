import { z } from 'zod';

import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';

export const sourceRouter = createTRPCRouter({
  validateSource: publicProcedure
    .input(z.object({ source: z.string() }))
    .query(async ({ input }) => {
      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      await delay(2000);

      if (input.source.includes('TAG'))
        return {
          isValid: true,
        };
      return {
        isValid: false,
        errorMessage: `${input.source} was not found in the Data Lake`,
      };
    }),
});
