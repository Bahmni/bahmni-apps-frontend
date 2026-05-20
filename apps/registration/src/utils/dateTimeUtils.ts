export const convertTimeToISODateTime = (
  dateString: string,
  timeString: string | null,
): string | null => {
  if (!timeString) {
    return null;
  }

  if (timeString.includes('T')) {
    return timeString;
  }

  const date = new Date(`${dateString}T${timeString}:00`);
  return date.toISOString();
};
