const fs = require('fs');
const path = require('path');

const NUM_OF_ITEMS = 25;

function generateMockJobs(count, outputFilePath) {
  const mockRequests = [];

  const availableAnalysisTypes = [
    'Rolling Mean',
    'Rolling Std Deviation',
    'Autocorrelation',
  ];

  for (let i = 1; i <= count; i++) {
    const input = {
      jobName: `Job ${i}`,
      jobDescription: `This is a test for job ${i}`,
      analysisTypeNames: getRandomAnalysisTypes(availableAnalysisTypes),
    };

    const item = {
      requestID: i.toString(),
      id: getRandomId(),
      creationDate: getRandomDate().toString(),
      jobStatus: getRandomStatus(),
      jobName: input.jobName,
      jobDescription: input.jobDescription,
      author: getRandomAuthor(),
      analysisTypes: {
        L: input.analysisTypeNames.map((id) => ({ S: id.toString() })),
      },
      powerBILink:
        "https://app.powerbi.com/groups/me/reports/{ReportId}/ReportSection?filter=TableName/FieldName eq 'value'",
    };

    mockRequests.push(item);
  }

  const jsonString = JSON.stringify(mockRequests, null, 2);
  fs.writeFileSync(outputFilePath, jsonString, 'utf-8');
}

function getRandomId() {
  const timestamp = new Date().getTime().toString(36);
  const randomChars = Math.random().toString(36).substr(2, 5);
  return timestamp + randomChars;
}

function getRandomAnalysisTypes(availableTypes) {
  const numberOfTypes = Math.floor(Math.random() * availableTypes.length) + 1;
  const shuffledTypes = availableTypes.sort(() => Math.random() - 0.5);
  return shuffledTypes.slice(0, numberOfTypes);
}

function getRandomStatus() {
  const statusOptions = ['Complete', 'InProgress', 'NotStarted', 'Failed'];
  const randomIndex = Math.floor(Math.random() * statusOptions.length);
  return statusOptions[randomIndex];
}

function getRandomDate() {
  const startMillis = new Date(2023, 8, 1).getTime();
  const endMillis = new Date(2024, 1, 15).getTime();
  return Math.floor(startMillis + Math.random() * (endMillis - startMillis));
}

function getRandomAuthor() {
  const mockAuthorNames = [
    'Emily Johnson',
    'James Mitchell',
    'Sophia Turner',
    'Benjamin Hayes',
    'Olivia Bennett',
  ];
  return (
    mockAuthorNames[Math.floor(Math.random() * mockAuthorNames.length)] ??
    'Jane Doe'
  );
}

const mockDataDirectory = path.resolve(__dirname, '../../infra/mockdata/');
const outputFilePath = path.join(mockDataDirectory, 'requests.json');
generateMockJobs(NUM_OF_ITEMS, outputFilePath);
