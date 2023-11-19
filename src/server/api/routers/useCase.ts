import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { UseCase } from "~/models/useCase";
import generateMockUseCases from "~/utils/mockUseCaseGenerator";
import { api } from "~/utils/api";

export const useCaseRouter = createTRPCRouter({
  getUseCases: publicProcedure
    .input(
      z.object({
        minId: z.number().positive(),
        maxAmount: z.number().positive(),
      }),
    )
    .query(async ({ input }) => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return generateMockUseCases(20);
    }),

  submitUseCase: publicProcedure
    .input(
      z.object({
        useCaseName: z.string().min(1),
        useCaseDescription: z.string(),
        tags: z.array(z.string()),
        analysisTypeId: z.array(z.number().positive()),
      }),
    )
    .mutation(({ input }) => {}),
});

