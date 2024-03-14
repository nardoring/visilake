import HelpAccordion from '~/components/HelpPage/HelpAccordion';
import Layout from '../components/Layout';

export default function ListPage() {
  return (
    <main className='min-h-screen overflow-x-hidden'>
      <Layout>
        <HelpAccordion/>
      </Layout>
    </main>
  );
}
