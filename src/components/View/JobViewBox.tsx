import { Job } from '~/models/domain/job';
import { api } from '~/utils/api';

interface JobViewBoxProps {
  job: Job;
}

export default function JobViewBox({ job }: JobViewBoxProps) {
  const { data: s3URL, isLoading } = api.s3.getS3Url.useQuery();

  const getS3Url = () => {
    if (job.jobStatus == 'COMPLETE') {
      return `${s3URL}metadata/${job.jobId}/${job.jobId}-eda.html`;
    } else if (job.jobStatus == 'FAILED') {
      return `${s3URL}metadata/${job.jobId}/${job.jobId}-error.log`;
    }
  };

  return (
    <div className='row-end-9 z-40 col-start-2 col-end-9 row-start-3 min-h-fit p-4'>
      <div
        className='relative z-40 mt-12 min-h-fit rounded border
                      border-slate-400 bg-veryLightGrey p-4 font-medium shadow-md'
      >
        <div className='grid grid-cols-2'>
          <div className='pl-4 pt-4'>
            <label
              htmlFor='jobName'
              className='pr-2 font-bold'
            >
              Name
            </label>
            <span className=''>{job.jobName}</span>
          </div>

          <div className='pl-4 pt-4'>
            <label
              htmlFor='authorName'
              className='pr-2 font-bold'
            >
              Author
            </label>
            <span className=''>{job.author}</span>
          </div>

          <div className='pl-4 pt-4'>
            <label
              htmlFor='dateCreated'
              className='pr-2 font-bold'
            >
              Date Created
            </label>
            <span className=''>{job.date.toLocaleDateString()}</span>
          </div>
        </div>

        <div className='py-4 pl-4'>
          <label
            htmlFor='jobDescription'
            className='pr-2 font-bold'
          >
            Description
          </label>
          <p>{job.jobDescription}</p>
        </div>

        {job.jobStatus == 'COMPLETE' ? (
          <div className='py-4 pl-4'>
            <h1 className='pr-2 font-bold'>Explorative Data Analysis</h1>
          </div>
        ) : (
          <></>
        )}

        {job.jobStatus == 'FAILED' ? (
          <div className='py-4 pl-4'>
            <h1 className='pr-2 font-bold'>Failure</h1>
          </div>
        ) : (
          <></>
        )}

        {job.jobStatus == 'COMPLETE' || job.jobStatus == 'FAILED' ? (
          isLoading ? (
            <h1>Loading data...</h1>
          ) : (
            <iframe
              src={getS3Url()}
              title='HTML Content'
              className='min-h-screen w-full'
              scrolling={`${job.jobStatus == 'COMPLETE' ? 'no' : 'yes'}`}
              style={{ pointerEvents: 'auto', outline: 'none' }}
            ></iframe>
          )
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}
