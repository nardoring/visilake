import JobViewBox from '~/components/View/JobViewBox';
import Layout from '../../components/Layout';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Job } from '~/models/domain/job';
import { api } from '~/utils/api';

export default function ListPage() {
  const router = useRouter();

  const [job, setJob] = useState<Job>();

  const [jobId, setJobId] = useState<string | undefined>();

  api.job.getJob.useQuery(
    { jobId: jobId ?? '' },
    {
      enabled: jobId != null && !job,
      onSuccess: (data) => {
        setJob(data);
      },
    }
  );

  useEffect(() => {
    const id = Array.isArray(router.query.id)
      ? router.query.id[0]
      : router.query.id;

    const storedItemData = localStorage.getItem('itemData');
    if (storedItemData) {
      setJob((JSON.parse(storedItemData) as Job[]).find((j) => j.jobId == id));
    } else {
      setJobId(id);
    }
  }, [router.query.id]);

  return (
    <main className='min-h-screen overflow-x-hidden'>
      <Layout>{job ? <JobViewBox job={job} /> : 'Loading...'}</Layout>
    </main>
  );
}
