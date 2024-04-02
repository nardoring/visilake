import JobViewBox from '~/components/View/JobViewBox';
import Layout from '../../components/Layout';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Job } from '~/models/domain/job';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/utils/api';

export default function ListPage() {
  const router = useRouter();

  const [job, setJob] = useState<Job>();

  const [jobId, setJobId] = useState<string | undefined>();

  api.job.getJob.useQuery(
    { jobId: jobId ?? '' },
    {
      enabled: jobId != null && !job,
      onSuccess: () => {
        setJob(job);
      },
    }
  );

  useEffect(() => {
    const storedItemData = localStorage.getItem('itemData');
    if (storedItemData) {
      setJob(JSON.parse(storedItemData));
    } else {
    }
  }, [router.query.id]);

  return (
    <main className='min-h-screen overflow-x-hidden'>
      <Layout>{job ? <JobViewBox job={job} /> : 'Loading...'}</Layout>
    </main>
  );
}
