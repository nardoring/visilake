import Layout from '../components/Layout';
import Form from '../components/Form/Form';

export default function FormPage() {
  return (
    <>
      <main className='min-h-screen overflow-x-hidden'>
        <Layout>
          <Form />
        </Layout>
      </main>
    </>
  );
}
