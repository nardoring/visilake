import { api } from "~/utils/api";
import StatusChip from "./StatusChip";
import { formatDate } from "~/utils/date";
import SearchBar from "./SearchBar";
import PowerBIButton from "./PowerBIButton";
import TablePaginationBar from "./TablePaginationBar";

import {
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { ColumnFilter, Row } from "@tanstack/react-table";
import { useState } from "react";
import type { UseCase } from "~/models/domain/useCase";
import FilterDropdown from "./FilterDropdown";
import ColumnSortButton from "./ColumnSortButton";

export default function UseCaseTable() {
  const filterDropdownColumns = new Set([
    "Status",
    "Created By",
    "Analysis Types",
  ]);
  const sortableColumns = new Set(["Date Created"]);
  const [queryExecuted, setQueryExecuted] = useState<boolean>(false);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([]);
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

  const columns = [
    {
      accessorKey: "useCaseName",
      header: "Use Case Name",
      size: (1920 / 10) * 1,
      cell: (props: { getValue: () => string }) => (
        <p className="font-medium">{props.getValue()}</p>
      ),
    },
    {
      accessorKey: "useCaseDescription",
      header: "Description",
      size: (1920 / 10) * 2,
      cell: (props: { getValue: () => string }) => <p>{props.getValue()}</p>,
    },
    {
      accessorKey: "analysisTypes",
      header: "Analysis Types",
      size: (1920 / 10) * 1.5,
      cell: (props: { getValue: () => string[] }) => (
        <p>{props.getValue().join(", ")}</p>
      ),
      filterFn: (
        row: Row<UseCase>,
        columnId: string,
        filterAnalysisTypes: string[],
      ) => {
        if (filterAnalysisTypes.length === 0) return true;
        const analysisTypes: string[] = row.getValue(columnId);
        return filterAnalysisTypes.every((analysisType) =>
          analysisTypes.includes(analysisType),
        );
      },
    },
    {
      accessorKey: "useCaseStatus",
      header: "Status",
      size: (1920 / 10) * 0.75,
      cell: (props: { getValue: () => string }) => (
        <StatusChip status={props.getValue()} />
      ),
      filterFn: (
        row: Row<UseCase>,
        columnId: string,
        filterStatuses: string[],
      ) => {
        if (filterStatuses.length === 0) return true;
        const author: string = row.getValue(columnId);
        return filterStatuses.includes(author);
      },
    },
    {
      accessorKey: "date",
      header: "Date Created",
      size: (1920 / 10) * 1,
      cell: (props: { getValue: () => Date}) => {
        return <p>{formatDate(props.getValue())}</p>;
      },
      sortType: "datetime",
    },
    {
      accessorKey: "author",
      header: "Created By",
      size: (1920 / 10) * 1,
      cell: (props: { getValue: () => string }) => <p>{props.getValue()}</p>,
      filterFn: (
        row: Row<UseCase>,
        columnId: string,
        filterAuthorNames: string[],
      ) => {
        if (filterAuthorNames.length === 0) return true;
        const status: string = row.getValue(columnId);
        return filterAuthorNames.includes(status);
      },
    },
    {
      accessorKey: "powerBILink",
      header: "Power BI Data Link",
      size: (1920 / 10) * 4.5,
      cell: (props: { getValue: () => string; row: Row<UseCase> }) => (
        <PowerBIButton
          link={props.getValue()}
          status={props.row.original.useCaseStatus}
        />
      ),
      enableGlobalFilter: false,
      enableColumnFilter: false,
    },
  ];

  const table = useReactTable({
    data: data ?? [],
    columns,
    state: {
      globalFilter: globalFilter,
      columnFilters,
    },
    initialState: {
      sorting: [
        {
          id: 'date',
          desc: true,
        }
      ]
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFacetedUniqueValues: getFacetedUniqueValues(),
    columnResizeMode: "onChange",
  });

  if (isLoading || analysisTypeOptionsIsLoading) {
    // Render a loading indicator or message
    return (
      <div className="fixed flex h-full w-full items-center justify-center bg-lightIndigo">
        <p className="pb-80 text-black">Loading Data...</p>
      </div>
    );
  }
  return (
    <div>
      <SearchBar setGlobalFilter={setGlobalFilter} />
      <div className="font-nunito table w-full overflow-x-auto bg-lightIndigo">
        <table
          className="w-full"
          style={{ width: `${table.getTotalSize()}px` }}
        >
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="pb-2 pl-4 text-left font-bold text-[#595C64]"
                    style={{ width: `${header.getSize()}px` }}
                  >
                    {String(header.column.columnDef.header)}
                    {/* Filter Dropdowns */}
                    {typeof header.column.columnDef.header === "string" &&
                      filterDropdownColumns.has(
                        header.column.columnDef.header,
                      ) && (
                        <FilterDropdown
                          dropdownItems={Array.from(
                            header.column.columnDef.header === "Analysis Types"
                              ? analysisTypeOptions
                              : header.column.getFacetedUniqueValues().keys(),
                          )}
                          filterId={header.id}
                          setColumnFilters={setColumnFilters}
                        />
                      )}
                    {/* Sorting Button */}
                    {typeof header.column.columnDef.header === "string" &&
                      sortableColumns.has(header.column.columnDef.header) && (
                        <ColumnSortButton columnSortToggle={header.column.getToggleSortingHandler()}/>
                      )}
                    <div
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      className={`resizer ${
                        header.column.getIsResizing() ? "isResizing" : ""
                      }`}
                    />
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={`${
                  row.index % 2 === 0 ? "bg-white" : "bg-veryLightGrey"
                } h-[4.28rem]`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="pl-4 text-base font-[400] text-[#595C64]"
                    style={{ width: `${cell.column.getSize()}px` }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="fixed bottom-0 left-0 w-full bg-white">
          <TablePaginationBar table={table} />
        </div>
      </div>
    </div>
  );
}
