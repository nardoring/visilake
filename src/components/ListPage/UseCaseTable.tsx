import { api } from "~/utils/api";
import StatusChip from "./StatusChip";
import { formatDate } from "~/utils/date";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

export default function UseCaseTable() {
  const { data, isLoading } = api.useCase.getUseCases.useQuery(
    { minId: 1, maxAmount: 10 },
    {
      onSuccess: () => {
        console.log(data);
      },
    },
  );

  const columns = [
    {
      accessorKey: "useCaseName",
      header: "Use Case Name",
      size: (1920 / 10) * 1,
      cell: (props: { getValue: () => string }) => <p>{props.getValue()}</p>,
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
      size: (1920 / 10) * 1,
      cell: (props: { getValue: () => string[] }) => <p>{props.getValue()}</p>,
    },
    {
      accessorKey: "useCaseStatus",
      header: "Status",
      size: (1920 / 10) * 1,
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
      size: (1920 / 10) * 4,
      cell: (props: { getValue: () => string }) => <p>{props.getValue()}</p>,
    },
  ];

  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: "onChange",
  });

  if (isLoading) {
    // Render a loading indicator or message
    return (
      <div className="fixed flex h-full w-full items-center justify-center bg-lightIndigo">
        <p className="text-black pb-80">Loading Data...</p>
      </div>
    );
  }
  return (
    <div>
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
                    className="p-2 pl-4 text-left font-bold text-[#595C64]"
                    style={{ width: `${header.getSize()}px` }}
                  >
                    {String(header.column.columnDef.header)}
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
                } h-[4.4rem]`}
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
      </div>
    </div>
  );
}
