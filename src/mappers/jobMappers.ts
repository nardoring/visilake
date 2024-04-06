import type { Job } from '~/models/domain/job';
import type { JobStatus } from '~/models/domain/jobStatus';
import type { Job as DatabaseJob } from '~/models/db/job';

export function mapJobs(output: DatabaseJob[]): Job[] {
  return output.map((o) => mapJob(o));
}

export function mapJob(job: DatabaseJob): Job {
  console.log(job);

  return {
    jobName: job.jobName.S,
    date: new Date(Number(job.creationDate.N)),
    jobDescription: job.jobDescription.S,
    jobStatus: job.jobStatus.S as JobStatus,
    powerBILink: job.powerBILink.S,
    author: job.author.S,
    analysisTypes: job.analysisTypes.L.map((t) => t.S),
    sources: job.sources.L.map((t) => t.S),
    dateRangeStart: new Date(Number(job.dateRangeStart.N)),
    dateRangeEnd: new Date(Number(job.dateRangeEnd.N)),
    granularity: Number(job.granularity.N),
    jobId: job.requestID.S,
  } as Job;
}
