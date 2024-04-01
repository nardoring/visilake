import { Job } from '~/models/domain/job';

interface JobViewBoxProps {
  job: Job;
}

export default function JobViewBox({ job }: JobViewBoxProps) {
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

        <div
          className='pointer-events-none absolute inset-0 z-50 flex
                        items-center justify-center'
        >
          <div className='text-18xl font-bold text-gray-400/30'>Mockup</div>
        </div>

        <iframe
          src='/mockup-view.html'
          title='HTML Content'
          className='min-h-screen w-full'
          style={{ pointerEvents: 'auto' }}
        ></iframe>
      </div>
    </div>
  );
}
