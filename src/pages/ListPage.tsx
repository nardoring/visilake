import UseCaseTable from "~/components/ListPage/UseCaseTable";
import Background from "../components/Background";
import Navbar from "../components/Navbar";
import { ToastContainer } from "react-toastify";

export default function ListPage() {
  return (
    <main className="min-h-screen">
      <Background>
        <UseCaseTable />
      </Background>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </main>
  );
}
