import type { Job } from '~/models/domain/job';
import type { JobStatus } from '~/models/domain/jobStatus';

const mockAuthorNames = [
  'Emily Johnson',
  'James Mitchell',
  'Sophia Turner',
  'Benjamin Hayes',
  'Olivia Bennett',
];

function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function generateMockJobs(count: number): Job[] {
  const mockResponse: Job[] = [];

  for (let i = 1; i <= count; i++) {
    const analysisTypes = [
      'Rolling Mean',
      'Autocorrelation',
      'Rolling Std Deviation',
    ];

    const sourceNames = [
      'TAG-12345',
      'TAG-67891',
      'TAG-23456',
      'TAG-78912',
      'TAG-34567',
    ];

    const job: Job = {
      jobId: generateRandomString(10),
      jobName: `Job ${i}`,
      date: getRandomDate(new Date(2023, 8, 1), new Date(2024, 3, 3)),
      jobDescription: `This is a test for job ${i}. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`,
      jobStatus: getRandomStatus(),
      powerBILink: `https://app.powerbi.com/groups/me/reports/{ReportId}/ReportSection?filter=TableName/FieldName eq 'value${i}'`,
      author: mockAuthorNames[Math.floor(Math.random() * 5)] ?? 'Jane Doe',
      analysisTypes: analysisTypes.slice(
        0,
        Math.floor(Math.random() * 3 - 0.001) + 1
      ),
      sources: sourceNames.slice(0, Math.floor(Math.random() * 5 - 0.001) + 1),
    };

    mockResponse.push(job);
  }

  return mockResponse;
}

function getRandomDate(startDate: Date, endDate: Date): Date {
  const startMillis = startDate.getTime();
  const endMillis = endDate.getTime();
  const randomMillis = startMillis + Math.random() * (endMillis - startMillis);
  return new Date(randomMillis);
}

function getRandomStatus(): JobStatus {
  const statusOptions = ['COMPLETE', 'PROCESSING', 'QUEUED', 'FAILED'];
  const randomIndex = Math.floor(Math.random() * statusOptions.length);
  return statusOptions[randomIndex] as JobStatus;
}

export default generateMockJobs;
