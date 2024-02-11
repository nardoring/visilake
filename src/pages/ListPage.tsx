import UseCaseTable from "~/components/ListPage/UseCaseTable";
import Background from "../components/Background";
import Navbar from "../components/Navbar";

export default function ListPage() {
  return (
    <>
      <Background />
      <main className="min-h-screen grid-container">
        <Navbar />
        <UseCaseTable />
      </main>
    </>
  );
}
