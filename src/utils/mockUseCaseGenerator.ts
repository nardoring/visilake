import type { UseCase } from '~/models/domain/useCase';
import type { UseCaseStatus } from '~/models/domain/useCaseStatus';

const mockAuthorNames = [
  'Emily Johnson',
  'James Mitchell',
  'Sophia Turner',
  'Benjamin Hayes',
  'Olivia Bennett',
];

function generateMockUseCases(count: number): UseCase[] {
  const mockResponse: UseCase[] = [];

  for (let i = 1; i <= count; i++) {
    const analysisTypes = [
      'Rolling Mean',
      'Autocorrelation',
      'Rolling Std Deviation',
    ];
    const useCase: UseCase = {
      useCaseName: `Job ${i}`,
      date: getRandomDate(new Date(2023, 8, 1), new Date(2024, 1, 15)),
      useCaseDescription: `Test for job ${i}. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`,
      useCaseStatus: getRandomStatus(),
      powerBILink: `https://app.powerbi.com/groups/me/reports/{ReportId}/ReportSection?filter=TableName/FieldName eq 'value${i}'`,
      author: mockAuthorNames[Math.floor(Math.random() * 5)] ?? 'Jane Doe',
      analysisTypes: analysisTypes.slice(
        0,
        Math.floor(Math.random() * 3 - 0.001) + 1
      ),
    };

    mockResponse.push(useCase);
  }

  return mockResponse;
}

function getRandomDate(startDate: Date, endDate: Date): Date {
  const startMillis = startDate.getTime();
  const endMillis = endDate.getTime();
  const randomMillis = startMillis + Math.random() * (endMillis - startMillis);
  return new Date(randomMillis);
}

function getRandomStatus(): UseCaseStatus {
  const statusOptions = ['Complete', 'InProgress', 'NotStarted', 'Failed'];
  const randomIndex = Math.floor(Math.random() * statusOptions.length);
  return statusOptions[randomIndex] as UseCaseStatus;
}

export default generateMockUseCases;
