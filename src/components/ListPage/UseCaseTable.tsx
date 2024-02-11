import React, { useState } from 'react';
import { api } from "~/utils/api"
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
import type { UseCase } from "~/models/domain/useCase";
import FilterDropdown from "./FilterDropdown";
import ColumnSortButton from "./ColumnSortButton";

export default function UseCaseTable() {
  const filterDropdownColumns = new Set([
    "Status",
    "Created By",
    "Analysis Types",
  ]);
  const sortableColumns = new Set(["Created"]);
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
      header: "Job Name",
      size: (1920 / 10) * 1.1,
      cell: (props: { getValue: () => string }) => (
        <p>{props.getValue()}</p>
      ),
    },
    {
      accessorKey: "useCaseDescription",
      header: "Description",
      size: (1920 / 10) * 4,
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
      size: (1920 / 10) * 1,
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
      header: "Created",
      size: (1920 / 10) * 2,
      cell: (props: { getValue: () => Date }) => {
        return <p>{formatDate(props.getValue())}</p>;
      },
      sortType: "datetime",
    },
    {
      accessorKey: "author",
      header: "Author",
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
      header: "Power BI",
      size: (1920 / 10) * 0.7,
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

  if (isLoading) {
    // Render a loading indicator or message
    return (
      <div className="z-40 fixed flex h-full w-full items-center justify-center bg-lightIndigo/70">
        <p className="z-40 pb-80 text-black">Loading Data...</p>
      </div>
    );
  }

  {/* <div className="absolute sticky top-100 z-40" > */ }
  return (
    <div className="col-start-2 col-end-9 row-start-2 row-end-4 pt-2" >
      <div className="fixed z-40 mb-8" >
        <SearchBar setGlobalFilter={setGlobalFilter} />
      </div>

      <div className="flex-container sticky top-0 items-center rounded-md shadow-xl overflow-x-auto z-20 mt-40 row-start-3 row-end-4 bg-veryLightBlue/75 col-start-2 col-end-9"
        style={{ width: `max(0, ${table.getTotalSize()})px` }}
      >

        <table className="table bg-veryLightBlue" >
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
                        <ColumnSortButton columnSortToggle={header.column.getToggleSortingHandler()} />
                      )}
                    <div
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      className={`resizer ${header.column.getIsResizing() ? "isResizing" : ""
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
                className={`${table.getRowModel().rows.indexOf(row) % 2 === 0 ? "bg-white" : "bg-lightIndigo"
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
        <TablePaginationBar table={table} />
      </div>
    </div>
  );
}
