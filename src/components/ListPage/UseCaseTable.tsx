import React, { useState, useMemo } from "react";
import { api } from "~/utils/api";
import { AgGridReact } from "ag-grid-react";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import PowerBIButton from "./PowerBIButton";
import StatusChip from "./StatusChip";

export default function UseCaseTable() {
  const [queryExecuted, setQueryExecuted] = useState<boolean>(false);

  const { data, isLoading } = api.useCase.getUseCases.useQuery(undefined, {
    enabled: !queryExecuted,
    onSuccess: () => {
      setQueryExecuted(true);
    },
  });

  const [colDefs, setColDefs] = useState([
    { field: "useCaseName", headerName: "Job Title" },
    { field: "useCaseDescription", headerName: "Job Description" },
    { field: "analysisTypes" },
    { field: "date", filter: "agDateColumnFilter" },
    { field: "author" },
    { field: "useCaseStatus", cellRenderer: StatusChip },
    {
      field: "powerBILink",
      cellRenderer: PowerBIButton,
    },
  ]);

  const defaultColDef = useMemo(
    () => ({
      flex: 1,
      filterParams: {
        buttons: ["clear"],
      },
    }),
    [],
  );

  const gridOptions = {
    rowHeight: 75,
  };

  if (isLoading) {
    // Render a loading indicator or message
    return (
      <div className="fixed z-40 flex h-full w-full items-center justify-center bg-lightIndigo/70">
        <p className="z-40 pb-80 text-6xl text-black">Connecting...</p>
      </div>
    );
  }

  return (
    <div className="col-start-2 col-end-9 row-start-2 mb-5 mt-5">
      <div
        className="relative z-20 col-start-2 col-end-9 row-start-3 row-end-4
                     flex h-[64rem] flex-col
                    overflow-x-auto rounded-md"
      >
        <div className={"ag-theme-quartz"} style={{ height: "500px" }}>
          <AgGridReact
            rowData={data}
            columnDefs={colDefs}
            gridOptions={gridOptions}
            defaultColDef={defaultColDef}
          />
        </div>
      </div>
    </div>
  );
}
