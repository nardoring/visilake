import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

import Bar from './Bar';
import Logo from "../components/Logo";

export default function Navbar() {
  const router = useRouter();

  const isCurrentPage = (path: string) => router.pathname === path;

  return (
    <nav className="z-30 col-start-2 row-end-3 flex items-center justify-between ">
      <Bar
        angle={-22.4}
        width={''}
        height="85px"
        style={{
          position: 'fixed',
          right: `100px`,
          left: `100px`,
        }}
      />

      <Logo style={{ width: '285px', height: '100px' }} />
      {!isCurrentPage("/ListPage") ? (
        <button
          className="z-40 fixed text-white min-w-[10vw] ml-5 rounded-md bg-transparent px-4 py-2 hover:bg-blue hover:shadow-lg"
          onClick={() => {
            void router.push("/ListPage");
          }}
        >
          <span className="">
            <FontAwesomeIcon icon={faMagnifyingGlass}
              className="pr-2"
            />
            View Use Cases
          </span>
        </button>
      ) : null}
    </nav>
  );
}

