import { JobStatus } from '../domain/jobStatus';

export type JobUpdateMessage = {
  status: JobStatus;
  request_id: string;
  analysis_types: string[];
  timestamp: number;
  author: string;
  name: string;
  description: string;
};
