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
      cell: (props: { getValue: () => string }) => <p>{props.getValue()}</p>,
    },
    {
      accessorKey: "useCaseDescription",
      header: "Description",
      cell: (props: { getValue: () => string }) => <p>{props.getValue()}</p>,
    },
    {
      accessorKey: "analysisTypes",
      header: "Analysis Types",
      cell: (props: { getValue: () => string[] }) => <p>{props.getValue()}</p>,
    },
    {
      accessorKey: "useCaseStatus",
      header: "Status",
      cell: (props: { getValue: () => string }) => <p>{props.getValue()}</p>,
    },
    {
      accessorKey: "date",
      header: "Date Created",
      cell: (props) => {
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
      cell: (props: { getValue: () => string }) => <p>{props.getValue()}</p>,
    },
  ];

  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  console.log();
  return (
    <div>
      <div className="table w-full overflow-x-auto bg-lightIndigo">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {String(header.column.columnDef.header)}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className={row.index % 2 === 0 ? 'bg-white' : 'bg-veryLightGrey'}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
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
