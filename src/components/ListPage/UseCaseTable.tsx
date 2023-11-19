import { api } from "~/utils/api";
import TableItem from "./TableItem";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { UseCase } from "~/models/useCase";

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
      size: (1920/10)*1,
      cell: (props: { getValue: () => string }) => <p>{props.getValue()}</p>,
    },
    {
      accessorKey: "useCaseDescription",
      header: "Description",
      size: (1920/10)*2,
      cell: (props: { getValue: () => string }) => <p>{props.getValue()}</p>,
    },
    {
      accessorKey: "analysisTypes",
      header: "Analysis Types",
      size: (1920/10)*1,
      cell: (props: { getValue: () => string[] }) => <p>{props.getValue()}</p>,
    },
    {
      accessorKey: "useCaseStatus",
      header: "Status",
      size: (1920/10)*1,
      cell: (props: { getValue: () => string }) => <p>{props.getValue()}</p>,
    },
    {
      accessorKey: "date",
      header: "Date Created",
      size: (1920/10)*1,
      cell: (props: { getValue: () => Date }) => {
        const rawDate = props.getValue(); // Assuming rawDate is a valid date string
        const dateObject = new Date(rawDate);

        // Format the time as h:mm AM/PM
        const formattedTime = dateObject.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });

        // Get individual date components
        const day = dateObject.getDate();
        const month = dateObject.getMonth() + 1; // Months are zero-based, so add 1
        const year = dateObject.getFullYear();

        // Format the date as 2023/09/31
        const formattedDate = `${year}/${month
          .toString()
          .padStart(2, "0")}/${day.toString().padStart(2, "0")}`;

        // Combine the formatted time and date
        const formattedDateTime = `${formattedTime} ${formattedDate}`;

        return <p>{formattedDateTime}</p>;
      },
    },
    {
      accessorKey: "author",
      header: "Created By",
      size: (1920/10)*4,
      cell: (props: { getValue: () => string }) => <p>{props.getValue()}</p>,
    },
  ];

  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: "onChange"
  });

  console.log();
  return (
    <div>
      <div className="bg-lightIndigo table w-full overflow-x-auto font-nunito">
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
                    className="p-2 pl-4 font-bold text-left text-[#595C64]"
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
                    className="pl-2 text-[#595C64] text-base font-[400]"
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
