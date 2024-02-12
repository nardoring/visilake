import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import type { Dispatch, SetStateAction } from "react";

interface SearchBarProps {
  // columnFilters: ColumnFilter[];
  setGlobalFilter: Dispatch<SetStateAction<string>>;
}

export default function SearchBar({ setGlobalFilter }: SearchBarProps) {
  const router = useRouter();

  return (
    <div className="z-40 flex items-center pl-5 w-full justify-left p-5 ">
      <div className="relative shadow-xl">
        <span className="absolute inset-y-0 left-0 flex items-center pl-1.5">
          <FontAwesomeIcon icon={faMagnifyingGlass} />
        </span>
        <input
          className="block min-w-[10vw] rounded-md border border-black bg-veryLightBlue py-1.5 pl-7 text-gray-900 shadow-sm focus:ring-offset-2 focus:ring-4 focus:ring-boldBlue-300"
          type="text"
          onChange={(e) => {
            setGlobalFilter(e.target.value);
          }}
        />
      </div>
      <button
        className="block min-w-[10vw] ml-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        type="submit"
        onClick={() => {
          void router.push("/");
        }}
      >
        + New Use Case
      </button>
    </div>
  );
}
