
import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

import Bar from "./Bar";
import Logo from "../components/Logo";
import SearchBar from "./ListPage/SearchBar";

export default function Navbar() {
  const router = useRouter();
  const setGlobalFilter = () => {};
  const isCurrentPage = (path: string) => router.pathname === path;

  return (
    <nav className="relative z-30 col-start-2 col-end-9 row-span-2 flex items-center">
      <Bar
        angle={-22.4}
        //angle={0}
        width={"100%"}
        height="100%"
        style={{
          position: "absolute",
        }}
      />
      <div className="ml-10"></div>

      {!isCurrentPage("/ListPage") ? (
        <button
          className="z-40 ml-5 min-w-[10vw] rounded-md bg-transparent px-4 py-2 text-white hover:bg-blue hover:shadow-lg"
          onClick={() => {
            void router.push('/ListPage');
          }}
        >
          <span className="">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="pr-2" />
            View Jobs
          </span>
        </button>
      ) : (
        <div className="flex items-center">
          <SearchBar setGlobalFilter={setGlobalFilter} />
        </div>
      )}

      <Logo
        // This is here so that the Navbar gets the correct length for the logo. For allignment the actual displayed logo needs to be out of the bar
        style={{
          width: "285px",
          height: "100px",
          marginRight: "0px",
          opacity: "0",
        }}
      />
    </nav>
  );
}
