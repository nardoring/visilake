import JobViewBox from "~/components/View/JobViewBox";
import Background from "../components/Background";
import Navbar from "../components/Navbar";

export default function ListPage() {
  return (
    <main className="min-h-screen">
      <Background>
        <JobViewBox />
      </Background>
    </main>
  );
}
