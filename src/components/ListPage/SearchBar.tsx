import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import type { ColumnFilter } from "@tanstack/react-table";
import type { Dispatch, SetStateAction } from "react";

interface SearchBarProps {
  // columnFilters: ColumnFilter[];
  setColumnFilters: Dispatch<SetStateAction<ColumnFilter[]>>;
}

export default function SearchBar({ setColumnFilters }: SearchBarProps) {
  const router = useRouter();
  // const useCaseNameFilter=
  //   columnFilters.find((filter: { id: string }) => filter.id === "useCaseName")
  //     ?.value ?? "";

  const onFilterChange = (id: string, value: string) =>
    setColumnFilters((prev) =>
      prev
        .filter((f: { id: string }) => f.id !== id)
        .concat({
          id,
          value,
        }),
    );

  return (
    <div className="flex items-center justify-between bg-lightIndigo p-5 ">
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-1.5">
          <FontAwesomeIcon icon={faMagnifyingGlass} />
        </span>
        <input
          className="block min-w-[20vw] rounded-md border border-black bg-darkIndigo py-1.5 pl-7 text-gray-900 shadow-sm focus:ring-2 focus:ring-inset focus:ring-indigo-300"
          type="text"
          onChange={(e) => {
            onFilterChange("useCaseName", e.target.value);
          }}
        />
      </div>
      <button
        className="ml-4 rounded bg-blue-600 px-4 py-2 text-white shadow-md"
        type="submit"
        onClick={(e) => {
          void router.push("/");
        }}
      >
        + New Use Case
      </button>
    </div>
  );
}
