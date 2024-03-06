export function formatDate(rawDate: Date) {
  const dateObject = new Date(rawDate);

  const optionsDate: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };

  const optionsTime: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };

  const formattedDate =
    dateObject.toLocaleDateString('en-CA', optionsDate) +
    ' ' +
    dateObject.toLocaleTimeString('en-CA', optionsTime);

  return formattedDate;
}

export function validateDate(date?: Date): boolean {
  return (
    date !== undefined && !isNaN(date.getTime()) && isFinite(date.getTime()) && (date.getTime() < Date.now())
  );
}

export function validateDateRange(startDate?: Date, endDate?: Date): boolean {
  if (startDate === undefined || endDate === undefined) {
    return false;
  }

  return startDate.getTime() <= endDate.getTime();
}
