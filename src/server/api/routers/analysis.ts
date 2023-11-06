import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const analysisRouter = createTRPCRouter({
  getAnalysisTypes: publicProcedure.query(() => {
    return {
      types: ["Analysis 1", "Analysis 2", "Analysis 3"],
    };
  }),
});
