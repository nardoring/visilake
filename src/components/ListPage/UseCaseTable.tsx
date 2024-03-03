import React, { useState, useMemo, useRef, useEffect } from "react";
import { api } from "~/utils/api";
import { AgGridReact } from "ag-grid-react";
import type { SortDirection } from "ag-grid-community";
import type { ITooltipParams } from "ag-grid-enterprise";
import { useSearchBar } from "~/pages/ListPage";
import PowerBIButton from "./PowerBIButton";
import StatusChip from "./StatusChip";
import "ag-grid-enterprise";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

export default function UseCaseTable() {
  const { searchBarText } = useSearchBar();
  const gridRef = useRef<AgGridReact>(null);
  const [queryExecuted, setQueryExecuted] = useState<boolean>(false);

  const { data, isLoading } = api.useCase.getUseCases.useQuery(undefined, {
    enabled: !queryExecuted,
    onSuccess: () => {
      setQueryExecuted(true);
    },
  });

  const [colDefs] = useState([
    {
      field: "useCaseName",
      headerName: "Job Title",
      filter: "agTextColumnFilter",
    },
    {
      field: "useCaseDescription",
      headerName: "Job Description",
      filter: "agTextColumnFilter",
    },
    {
      field: "analysisTypes",
      filter: "agMultiColumnFilter",
      valueGetter: (params: { data: { analysisTypes: string[] } }) =>
        params.data.analysisTypes.join(", "),
      filterValueGetter: (params: { data: { analysisTypes: string[] } }) =>
        params.data.analysisTypes,
    },
    {
      field: "date",
      filter: "agDateColumnFilter",
      sort: "desc" as SortDirection,
      // Ignore global filter ()
      getQuickFilterText: () => {
        return "";
      },
    },
    { field: "author", filter: "agMultiColumnFilter" },
    {
      field: "useCaseStatus",
      headerName: "Status",
      maxWidth: 170,
      minWidth: 170,
      cellRenderer: StatusChip,
      filter: "agSetColumnFilter",
      filterParams: {
        cellRenderer: StatusChip,
        suppressSelectAll: true,
      },
      tooltipValueGetter: (params: ITooltipParams) => {
        const tooltipMessages: Record<string, string> = {
          Complete: "Processing job has been completed",
          InProgress: "Data is currently being processed",
          NotStarted: "Processing job will soon be started",
          Failed: "An error has occurred",
        };

        return tooltipMessages[params.value as string] ?? "INVALID";
      },
    },
    {
      field: "powerBILink",
      headerName: "PowerBI",
      cellRenderer: PowerBIButton,
      maxWidth: 100,
      minWidth: 100,
      resizable: false,
      sortable: false,
      headerTooltip: "Provides a data source link to use within PowerBI",
      tooltipValueGetter: (params: ITooltipParams) => {
        if ((params.data as { useCaseStatus: string }).useCaseStatus !== "Complete")
          return "Link is unavailable";
        return "Copy link to clipboard";
      },
      // Ignore global filter ()
      getQuickFilterText: () => {
        return "";
      },
    },
  ]);

  const defaultColDef = useMemo(
    () => ({
      flex: 1,
      floatingFilter: true,
      filterParams: {
        buttons: ["clear"],
      },
      wrapText: true,
    }),
    [],
  );

  const gridOptions = {
    rowHeight: 70,

    pagination: true,
    paginationPageSize: 5,
    paginationPageSizeSelector: [5, 10],

    tooltipShowDelay: 250,

    sideBar: {
      toolPanels: [
        {
          id: "columns",
          labelDefault: "Columns",
          labelKey: "columns",
          iconKey: "columns",
          toolPanel: "agColumnsToolPanel",
          toolPanelParams: {
            suppressValues: true,
            suppressPivots: true,
            suppressPivotMode: true,
            suppressRowGroups: true,
          },
        },
        {
          id: "filters",
          labelDefault: "Filters",
          labelKey: "filters",
          iconKey: "filter",
          toolPanel: "agFiltersToolPanel",
        },
      ],
    },
  };

  useEffect(() => {
    gridRef.current?.api?.setGridOption("quickFilterText", searchBarText);
  }, [searchBarText]);

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
            ref={gridRef}
            rowData={data}
            columnDefs={colDefs}
            gridOptions={gridOptions}
            domLayout={"autoHeight"}
            defaultColDef={defaultColDef}
          />
        </div>
      </div>
    </div>
  );
}
