export interface UseCase {
  useCaseName: string;
  date: Date;
  useCaseDescription: string;
  useCaseStatus: "Complete" | "InProgress" | "NotStarted" | "Failed";
  powerBILink: string;
}
