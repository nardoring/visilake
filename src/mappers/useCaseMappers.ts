import type { UseCase } from "~/models/domain/useCase";
import type { UseCaseStatus } from "~/models/domain/useCaseStatus";
import type { UseCase as DatabaseUseCase } from "~/models/db/useCase";

function mapUseCases(output: DatabaseUseCase[]): UseCase[] {
  return output.map((o) => mapUseCase(o));
}

function mapUseCase(useCase: DatabaseUseCase): UseCase {
  return {
    useCaseName: useCase.useCaseName.S,
    date: new Date(useCase.creationDate.N * 1),
    useCaseDescription: useCase.useCaseDescription.S,
    useCaseStatus: useCase.useCaseStatus.S as UseCaseStatus,
    powerBILink: useCase.powerBILink.S,
    author: useCase.author.S,
    analysisTypes: useCase.analysisTypes.L.map((t) => t.S),
  } as UseCase;
}

export default mapUseCases;
