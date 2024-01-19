import { UseCase } from "~/models/useCase";
import { UseCaseStatus } from "~/models/useCaseStatus";

function mapUseCases(output: any[]): UseCase[] {
  return output.map((o) => mapUseCase(o));
}

function mapAnalysisTypeLists(analysisTypes: any[]): string[] {
  return analysisTypes.map((t) => t.S);
}

function mapUseCase(useCase: any): UseCase {
  return {
    useCaseName: useCase.useCaseName.S as string,
    date: new Date(),
    useCaseDescription: useCase.useCaseDescription.S as string,
    useCaseStatus: useCase.useCaseStatus.S as UseCaseStatus,
    powerBILink: useCase.powerBILink.S as string,
    author: useCase.author.S as string,
    analysisTypes: mapAnalysisTypeLists(useCase.analysisTypes.L),
  } as UseCase;
}

export default mapUseCases;
