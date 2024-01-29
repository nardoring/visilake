import { createTRPCRouter, publicProcedure } from "../trpc";

export const analysisRouter = createTRPCRouter({
  getAnalysisTypes: publicProcedure.query(async () => {
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    return {
      types: [
        { name: "Rolling Mean", id: 1 },
        { name: "Rolling Std Deviation", id: 2 },
        { name: "Autocorrelation", id: 3 },
      ],
    };
  }),
});
