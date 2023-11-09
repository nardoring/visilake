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
        },
        {
          useCaseName: "Use case 2",
          date: new Date("2023-11-07T04:22:20+00:00"),
          useCaseDescription: "This is the second test",
          useCaseStatus: "InProgress",
          powerBILink:
            "https://app.powerbi.com/groups/me/reports/{ReportId}/ReportSection?filter=TableName/FieldName eq 'value2'",
        },
        {
          useCaseName: "Use case 3",
          date: new Date("2023-11-08T05:23:21+00:00"),
          useCaseDescription: "A third test case",
          useCaseStatus: "NotStarted",
          powerBILink:
            "https://app.powerbi.com/groups/me/reports/{ReportId}/ReportSection?filter=TableName/FieldName eq 'value3'",
        },
        {
          useCaseName: "Use case 4",
          date: new Date("2023-11-09T06:24:22+00:00"),
          useCaseDescription: "Another test case description",
          useCaseStatus: "Complete",
          powerBILink:
            "https://app.powerbi.com/groups/me/reports/{ReportId}/ReportSection?filter=TableName/FieldName eq 'value4'",
        },
        {
          useCaseName: "Use case 5",
          date: new Date("2023-11-10T07:25:23+00:00"),
          useCaseDescription: "Fifth use case scenario",
          useCaseStatus: "InProgress",
          powerBILink:
            "https://app.powerbi.com/groups/me/reports/{ReportId}/ReportSection?filter=TableName/FieldName eq 'value5'",
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
