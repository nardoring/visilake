import { useRouter } from "next/router";

export default function Navbar() {
  const router = useRouter();

  const isCurrentPage = (path: string) => router.pathname === path;

  return (
    <nav className="flex items-center justify-between bg-white p-4 shadow-md">
      <svg version="1.1" viewBox="0 0 352 120" width="12em" className="p-1">
        <g>
          <polygon
            id="_Pfad__2_"
            points="49.7,0 0,120 302.4,120 352,0 "
            fill="#003A78"
          />
          <path
            id="_Pfad_2_2_"
            fill="#FFFFFF"
            d="M297.8,45c6.7-20.4-16.1-23.9-35.2-23.9c-26.9,0-46.1,6.1-54,25.6c-0.8,2-1.4,4-1.6,6.1h-23.8 L195,24h-11.6l-11.8,28.8h-49.9L169,24.1h-38L92.8,49.2L103.1,24H75L45.5,96h28.1l7.6-18.6l14.3-8.6l9.3,27.2h34.7l-13.8-33h41.8 L154,96h11.5L179,63h33.1c3.1,1.9,7.5,3.1,13.2,3.8l23.8,3c6.6,0.8,8.9,1.9,7.4,5.7c-2.1,5.2-9.2,6.4-15.4,6.4 c-6.1,0-9.6-0.8-11.6-2.3c-2-1.3-2.2-3.5-1.5-6.1h-32.6c-8.1,21.8,17.4,25.3,37.3,25.3c29.8,0,49.2-8,56.1-24.9 c5.7-14.1-1.5-20-20-22.2L245.6,49c-6.8-0.8-7.9-2.8-7-5c2-4.9,7.5-6.8,15.6-6.8c3.6,0,7.1,0.4,9.4,1.6c2.4,1.1,3.5,3,2.6,6.1h31.6 V45z"
          />
        </g>
      </svg>
      {!isCurrentPage("/ListPage") ? (
        <button
          className="ml-4 px-4 py-2 text-darkBlue font-medium"
          onClick={() => {
            void router.push("/ListPage");
          }}
        >
          View Use Cases
        </button>
      ) : (
        null
      )}
    </nav>
  );
}
