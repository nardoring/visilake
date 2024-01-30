import type { UseCase } from "~/models/domain/useCase";

function generateMockUseCases(count: number): UseCase[] {
  const mockResponse: UseCase[] = [];

  for (let i = 1; i <= count; i++) {
    const analysisTypes = [
      "Analysis Type A",
      "Analysis Type B",
      "Analysis Type C",
    ];
    const useCase: UseCase = {
      useCaseName: `Use case ${i}`,
      date: new Date(`2023-11-${i + 5}T${i + 2}:${i + 20}:00+00:00`),
      useCaseDescription: `This is a test for use case ${i}`,
      useCaseStatus: getRandomStatus(),
      powerBILink: `https://app.powerbi.com/groups/me/reports/{ReportId}/ReportSection?filter=TableName/FieldName eq 'value${i}'`,
      author: `Author ${i}`,
      analysisTypes: analysisTypes.slice(
        0,
        Math.floor(Math.random() * 3 - 0.001) + 1,
      ),
    };

    mockResponse.push(useCase);
  }

  return mockResponse;
}

function getRandomStatus():
  | "Complete"
  | "InProgress"
  | "NotStarted"
  | "Failed" {
  const statusOptions = ["Complete", "InProgress", "NotStarted", "Failed"];
  const randomIndex = Math.floor(Math.random() * statusOptions.length);
  return statusOptions[randomIndex] as
    | "Complete"
    | "InProgress"
    | "NotStarted"
    | "Failed";
}

export default generateMockUseCases;
