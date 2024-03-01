import UseCaseTable from '~/components/ListPage/UseCaseTable';
import Layout from '../components/Layout';

export default function ListPage() {
  return (
    <main className='min-h-screen overflow-x-hidden'>
      <Layout>
        <UseCaseTable />
      </Layout>
    </main>
  );
}
