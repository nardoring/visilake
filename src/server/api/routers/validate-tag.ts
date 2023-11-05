import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const postRouter = createTRPCRouter({
  validateTag: publicProcedure
    .input(z.object({ tag: z.string() }))
    .query(({ input }) => {
      return {
        isValid: true,
      };
    }),
});
