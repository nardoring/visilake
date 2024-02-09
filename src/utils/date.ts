export function formatDate(rawDate: Date) {
  const dateObject = new Date(rawDate);

  const optionsDate: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };

  const optionsTime: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };

  // 'en-US' to ensure consistent formatting with leading zeros
  const formattedDate =
    dateObject.toLocaleDateString("en-US", optionsDate) +
    " " +
    dateObject.toLocaleTimeString("en-US", optionsTime);

  return formattedDate;
}
