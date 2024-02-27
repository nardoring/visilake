import React, { useState } from "react";
import { api } from "~/utils/api";

export default function UseCaseTable() {
  const [queryExecuted, setQueryExecuted] = useState<boolean>(false);
  const {
    data: analysisTypeOptionsData,
    isLoading: analysisTypeOptionsIsLoading,
  } = api.analysis.getAnalysisTypes.useQuery();
  const analysisTypeOptions: string[] = analysisTypeOptionsIsLoading
    ? []
    : analysisTypeOptionsData?.types?.map(
        (option: { name: string }) => option.name,
      ) ?? [];

  const { data, isLoading } = api.useCase.getUseCases.useQuery(undefined, {
    enabled: !queryExecuted,
    onSuccess: () => {
      setQueryExecuted(true);
    },
  });

  if (isLoading) {
    // Render a loading indicator or message
    return (
      <div className="fixed z-40 flex h-full w-full items-center justify-center bg-lightIndigo/70">
        <p className="z-40 pb-80 text-6xl text-black">Connecting...</p>
      </div>
    );
  }

  return (
    <div className="col-start-2 col-end-9 row-start-2 mb-5 mt-5 flex">
      <div
        className="relative z-20 col-start-2 col-end-9 row-start-3 row-end-4
                     flex h-[64rem] flex-col
                    overflow-x-auto rounded-md bg-veryLightBlue/70 shadow-xl"
      >

      </div>
    </div>
  );
}
