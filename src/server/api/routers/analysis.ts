import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const analysisRouter = createTRPCRouter({
  getAnalysisTypes: publicProcedure.query(async () => {
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // Introduce a delay for testing loading elements
    await delay(2000);

    return {
      types: [
        { name: "Analysis 1", id: 1 },
        { name: "Analysis 2", id: 2 },
        { name: "Analysis 3", id: 3 },
      ],
    };
  }),
});
