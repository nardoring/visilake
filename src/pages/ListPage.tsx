import JobTable from '~/components/ListPage/JobTable';
import Navbar from '../components/Navbar';

export default function ListPage() {
  return (
    <>
      <main className='min-h-screen bg-lightGrey'>
        <Navbar />
        <JobTable />
      </main>
    </>
  );
}
