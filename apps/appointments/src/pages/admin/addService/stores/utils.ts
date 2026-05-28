import { addMinutesToTime, generateId, timeToMinutes } from '@bahmni/services';
import { DAYS_OF_WEEK } from '../constants';
import { AvailabilityRow, DayOfWeek, UpdateField } from './models';

const isValidTime = (time: string): boolean => /^\d{1,2}:\d{2}$/.test(time);

const isEndTimeAfterStartTime = (
  startTime: string,
  startMeridiem: 'AM' | 'PM',
  endTime: string,
  endMeridiem: 'AM' | 'PM',
): boolean =>
  timeToMinutes(endTime, endMeridiem) > timeToMinutes(startTime, startMeridiem);

export const createRow = (allDaysSelected = false): AvailabilityRow => ({
  id: generateId(),
  startTime: '',
  startMeridiem: 'AM',
  endTime: '',
  endMeridiem: 'AM',
  isEndTimeUserSet: false,
  maxLoad: null,
  daysOfWeek: allDaysSelected ? [...DAYS_OF_WEEK] : [],
  errors: {},
});

export const updateRowField = (
  row: AvailabilityRow,
  id: string,
  field: UpdateField,
  value: string | number | null,
  durationMins: number | null,
): AvailabilityRow => {
  if (row.id !== id) return row;
  const errors = { ...row.errors };

  if (field === 'startTime') {
    delete errors.startTime;
    delete errors.overlap;
    const newStartTime = value as string;
    if (
      !row.isEndTimeUserSet &&
      durationMins !== null &&
      isValidTime(newStartTime)
    ) {
      const { time: endTime, meridiem: endMeridiem } = addMinutesToTime(
        newStartTime,
        row.startMeridiem,
        durationMins,
      );
      return { ...row, startTime: newStartTime, endTime, endMeridiem, errors };
    }
    return { ...row, startTime: newStartTime, errors };
  }

  if (field === 'endTime') {
    delete errors.endTime;
    delete errors.overlap;
    const isEndTimeUserSet =
      typeof value === 'string' && value.trim() !== '' && isValidTime(value);
    return { ...row, endTime: value as string, isEndTimeUserSet, errors };
  }

  if (field === 'startMeridiem' || field === 'endMeridiem') {
    delete errors.endTime;
    delete errors.overlap;
    return { ...row, [field]: value, errors };
  }

  return { ...row, maxLoad: value as number | null, errors };
};

export const toggleRowDay = (
  row: AvailabilityRow,
  rowId: string,
  day: DayOfWeek,
): AvailabilityRow => {
  if (row.id !== rowId) return row;
  const daysOfWeek = row.daysOfWeek.includes(day)
    ? row.daysOfWeek.filter((d) => d !== day)
    : [...row.daysOfWeek, day];
  const errors = { ...row.errors };
  if (daysOfWeek.length > 0) delete errors.daysOfWeek;
  delete errors.overlap;
  return { ...row, daysOfWeek, errors };
};

const hasCommonDays = (row1: AvailabilityRow, row2: AvailabilityRow): boolean =>
  row1.daysOfWeek.some((day) => row2.daysOfWeek.includes(day));

const hasOverlappingTimes = (
  row1: AvailabilityRow,
  row2: AvailabilityRow,
): boolean =>
  timeToMinutes(row1.startTime, row1.startMeridiem) <
    timeToMinutes(row2.endTime, row2.endMeridiem) &&
  timeToMinutes(row2.startTime, row2.startMeridiem) <
    timeToMinutes(row1.endTime, row1.endMeridiem);

export const findOverlappingRowIds = (rows: AvailabilityRow[]): Set<string> =>
  new Set(
    rows
      .filter((row) =>
        rows.some(
          (other) =>
            other.id !== row.id &&
            hasCommonDays(row, other) &&
            hasOverlappingTimes(row, other),
        ),
      )
      .map((row) => row.id),
  );

export const validateRow = (
  row: AvailabilityRow,
): { row: AvailabilityRow; rowIsValid: boolean } => {
  const errors: AvailabilityRow['errors'] = {};
  let rowIsValid = true;

  if (!row.startTime.trim()) {
    errors.startTime = 'ADMIN_ADD_SERVICE_VALIDATION_START_TIME_REQUIRED';
    rowIsValid = false;
  }

  if (!row.endTime.trim()) {
    errors.endTime = 'ADMIN_ADD_SERVICE_VALIDATION_END_TIME_REQUIRED';
    rowIsValid = false;
  } else if (
    row.startTime.trim() &&
    !isEndTimeAfterStartTime(
      row.startTime,
      row.startMeridiem,
      row.endTime,
      row.endMeridiem,
    )
  ) {
    errors.endTime = 'ADMIN_ADD_SERVICE_VALIDATION_END_TIME_AFTER_START';
    rowIsValid = false;
  }

  if (row.daysOfWeek.length === 0) {
    errors.daysOfWeek = 'ADMIN_ADD_SERVICE_VALIDATION_DAYS_OF_WEEK_REQUIRED';
    rowIsValid = false;
  }

  return { row: { ...row, errors }, rowIsValid };
};
