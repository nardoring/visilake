import JobViewBox from "~/components/View/JobViewBox";
import Background from "../components/Background";
import Navbar from "../components/Navbar";

export default function ListPage() {
  return (
    <main className="grid-container min-h-screen p-20">
      <Background>
        <Navbar />
        <JobViewBox />
      </Background>
    </main>
  );
}
