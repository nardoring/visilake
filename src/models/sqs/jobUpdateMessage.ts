import { JobStatus } from '../domain/jobStatus';

export type JobUpdateMessage = {
  status: JobStatus;
  request_id: string;
};
