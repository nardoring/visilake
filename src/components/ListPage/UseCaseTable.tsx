import React, { useState, useMemo } from "react";
import { api } from "~/utils/api";
import { AgGridReact } from "ag-grid-react";
import 'ag-grid-enterprise';
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
    { field: "useCaseName", headerName: "Job Title", filter: "agTextColumnFilter"},
    { field: "useCaseDescription", headerName: "Job Description", filter: "agTextColumnFilter"},
    { field: "analysisTypes", filter: "agSetColumnFilter"},
    { field: "date", filter: "agDateColumnFilter" },
    { field: "author", filter: "agSetColumnFilter"},
    { field: "useCaseStatus", cellRenderer: StatusChip, filter: "agSetColumnFilter"},
    {
      field: "powerBILink",
      cellRenderer: PowerBIButton,
    },
  ]);

  const defaultColDef = useMemo(
    () => ({
      flex: 1,
      floatingFilter: true,
      filterParams: {
        buttons: ["clear"],
      },
    }),
    [],
  );

  const gridOptions = {
    pagination: true,
    rowHeight: 75,
    paginationPageSize: 5,
    paginationPageSizeSelector: [5, 10],
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
        <div className={"ag-theme-quartz"}>
          <AgGridReact
            rowData={data}
            columnDefs={colDefs}
            gridOptions={gridOptions}
            domLayout={'autoHeight'}
            defaultColDef={defaultColDef}
          />
        </div>
      </div>
    </div>
  );
}
