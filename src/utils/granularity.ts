export const granularityData = [
  { value: 1, label: "1ms" },
  { value: 5, label: "5ms" },
  { value: 10, label: "10ms" },
  { value: 100, label: "100ms" },
  { value: 1000, label: "1s" },
  { value: 1000 * 60, label: "1m" },
  { value: 1000 * 60 * 60, label: "1h" },
  { value: 1000 * 60 * 60 * 24, label: "1day" },
];

export default function getGranularityLabel(granularity: number) {
  const granularityValue = granularityData.find((data) => data.value === granularity);
  if (granularityValue) {
    return granularityValue.label;
  }
  return "ERROR";
}
