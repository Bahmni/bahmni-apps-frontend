import { DAYS_OF_WEEK } from '../../../../constants';
import { AvailabilityRow } from '../../../../stores';

export const defaultRow: AvailabilityRow = {
  id: 'row-1',
  startTime: '',
  startMeridiem: 'AM',
  endTime: '',
  endMeridiem: 'AM',
  isEndTimeUserSet: false,
  maxLoad: null,
  daysOfWeek: [...DAYS_OF_WEEK],
  errors: {},
};
