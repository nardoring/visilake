import Background from "../components/Background";
import Form from "../components/Form/Form";
import Navbar from "../components/Navbar";


export default function FormPage() {
  return (
    <>
      <main className="min-h-screen grid-container">
        <Background />
        <Navbar />
        <Form />
      </main>
    </>
  );
}
