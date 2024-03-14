export type JobStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETE'
  | 'FAILED';

export const statusOrder: { [key in JobStatus]: number } = {
  PENDING: 1,
  QUEUED: 2,
  PROCESSING: 3,
  COMPLETE: 4,
  FAILED: 5,
};
