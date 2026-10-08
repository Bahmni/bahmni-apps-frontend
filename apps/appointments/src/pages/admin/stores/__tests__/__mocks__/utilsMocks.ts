import { AvailabilityRow } from '../../models';

export const makeRow = (
  overrides: Partial<AvailabilityRow> = {},
): AvailabilityRow => ({
  id: 'row-1',
  startTime: '',
  startMeridiem: 'AM',
  endTime: '',
  endMeridiem: 'AM',
  isEndTimeUserSet: false,
  maxLoad: null,
  daysOfWeek: [],
  errors: {},
  ...overrides,
});
