import type { UseCaseStatus } from "./useCaseStatus";

export interface UseCase {
  useCaseName: string;
  date: Date;
  useCaseDescription: string;
  useCaseStatus: UseCaseStatus;
  powerBILink: string;
  author: string;
  analysisTypes: string[];
}
