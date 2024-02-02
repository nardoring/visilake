import { createTRPCRouter, publicProcedure } from "../trpc";

export const analysisRouter = createTRPCRouter({
  getAnalysisTypes: publicProcedure.query(() => {
    return {
      types: [
        { name: "Rolling Mean", id: 1 },
        { name: "Rolling Std Deviation", id: 2 },
        { name: "Autocorrelation", id: 3 },
      ],
    };
  }),
});
