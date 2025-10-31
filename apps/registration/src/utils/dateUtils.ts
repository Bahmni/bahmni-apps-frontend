import { isSameDay, isBefore, isAfter } from 'date-fns';

/*
dateComparator utility function is to compare a given date string with today's date
based on the specified timeframe: 'past', 'today', or 'future'.
*/

export const dateComparator = (
  dateFrom: string,
  timeframe: string,
): boolean => {
  const today = new Date();
  const givenDate = new Date(dateFrom);

  const comparator = {
    today: () => isSameDay(givenDate, today),
    past: () => isBefore(givenDate, today),
    future: () => isAfter(givenDate, today),
  };

  return comparator[timeframe as keyof typeof comparator]();
};
