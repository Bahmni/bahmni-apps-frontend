import {
  mockAppointmentServices,
  mockAppointmentUnavailabilities,
  mockFHIRBundle,
  mockLocations,
  mockProviders,
  mockUnavailabilityFormData,
  mockUnavailabilityNoServiceNoProvider,
} from '../__mocks__/unavailabilityMock';
import {
  buildProviderItems,
  buildServiceItems,
  buildUnavailabilityRequests,
  createBaseData,
  createUnavailabilityViewModel,
  getInitialLocationUuid,
  mapFHIRBundleToLocations,
  toLocationSentinel,
  toSelectableItemSentinel,
  validateUnavailabilityForm,
} from '../utils';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  formatDateTime: jest.fn(() => ({ formattedResult: 'formatted-datetime' })),
  convertTo24HourFormat: jest.fn(),
  getTimeInMinutes: jest.fn(),
  getUserLoginLocation: jest.fn(),
}));

const { convertTo24HourFormat, getTimeInMinutes, getUserLoginLocation } =
  jest.requireMock('@bahmni/services');

const t = jest.fn((key: string) => key);

describe('utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBaseData', () => {
    it.each([
      {
        startTime: '09:00',
        startTimePeriod: 'AM' as const,
        endTime: '05:00',
        endTimePeriod: 'PM' as const,
        expectedStart: '09:00',
        expectedEnd: '17:00',
      },
      {
        startTime: '05:00',
        startTimePeriod: 'PM' as const,
        endTime: '09:00',
        endTimePeriod: 'AM' as const,
        expectedStart: '17:00',
        expectedEnd: '09:00',
      },
      {
        startTime: '12:00',
        startTimePeriod: 'AM' as const,
        endTime: '12:00',
        endTimePeriod: 'PM' as const,
        expectedStart: '00:00',
        expectedEnd: '12:00',
      },
      {
        startTime: '12:00',
        startTimePeriod: 'PM' as const,
        endTime: '11:00',
        endTimePeriod: 'PM' as const,
        expectedStart: '12:00',
        expectedEnd: '23:00',
      },
    ])(
      'should convert $startTime $startTimePeriod → $expectedStart and $endTime $endTimePeriod → $expectedEnd',
      ({
        startTime,
        startTimePeriod,
        endTime,
        endTimePeriod,
        expectedStart,
        expectedEnd,
      }) => {
        convertTo24HourFormat
          .mockReturnValueOnce(expectedStart)
          .mockReturnValueOnce(expectedEnd);

        const result = createBaseData(
          {
            locationUuid: 'location-uuid-1',
            startDate: new Date('2026-05-25'),
            startTime,
            startTimePeriod,
            endDate: new Date('2026-05-25'),
            endTime,
            endTimePeriod,
          },
          t,
        );

        expect(result.locationUuid).toBe('location-uuid-1');
        expect(result.startTime).toBe(expectedStart);
        expect(result.endTime).toBe(expectedEnd);
      },
    );
  });

  describe('validateUnavailabilityForm', () => {
    const validFormData = { ...mockUnavailabilityFormData };

    it.each([
      {
        missingField: 'locationUuid',
        override: { locationUuid: '' },
        errorKey: 'location',
      },
      {
        missingField: 'startDate',
        override: { startDate: null },
        errorKey: 'startDate',
      },
      {
        missingField: 'startTime',
        override: { startTime: '' },
        errorKey: 'startTime',
      },
      {
        missingField: 'endDate',
        override: { endDate: null },
        errorKey: 'endDate',
      },
      {
        missingField: 'endTime',
        override: { endTime: '' },
        errorKey: 'endTime',
      },
    ])(
      'should return required error when $missingField is missing',
      ({ override, errorKey }) => {
        const errors = validateUnavailabilityForm(
          { ...validFormData, ...override },
          t,
        );
        expect(errors[errorKey as keyof typeof errors]).toBe(
          'ADMIN_UNAVAILABILITY_FORM_REQUIRED',
        );
      },
    );

    it.each([
      {
        scenario: 'equal times',
        startMinutes: 540,
        endMinutes: 540,
        expectedError: 'ADMIN_UNAVAILABILITY_DATETIME_ERROR_MESSAGE',
      },
      {
        scenario: 'end time before start time',
        startMinutes: 1020,
        endMinutes: 540,
        expectedError: 'ADMIN_UNAVAILABILITY_DATETIME_ERROR_MESSAGE',
      },
      {
        scenario: 'end time after start time',
        startMinutes: 540,
        endMinutes: 1020,
        expectedError: undefined,
      },
    ])(
      'should set dateTime error to "$expectedError" when $scenario on same day',
      ({ startMinutes, endMinutes, expectedError }) => {
        getTimeInMinutes
          .mockReturnValueOnce(startMinutes)
          .mockReturnValueOnce(endMinutes);

        const errors = validateUnavailabilityForm(validFormData, t);

        expect(errors.dateTime).toBe(expectedError);
      },
    );

    it('should not validate time order when start and end are on different days', () => {
      const crossDayData = {
        ...validFormData,
        startDate: new Date('2026-05-25'),
        endDate: new Date('2026-05-26'),
      };

      const errors = validateUnavailabilityForm(crossDayData, t);

      expect(errors.dateTime).toBeUndefined();
      expect(getTimeInMinutes).not.toHaveBeenCalled();
    });

    it('should return no errors for fully valid form data', () => {
      getTimeInMinutes.mockReturnValueOnce(540).mockReturnValueOnce(1020);

      const errors = validateUnavailabilityForm(validFormData, t);

      expect(errors.location).toBeUndefined();
      expect(errors.startDate).toBeUndefined();
      expect(errors.startTime).toBeUndefined();
      expect(errors.endDate).toBeUndefined();
      expect(errors.endTime).toBeUndefined();
      expect(errors.dateTime).toBeUndefined();
    });
  });

  describe('createUnavailabilityViewModel', () => {
    it.each([
      {
        scenario: 'service and provider present',
        item: mockAppointmentUnavailabilities[0],
        expectedServiceName: 'General Medicine OPD Consultation',
        expectedProviderName: 'Dr. John Smith',
      },
      {
        scenario: 'service present but no provider',
        item: mockAppointmentUnavailabilities[1],
        expectedServiceName: 'ENT Consultation',
        expectedProviderName: 'ADMIN_UNAVAILABILITY_ALL',
      },
      {
        scenario: 'neither service nor provider',
        item: mockUnavailabilityNoServiceNoProvider,
        expectedServiceName: 'ADMIN_UNAVAILABILITY_ALL',
        expectedProviderName: 'ADMIN_UNAVAILABILITY_ALL',
      },
    ])(
      'should use fallback translation key when $scenario',
      ({ item, expectedServiceName, expectedProviderName }) => {
        const result = createUnavailabilityViewModel(item, t);

        expect(result.appointmentServiceName).toBe(expectedServiceName);
        expect(result.providerName).toBe(expectedProviderName);
      },
    );

    it('should map id, locationName, and formatted datetimes from the item', () => {
      const item = mockAppointmentUnavailabilities[0];
      const result = createUnavailabilityViewModel(item, t);

      expect(result.id).toBe(item.uuid);
      expect(result.locationName).toBe(item.location.name);
      expect(result.startDateTime).toBe('formatted-datetime');
      expect(result.endDateTime).toBe('formatted-datetime');
    });
  });

  describe('buildUnavailabilityRequests', () => {
    it.each([
      {
        scenario: 'no services or providers selected',
        selectedServiceItems: [],
        filteredServicesCount: 2,
        selectedProviderItems: [],
        availableProvidersCount: 2,
        expectedServiceUuid: undefined,
        expectedProviderUuid: undefined,
      },
      {
        scenario: 'all services selected (count matches filteredServicesCount)',
        selectedServiceItems: [
          { id: 'service-uuid-1', text: 'S1' },
          { id: 'service-uuid-2', text: 'S2' },
        ],
        filteredServicesCount: 2,
        selectedProviderItems: [],
        availableProvidersCount: 2,
        expectedServiceUuid: undefined,
        expectedProviderUuid: undefined,
      },
      {
        scenario: 'partial services selected and no providers',
        selectedServiceItems: [{ id: 'service-uuid-1', text: 'S1' }],
        filteredServicesCount: 2,
        selectedProviderItems: [],
        availableProvidersCount: 2,
        expectedServiceUuid: 'service-uuid-1',
        expectedProviderUuid: undefined,
      },
      {
        scenario: 'partial services and partial providers selected',
        selectedServiceItems: [{ id: 'service-uuid-1', text: 'S1' }],
        filteredServicesCount: 2,
        selectedProviderItems: [{ id: 'provider-uuid-1', text: 'P1' }],
        availableProvidersCount: 2,
        expectedServiceUuid: 'service-uuid-1',
        expectedProviderUuid: 'provider-uuid-1',
      },
      {
        scenario:
          'all providers selected (count matches availableProvidersCount)',
        selectedServiceItems: [{ id: 'service-uuid-1', text: 'S1' }],
        filteredServicesCount: 2,
        selectedProviderItems: [
          { id: 'provider-uuid-1', text: 'P1' },
          { id: 'provider-uuid-2', text: 'P2' },
        ],
        availableProvidersCount: 2,
        expectedServiceUuid: 'service-uuid-1',
        expectedProviderUuid: undefined,
      },
    ])(
      'should produce one request with correct uuids when $scenario',
      ({
        selectedServiceItems,
        filteredServicesCount,
        selectedProviderItems,
        availableProvidersCount,
        expectedServiceUuid,
        expectedProviderUuid,
      }) => {
        convertTo24HourFormat.mockReturnValue('09:00');

        const result = buildUnavailabilityRequests(
          {
            ...mockUnavailabilityFormData,
            selectedServiceItems,
            filteredServicesCount,
            selectedProviderItems,
            availableProvidersCount,
          },
          t,
        );

        expect(result).toHaveLength(1);
        expect(result[0].appointmentServiceUuid).toBe(expectedServiceUuid);
        expect(result[0].providerUuid).toBe(expectedProviderUuid);
      },
    );

    it('should generate a cross-product of requests for multiple services and providers', () => {
      convertTo24HourFormat.mockReturnValue('09:00');

      const result = buildUnavailabilityRequests(
        {
          ...mockUnavailabilityFormData,
          selectedServiceItems: [
            { id: 'service-uuid-1', text: 'S1' },
            { id: 'service-uuid-2', text: 'S2' },
          ],
          filteredServicesCount: 3,
          selectedProviderItems: [
            { id: 'provider-uuid-1', text: 'P1' },
            { id: 'provider-uuid-2', text: 'P2' },
          ],
          availableProvidersCount: 3,
        },
        t,
      );

      expect(result).toHaveLength(4);
      expect(result.map((r) => r.appointmentServiceUuid)).toEqual([
        'service-uuid-1',
        'service-uuid-1',
        'service-uuid-2',
        'service-uuid-2',
      ]);
      expect(result.map((r) => r.providerUuid)).toEqual([
        'provider-uuid-1',
        'provider-uuid-2',
        'provider-uuid-1',
        'provider-uuid-2',
      ]);
    });
  });

  describe('getInitialLocationUuid', () => {
    it.each([
      {
        scenario: 'getUserLoginLocation succeeds',
        setup: () => getUserLoginLocation.mockReturnValue(mockLocations[0]),
        expected: 'location-uuid-1',
      },
      {
        scenario: 'getUserLoginLocation throws',
        setup: () =>
          getUserLoginLocation.mockImplementation(() => {
            throw new Error('not found');
          }),
        expected: '',
      },
    ])('should return "$expected" when $scenario', ({ setup, expected }) => {
      setup();
      expect(getInitialLocationUuid()).toBe(expected);
    });
  });

  describe('sentinel factories', () => {
    it.each([
      {
        name: 'toSelectableItemSentinel',
        fn: toSelectableItemSentinel,
        message: 'No services available',
        expected: { id: '', text: 'No services available' },
      },
      {
        name: 'toLocationSentinel',
        fn: toLocationSentinel,
        message: 'No locations available',
        expected: { uuid: '', display: 'No locations available' },
      },
    ])(
      '$name should embed the message in the sentinel',
      ({ fn, message, expected }) => {
        expect(fn(message)).toMatchObject(expected);
      },
    );
  });

  describe('buildServiceItems and buildProviderItems', () => {
    const availableProviders = mockProviders.slice(0, 2);

    it.each([
      {
        label: 'All Services',
        buildFn: buildServiceItems as (
          items: unknown[],
          label: string,
        ) => unknown[],
        input: mockAppointmentServices,
        expectedItems: [
          {
            id: 'service-uuid-1',
            text: 'General Medicine OPD Consultation',
            originalItem: mockAppointmentServices[0],
          },
          {
            id: 'service-uuid-2',
            text: 'ENT OPD Consultation',
            originalItem: mockAppointmentServices[1],
          },
          {
            id: 'select-all-services',
            text: 'All Services',
            isSelectAll: true,
          },
        ],
      },
      {
        label: 'All Providers',
        buildFn: buildProviderItems as (
          items: unknown[],
          label: string,
        ) => unknown[],
        input: availableProviders,
        expectedItems: [
          {
            id: 'provider-uuid-1',
            text: 'Dr. John Smith',
            originalItem: availableProviders[0],
          },
          {
            id: 'provider-uuid-2',
            text: 'Dr. Jane Doe',
            originalItem: availableProviders[1],
          },
          {
            id: 'select-all-providers',
            text: 'All Providers',
            isSelectAll: true,
          },
        ],
      },
    ])(
      'should map items and append select-all entry ($label)',
      ({ buildFn, input, label, expectedItems }) => {
        expect(buildFn(input, label)).toEqual(expectedItems);
      },
    );

    it.each([
      {
        buildFn: buildServiceItems as (
          items: unknown[],
          label: string,
        ) => unknown[],
        label: 'All Services',
      },
      {
        buildFn: buildProviderItems as (
          items: unknown[],
          label: string,
        ) => unknown[],
        label: 'All Providers',
      },
    ])(
      'should return empty array for empty input ($label)',
      ({ buildFn, label }) => {
        expect(buildFn([], label)).toEqual([]);
      },
    );
  });

  describe('mapFHIRBundleToLocations', () => {
    it.each([
      {
        scenario: 'valid bundle with entries',
        bundle: mockFHIRBundle,
        expected: [
          {
            uuid: 'location-uuid-1',
            display: 'General OPD',
            childLocations: [],
          },
          { uuid: 'location-uuid-2', display: 'ENT Ward', childLocations: [] },
        ],
      },
      {
        scenario: 'empty entries array',
        bundle: {
          resourceType: 'Bundle' as const,
          id: 'empty',
          type: 'searchset',
          total: 0,
          entry: [],
        },
        expected: [],
      },
      {
        scenario: 'undefined entries',
        bundle: {
          resourceType: 'Bundle' as const,
          id: 'no-entry',
          type: 'searchset',
          total: 0,
          entry: undefined,
        },
        expected: [],
      },
    ])(
      'should return correct locations for $scenario',
      ({ bundle, expected }) => {
        const result = mapFHIRBundleToLocations(bundle);
        expect(result).toEqual(expected);
      },
    );
  });
});
