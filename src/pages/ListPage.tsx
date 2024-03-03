import JobTable from '~/components/ListPage/JobTable';
import Layout from '../components/Layout';

export default function ListPage() {
  return (
    <main className='min-h-screen overflow-x-hidden'>
      <Layout>
        <JobTable />
      </Layout>
    </main>
  );
}
