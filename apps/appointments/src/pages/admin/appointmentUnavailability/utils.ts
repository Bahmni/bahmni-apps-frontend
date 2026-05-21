import { convertTo24HourFormat } from '@bahmni/services';

export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const dateObj = new Date();
  dateObj.setHours(parseInt(hours), parseInt(minutes));

  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const getTimeInMinutes = (timeStr: string): number | null => {
  const time24 = convertTo24HourFormat(timeStr);
  if (!time24) return null;
  const [hours, minutes] = time24.split(':').map(Number);
  return hours * 60 + minutes;
};
