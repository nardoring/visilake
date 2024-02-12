import JobViewBox from "~/components/View/JobViewBox";
import Background from "../components/Background";
import Navbar from "../components/Navbar";

export default function ListPage() {
  return (
    <>
      <Background />
      <main className="grid-container min-h-screen">
        <Navbar />
        <JobViewBox />
      </main>
    </>
  );
}
