import type { JobStatus as JobStatus } from './jobStatus';

export interface Job {
  jobName: string;
  date: Date;
  jobDescription: string;
  jobStatus: JobStatus;
  powerBILink: string;
  author: string;
  analysisTypes: string[];
  sources: string[];
  dateRangeStart: Date;
  dateRangeEnd: Date;
  granularity: number;
}
