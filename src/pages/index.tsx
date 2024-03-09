import Layout from '../components/Layout';
import Form from '../components/Form/Form';
import { ToastContainer } from 'react-toastify';

export default function FormPage() {
  return (
    <>
      <main className='min-h-screen overflow-x-hidden'>
        <Layout>
          <Form />
          <ToastContainer
            position='bottom-right'
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme='light'
          />
        </Layout>
      </main>
    </>
  );
}
