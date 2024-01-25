import { number } from "zod";
import type { UseCase } from "~/models/useCase";

const mockAuthorNames = [
  "Emily Johnson",
  "James Mitchell",
  "Sophia Turner",
  "Benjamin Hayes",
  "Olivia Bennett"
];

function generateMockUseCases(count: number): UseCase[] {
  const mockResponse: UseCase[] = [];

  for (let i = 1; i <= count; i++) {
    const analysisTypes = ["Rolling Mean", "Autocorrelation", "Rolling Std Deviation"];
    const useCase: UseCase = {
      useCaseName: `Use case ${i}`,
      date: getRandomDate(new Date(2023, 8, 1), new Date(2024, 1, 15)),
      useCaseDescription: `This is a test for use case ${i}`,
      useCaseStatus: getRandomStatus(),
      powerBILink: `https://app.powerbi.com/groups/me/reports/{ReportId}/ReportSection?filter=TableName/FieldName eq 'value${i}'`,
      author: mockAuthorNames[Math.floor(Math.random() * 5)] ?? "Jane Doe",
      analysisTypes: analysisTypes.slice(0, Math.floor(Math.random() * 3 - 0.001) + 1),
    };

    mockResponse.push(useCase);
  }

  return mockResponse;
}

function getRandomDate(startDate: Date, endDate: Date): Date {
  const startMillis = startDate.getTime();
  const endMillis = endDate.getTime();
  const randomMillis = startMillis + Math.random() * (endMillis - startMillis);
  return new Date(randomMillis);
}

function getRandomStatus(): "Complete" | "InProgress" | "NotStarted" | "Failed" {
    const statusOptions = ["Complete", "InProgress", "NotStarted", "Failed"];
    const randomIndex = Math.floor(Math.random() * statusOptions.length);
    return statusOptions[randomIndex] as "Complete" | "InProgress" | "NotStarted" | "Failed";
  }

export default generateMockUseCases;