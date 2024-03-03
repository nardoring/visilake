import JobViewBox from '~/components/View/JobViewBox';
import Layout from '../components/Layout';

export default function ListPage() {
  return (
    <main className='min-h-screen overflow-x-hidden'>
      <Layout>
        <JobViewBox />
      </Layout>
    </main>
  );
}
