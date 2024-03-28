import Layout from '../components/Layout';
import AthenaQueryComponent from '~/components/Athena';

export default function AthenaTestPage() {
  return (
    <main className='min-h-screen overflow-x-hidden'>
      <Layout>
        <AthenaQueryComponent />
      </Layout>
    </main>
  );
}
