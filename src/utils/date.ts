export function formatDate(rawDate: Date) {
  const dateObject = new Date(rawDate);
  const formattedTime = dateObject.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const formattedDate = `${dateObject.getFullYear()}/${(
    dateObject.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}/${dateObject.getDate().toString().padStart(2, "0")}`;
  return `${formattedTime} ${formattedDate}`;
}
