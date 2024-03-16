import Layout from '../components/Layout';
import Form from '../components/Form/Form';
import { ToastContainer } from 'react-toastify';
import HelpAccordion from '~/components/HelpPage/HelpAccordion';

export default function FormPage() {
  return (
    <>
      <main className='min-h-screen overflow-x-hidden'>
        <Layout>
          <Form />
          <div className='px-4 pt-4'>
            <HelpAccordion />
          </div>
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
