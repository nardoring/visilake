import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const tagRouter = createTRPCRouter({
  validateTag: publicProcedure
    .input(z.object({ tag: z.string() }))
    .query(async ({ input }) => {
      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      // Introduce a delay for testing loading elements
      await delay(2000);

      if (input.tag.includes("TAG"))
        return {
          isValid: true,
        };
      return {
        isValid: false,
      };
    }),
});
