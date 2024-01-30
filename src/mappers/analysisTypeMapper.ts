import type { AnalysisType as DatabaseAnalysisType } from "~/models/db/analysisType";
import type { AnalysisType } from "~/models/domain/analysisType";

function mapAnalysisTypes(
  analysisTypes: DatabaseAnalysisType[],
): AnalysisType[] {
  return analysisTypes.map((t) => mapAnalysisType(t));
}

function mapAnalysisType(analysisType: DatabaseAnalysisType): AnalysisType {
  return {
    name: analysisType.name.S,
    id: parseInt(analysisType.id.S),
  };
}

export default mapAnalysisTypes;
