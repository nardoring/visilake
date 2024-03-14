const fs = require('fs');
const path = require('path');

// pass the number of mockrequests in when you run it
// defaults to 12 to show at least 2 page on most resolutions
//   node src/dbMockJobGenerator.js 2 will produce 2 requests
const NUM_OF_ITEMS = process.argv[2] ? parseInt(process.argv[2], 10) : 12;

const sourceTagsPath = path.resolve(
  __dirname,
  '../../infra/mockdata/sourceTags.json'
);
const sourceTagsData = require(sourceTagsPath);
const availableSources = sourceTagsData.map((item) => item.sourceTag);
const descriptionSentences = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
];

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
      jobDescription: generateRandomDescription(),
      analysisTypeNames: getRandomListItem(availableAnalysisTypes),
      sourceNames: getRandomListItem(availableSources),
      dateRangeStart: getRandomDate(
        new Date(2023, 8, 1),
        new Date(2024, 0, 1)
      ).toString(),
      dateRangeEnd: getRandomDate(
        new Date(2024, 0, 2),
        new Date(2024, 2, 6)
      ).toString(),
      granularity: getRandomGranularity().toString(),
    };

    const item = {
      requestID: getRandomId(),
      id: getRandomId(),
      creationDate: getRandomDate(
        new Date(2023, 8, 1),
        new Date(2024, 2, 6)
      ).toString(),
      jobStatus: getRandomStatus(),
      jobName: input.jobName,
      jobDescription: input.jobDescription,
      author: getRandomAuthor(),
      analysisTypes: {
        L: input.analysisTypeNames.map((id) => ({ S: id.toString() })),
      },
      sources: {
        L: input.sourceNames.map((id) => ({ S: id.toString() })),
      },
      dateRangeStart: input.dateRangeStart,
      dateRangeEnd: input.dateRangeEnd,
      granularity: input.granularity,
      powerBILink:
        "https://app.powerbi.com/groups/me/reports/{ReportId}/ReportSection?filter=TableName/FieldName eq 'value'",
    };

    mockRequests.push(item);
  }

  const jsonString = JSON.stringify(mockRequests, null, 2);
  fs.writeFileSync(outputFilePath, jsonString, 'utf-8');
}

function getRandomId() {
  return Math.random().toString(36).substring(2, 10);
}

function generateRandomDescription() {
  const sentenceCount =
    Math.floor(Math.random() * (descriptionSentences.length - 1)) + 1;
  let description = 'Test job ';
  for (let i = 0; i < sentenceCount; i++) {
    description +=
      descriptionSentences[
        Math.floor(Math.random() * descriptionSentences.length)
      ] + ' ';
  }
  return description.trim();
}

function getRandomListItem(availableIndexes) {
  const numberOfTypes =
    Math.floor((Math.random() * availableIndexes.length) / 2) + 1;
  const shuffledTypes = availableIndexes.sort(() => Math.random() - 0.5);
  return shuffledTypes.slice(0, numberOfTypes);
}

function getRandomStatus() {
  const statusOptions = [
    'PENDING',
    'QUEUED',
    'PROCESSING',
    'COMPLETE',
    'FAILED',
  ];
  const randomIndex = Math.floor(Math.random() * statusOptions.length);
  return statusOptions[randomIndex];
}

function getRandomDate(minDate, maxDate) {
  const startMillis = minDate.getTime();
  const endMillis = maxDate.getTime();
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

function getRandomGranularity() {
  const granularities = [
    0,
    1,
    5,
    10,
    100,
    1000,
    1000 * 60,
    1000 * 60 * 60,
    1000 * 60 * 60 * 24,
  ];

  return granularities[Math.floor(Math.random() * granularities.length)] ?? -1;
}

const mockDataDirectory = path.resolve(__dirname, '../../infra/mockdata/');
const outputFilePath = path.join(mockDataDirectory, 'requests.json');
generateMockJobs(NUM_OF_ITEMS, outputFilePath);
