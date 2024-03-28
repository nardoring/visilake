import Layout from '../components/Layout';
import Form from '../components/Form/Form';
import { ToastContainer } from 'react-toastify';
import HelpAccordion from '~/components/Help/HelpAccordion';
import { Typography } from '@mui/material';

export default function FormPage() {
  return (
    <>
      <main className='min-h-screen overflow-x-hidden'>
        <Layout>
          <Form />
          <div className='px-12 pt-6 pb-12 rounded border border-slate-400 bg-veryLightGrey p-4 font-medium shadow-md mt-10 mx-4'>
            <Typography
              className='text-bold text-center text-black'
              variant='h4'
              sx={{ fontWeight: 'bold' }}
            >
              Additional Information
            </Typography>
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
