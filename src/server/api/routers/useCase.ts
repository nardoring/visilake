import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { UseCase } from "~/models/useCase";

export const useCaseRouter = createTRPCRouter({
  getUseCases: publicProcedure
    .input(
      z.object({
        minId: z.number().positive(),
        maxAmount: z.number().positive(),
      }),
    )
    .query(({ input }) => {
      let mockResponse: UseCase[] = [
        {
          useCaseName: "Use case 1",
          date: new Date("2023-11-06T03:21:19+00:00"),
          useCaseDescription: "This is a test",
          useCaseStatus: "Complete",
          powerBILink:
            "https://app.powerbi.com/groups/me/reports/{ReportId}/ReportSection?filter=TableName/FieldName eq 'value'",
          author: "James Smith",
          analysisTypes: ["Trend Analysis", "Predictive Modeling"],
        },
        {
          useCaseName: "Use case 2",
          date: new Date("2023-11-07T04:22:20+00:00"),
          useCaseDescription: "This is the second test",
          useCaseStatus: "InProgress",
          powerBILink:
            "https://app.powerbi.com/groups/me/reports/{ReportId}/ReportSection?filter=TableName/FieldName eq 'value2'",
          author: "Maria Garcia",
          analysisTypes: ["Data Mining", "Text Analytics"],
        },
        // ... other use cases updated similarly
        {
          useCaseName: "Use case 5",
          date: new Date("2023-11-10T07:25:23+00:00"),
          useCaseDescription: "Fifth use case scenario",
          useCaseStatus: "InProgress",
          powerBILink:
            "https://app.powerbi.com/groups/me/reports/{ReportId}/ReportSection?filter=TableName/FieldName eq 'value5'",
          author: "David Johnson",
          analysisTypes: ["Sentiment Analysis", "Risk Assessment"],
        },
      ];

      return mockResponse;
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
