import { generateId } from '@bahmni/services';
import { DAYS_OF_WEEK } from '../../constants';
import { DayOfWeek } from '../models';
import {
  createRow,
  findOverlappingRowIds,
  toggleRowDay,
  updateRowField,
  validateRow,
} from '../utils';
import { makeRow } from './__mocks__/utilsMocks';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  generateId: jest.fn(),
}));

describe('createRow', () => {
  beforeEach(() => {
    (generateId as jest.Mock).mockReturnValue('row-1');
  });

  it.each([
    { allDaysSelected: false, expectedDays: [] },
    { allDaysSelected: true, expectedDays: [...DAYS_OF_WEEK] },
  ])(
    'should create a row with daysOfWeek=$expectedDays when allDaysSelected=$allDaysSelected',
    ({ allDaysSelected, expectedDays }) => {
      const row = createRow(allDaysSelected);

      expect(row.daysOfWeek).toEqual(expectedDays);
    },
  );
});

describe('updateRowField', () => {
  it('should return the same row reference when id does not match', () => {
    const row = makeRow({ id: 'row-1' });

    expect(updateRowField(row, 'row-2', 'startTime', '9:00', null)).toBe(row);
  });

  describe('startTime', () => {
    it('should update startTime and clear startTime and overlap errors', () => {
      const row = makeRow({
        errors: {
          startTime: 'ADMIN_ADD_SERVICE_VALIDATION_START_TIME_REQUIRED',
          overlap: 'ADMIN_ADD_SERVICE_VALIDATION_OVERLAP',
        },
      });

      const result = updateRowField(row, 'row-1', 'startTime', '9:00', null);

      expect(result.startTime).toBe('9:00');
      expect(result.errors.startTime).toBeUndefined();
      expect(result.errors.overlap).toBeUndefined();
    });

    it.each([
      {
        scenario: 'same meridiem — no crossing',
        startTime: '09:00',
        startMeridiem: 'AM' as const,
        durationMins: 30,
        expectedEndTime: '09:30',
        expectedEndMeridiem: 'AM',
      },
      {
        scenario: 'AM to PM crossing at noon',
        startTime: '11:40',
        startMeridiem: 'AM' as const,
        durationMins: 30,
        expectedEndTime: '12:10',
        expectedEndMeridiem: 'PM',
      },
      {
        scenario: 'PM to AM crossing at midnight',
        startTime: '11:50',
        startMeridiem: 'PM' as const,
        durationMins: 30,
        expectedEndTime: '12:20',
        expectedEndMeridiem: 'AM',
      },
    ])(
      'should auto-compute endTime when durationMins is set and endTime is not user-set ($scenario)',
      ({
        startTime,
        startMeridiem,
        durationMins,
        expectedEndTime,
        expectedEndMeridiem,
      }) => {
        const result = updateRowField(
          makeRow({ startMeridiem }),
          'row-1',
          'startTime',
          startTime,
          durationMins,
        );

        expect(result.endTime).toBe(expectedEndTime);
        expect(result.endMeridiem).toBe(expectedEndMeridiem);
      },
    );

    it.each([
      {
        scenario: 'durationMins is null',
        rowOverrides: {},
        startTime: '09:00',
        durationMins: null,
        expectedEndTime: '',
      },
      {
        scenario: 'startTime is not a complete time',
        rowOverrides: {},
        startTime: '9',
        durationMins: 30,
        expectedEndTime: '',
      },
      {
        scenario: 'endTime is user-set',
        rowOverrides: { isEndTimeUserSet: true, endTime: '10:00' },
        startTime: '09:00',
        durationMins: 30,
        expectedEndTime: '10:00',
      },
    ])(
      'should not auto-compute endTime when $scenario',
      ({ rowOverrides, startTime, durationMins, expectedEndTime }) => {
        expect(
          updateRowField(
            makeRow(rowOverrides),
            'row-1',
            'startTime',
            startTime,
            durationMins,
          ).endTime,
        ).toBe(expectedEndTime);
      },
    );
  });

  describe('endTime', () => {
    it('should update endTime, clear endTime and overlap errors, and set isEndTimeUserSet correctly', () => {
      const row = makeRow({
        errors: {
          endTime: 'ADMIN_ADD_SERVICE_VALIDATION_END_TIME_REQUIRED',
          overlap: 'ADMIN_ADD_SERVICE_VALIDATION_OVERLAP',
        },
      });

      const withTime = updateRowField(row, 'row-1', 'endTime', '10:00', null);
      expect(withTime.endTime).toBe('10:00');
      expect(withTime.isEndTimeUserSet).toBe(true);
      expect(withTime.errors.endTime).toBeUndefined();
      expect(withTime.errors.overlap).toBeUndefined();

      const withEmpty = updateRowField(row, 'row-1', 'endTime', '', null);
      expect(withEmpty.isEndTimeUserSet).toBe(false);
    });
  });

  describe('startMeridiem / endMeridiem', () => {
    it.each(['startMeridiem', 'endMeridiem'] as const)(
      'should update %s and clear endTime and overlap errors',
      (field) => {
        const row = makeRow({
          errors: {
            endTime: 'ADMIN_ADD_SERVICE_VALIDATION_END_TIME_AFTER_START',
            overlap: 'ADMIN_ADD_SERVICE_VALIDATION_OVERLAP',
          },
        });

        const result = updateRowField(row, 'row-1', field, 'PM', null);

        expect(result[field]).toBe('PM');
        expect(result.errors.endTime).toBeUndefined();
        expect(result.errors.overlap).toBeUndefined();
      },
    );
  });

  it('should update maxLoad', () => {
    expect(
      updateRowField(makeRow(), 'row-1', 'maxLoad', 10, null).maxLoad,
    ).toBe(10);
  });
});

describe('toggleRowDay', () => {
  it('should return the same row reference when rowId does not match', () => {
    const row = makeRow({ id: 'row-1' });

    expect(toggleRowDay(row, 'row-2', 'MONDAY')).toBe(row);
  });

  it.each([
    {
      scenario: 'adding a day when none are selected',
      initialDays: [] as DayOfWeek[],
      day: 'MONDAY' as DayOfWeek,
      expectedDays: ['MONDAY'] as DayOfWeek[],
      expectedDaysOfWeekError: undefined,
    },
    {
      scenario: 'removing a day when more remain',
      initialDays: ['MONDAY', 'TUESDAY'] as DayOfWeek[],
      day: 'MONDAY' as DayOfWeek,
      expectedDays: ['TUESDAY'] as DayOfWeek[],
      expectedDaysOfWeekError: undefined,
    },
    {
      scenario: 'removing the last selected day',
      initialDays: ['MONDAY'] as DayOfWeek[],
      day: 'MONDAY' as DayOfWeek,
      expectedDays: [] as DayOfWeek[],
      expectedDaysOfWeekError:
        'ADMIN_ADD_SERVICE_VALIDATION_DAYS_OF_WEEK_REQUIRED',
    },
  ])(
    'should toggle day and update errors when $scenario',
    ({ initialDays, day, expectedDays, expectedDaysOfWeekError }) => {
      const row = makeRow({
        daysOfWeek: initialDays,
        errors: {
          daysOfWeek: 'ADMIN_ADD_SERVICE_VALIDATION_DAYS_OF_WEEK_REQUIRED',
          overlap: 'ADMIN_ADD_SERVICE_VALIDATION_OVERLAP',
        },
      });

      const result = toggleRowDay(row, 'row-1', day);

      expect(result.daysOfWeek).toEqual(expectedDays);
      expect(result.errors.daysOfWeek).toBe(expectedDaysOfWeekError);
      expect(result.errors.overlap).toBeUndefined();
    },
  );
});

describe('validateRow', () => {
  it.each([
    {
      scenario: 'startTime is empty',
      rowOverride: {},
      errorField: 'startTime' as const,
      expectedError: 'ADMIN_ADD_SERVICE_VALIDATION_START_TIME_REQUIRED',
    },
    {
      scenario: 'endTime is empty',
      rowOverride: { startTime: '9:00' },
      errorField: 'endTime' as const,
      expectedError: 'ADMIN_ADD_SERVICE_VALIDATION_END_TIME_REQUIRED',
    },
    {
      scenario: 'endTime is not after startTime',
      rowOverride: { startTime: '10:00', endTime: '9:00' },
      errorField: 'endTime' as const,
      expectedError: 'ADMIN_ADD_SERVICE_VALIDATION_END_TIME_AFTER_START',
    },
    {
      scenario: 'daysOfWeek is empty',
      rowOverride: { startTime: '9:00', endTime: '10:00' },
      errorField: 'daysOfWeek' as const,
      expectedError: 'ADMIN_ADD_SERVICE_VALIDATION_DAYS_OF_WEEK_REQUIRED',
    },
  ])(
    'should return rowIsValid false and set $errorField error when $scenario',
    ({ rowOverride, errorField, expectedError }) => {
      const { row: validatedRow, rowIsValid } = validateRow(
        makeRow(rowOverride),
      );

      expect(rowIsValid).toBe(false);
      expect(validatedRow.errors[errorField]).toBe(expectedError);
    },
  );

  it('should return rowIsValid true with no errors when all fields are valid', () => {
    const { row: validatedRow, rowIsValid } = validateRow(
      makeRow({ startTime: '9:00', endTime: '10:00', daysOfWeek: ['MONDAY'] }),
    );

    expect(rowIsValid).toBe(true);
    expect(validatedRow.errors).toEqual({});
  });
});

describe('findOverlappingRowIds', () => {
  const makeValidRow = (overrides: Parameters<typeof makeRow>[0]) =>
    makeRow({
      startTime: '9:00',
      endTime: '11:00',
      daysOfWeek: ['MONDAY'],
      ...overrides,
    });

  it('should return ids of rows whose time ranges and days overlap', () => {
    const result = findOverlappingRowIds([
      makeValidRow({ id: 'row-1' }),
      makeValidRow({ id: 'row-2', startTime: '10:00', endTime: '11:30' }),
    ]);

    expect(result).toContain('row-1');
    expect(result).toContain('row-2');
  });

  it.each([
    {
      scenario: 'times are adjacent',
      row2: { id: 'row-2', startTime: '11:00', endTime: '12:00' },
    },
    {
      scenario: 'no common days',
      row2: {
        id: 'row-2',
        startTime: '10:00',
        endTime: '11:30',
        daysOfWeek: ['TUESDAY'],
      },
    },
  ])('should return an empty set when $scenario', ({ row2 }) => {
    expect(
      findOverlappingRowIds([makeValidRow({ id: 'row-1' }), makeValidRow(row2)])
        .size,
    ).toBe(0);
  });
});
