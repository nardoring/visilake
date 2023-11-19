import UseCaseTable from "~/components/ListPage/UseCaseTable";
import Navbar from "../components/Navbar";
import SearchBar from "~/components/ListPage/SearchBar";

export default function ListPage() {
  return (
    <>
      <main className="min-h-screen bg-lightGrey">
        <Navbar />
        <UseCaseTable/>
      </main>
    </>
  );
}