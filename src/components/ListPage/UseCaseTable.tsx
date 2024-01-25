import { api } from "~/utils/api";
import StatusChip from "./StatusChip";
import { formatDate } from "~/utils/date";
import SearchBar from "./SearchBar";
import PowerBIButton from "./PowerBIButton";
import TablePaginationBar from "./TablePaginationBar";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { Row } from "@tanstack/react-table";
import { useState } from "react";
import type { UseCase } from "~/models/useCase";
import FilterDropdown from "./FilterDropdown";

export default function UseCaseTable() {
  const [queryExecuted, setQueryExecuted] = useState<boolean>(false);
  const [globalFilter, setGlobalFilter] = useState<string>("");

  const { data, isLoading } = api.useCase.getUseCases.useQuery(
    { minId: 1, maxAmount: 10 },
    {
      enabled: !queryExecuted,
      onSuccess: () => {
        setQueryExecuted(true);
      },
    },
  );

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
    },
    {
      accessorKey: "useCaseStatus",
      header: "Status",
      size: (1920 / 10) * 0.75,
      cell: (props: { getValue: () => string }) => (
        <StatusChip status={props.getValue()} />
      ),
    },
    {
      accessorKey: "date",
      header: "Date Created",
      size: (1920 / 10) * 1,
      cell: (props: { getValue: () => Date }) => {
        return <p>{formatDate(props.getValue())}</p>;
      },
    },
    {
      accessorKey: "author",
      header: "Created By",
      size: (1920 / 10) * 1,
      cell: (props: { getValue: () => string }) => <p>{props.getValue()}</p>,
    },
    {
      accessorKey: "powerBILink",
      header: "Power BI Data Link",
      size: (1920 / 10) * 2.5,
      cell: (props: { getValue: () => string; row: Row<UseCase> }) => (
        <PowerBIButton
          link={props.getValue()}
          status={props.row.original.useCaseStatus}
        />
      ),
    },
  ];

  const table = useReactTable({
    data: data ?? [],
    columns,
    state: {
      globalFilter: globalFilter,
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    columnResizeMode: "onChange",
  });

  if (isLoading) {
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
                    {header.column.columnDef.header === "Status" && <FilterDropdown/>}
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
