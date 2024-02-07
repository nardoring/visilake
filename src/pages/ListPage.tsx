import UseCaseTable from "~/components/ListPage/UseCaseTable";
import Navbar from "../components/Navbar";

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