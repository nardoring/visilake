import UseCaseTable from "~/components/ListPage/UseCaseTable";
import Background from "../components/Background";
import Navbar from "../components/Navbar";

export default function ListPage() {
  return (
    <main className="grid-container min-h-screen">
      <Background>
        <Navbar />
        <UseCaseTable />
      </Background>
    </main>
  );
}
