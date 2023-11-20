import { createTRPCRouter, publicProcedure } from "../trpc";

export const analysisRouter = createTRPCRouter({
  getAnalysisTypes: publicProcedure.query(async () => {
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // Introduce a delay for testing loading elements
    await delay(2000);

    return {
      types: [
        { name: "Rolling Mean", id: 1 },
        { name: "Rolling Std Deviation", id: 2 },
        { name: "Autocorrelation", id: 3 },
      ],
    };
  }),
});
