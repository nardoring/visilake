import UseCaseTable from "~/components/ListPage/UseCaseTable";
import Background from "../components/Background";
import Navbar from "../components/Navbar";

export default function ListPage() {
  return (
    <main className="min-h-screen">
      <Background>
        <UseCaseTable />
      </Background>
    </main>
  );
}
