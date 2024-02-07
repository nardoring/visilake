export function formatDate(rawDate: Date) {
  const dateObject = new Date(rawDate);

  const optionsDate: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  const optionsTime: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  const formattedDate = dateObject.toLocaleString([], optionsDate) + " " + dateObject.toLocaleTimeString([], optionsTime);
  
  return formattedDate;
}
