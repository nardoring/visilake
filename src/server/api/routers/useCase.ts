import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import generateMockUseCases from "~/utils/mockUseCaseGenerator";

export const useCaseRouter = createTRPCRouter({
  getUseCases: publicProcedure
    .input(
      z.object({
        minId: z.number().positive(),
        maxAmount: z.number().positive(),
      }),
    )
    .query(async ({}) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return generateMockUseCases(20);
    }),

    submitUseCase: publicProcedure
    .input(
      z.object({
        useCaseName: z.string().min(1).refine((data) => data.length > 0, {
          message: 'useCaseName should have at least 1 character',
        }),
        useCaseDescription: z.string().refine((data) => data.length > 0, {
          message: 'useCaseDescription should not be empty',
        }),
        tags: z.array(z.string()).refine((data) => data.length > 0, {
          message: 'tags should not be empty',
        }),
        analysisTypeIds: z.array(z.number().positive()).refine((data) => data.length > 0, {
          message: 'analysisTypeIds should not be empty and should only contain positive numbers',
        }),
      }),
    )
    .mutation(async ({ }) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }),
});

