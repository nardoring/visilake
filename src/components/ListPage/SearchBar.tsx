import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

export default function SearchBar() {
  const router = useRouter();

  return (
    <div className="bg-lightIndigo flex items-center justify-between p-5 ">
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-1.5">
          <FontAwesomeIcon icon={faMagnifyingGlass} />
        </span>
        <input
          className="bg-darkIndigo block min-w-[20vw] rounded-md border border-black py-1.5 pl-7 text-gray-900 shadow-sm focus:ring-2 focus:ring-inset focus:ring-indigo-300"
          type="text"
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
