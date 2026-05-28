import { DAYS_OF_WEEK } from '../../../constants';

export const defaultRow = {
  id: 'row-1',
  startTime: '',
  endTime: '',
  isEndTimeUserSet: false,
  maxLoad: null,
  daysOfWeek: [...DAYS_OF_WEEK],
  errors: {},
};
