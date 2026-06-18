import { getPatientProfile } from '@bahmni/services';
import { renderHook, waitFor } from '@testing-library/react';
import { useFormPatientContext } from '../useFormPatientContext';

jest.mock('@bahmni/services', () => ({
  getPatientProfile: jest.fn(),
}));

// Mock date-fns so age calculations are deterministic
jest.mock('date-fns', () => ({
  parseISO: jest.fn((s: string) => new Date(s)),
  differenceInDays: jest.fn(() => 10950),
  differenceInYears: jest.fn(() => 30),
  addYears: jest.fn((date: Date) => date),
  differenceInMonths: jest.fn(() => 0),
  addMonths: jest.fn((date: Date) => date),
}));

const mockGetPatientProfile = getPatientProfile as jest.MockedFunction<
  typeof getPatientProfile
>;

const PATIENT_UUID = 'patient-uuid-123';
const ACTIVE_VISIT_UUID = 'visit-uuid-456';
const ACTIVE_ENCOUNTER_UUID = 'encounter-uuid-789';

const buildProfileResponse = (
  overrides: Record<string, unknown> = {},
): any => ({
  patient: {
    uuid: PATIENT_UUID,
    display: 'John Doe',
    identifiers: [
      {
        uuid: 'id-uuid-1',
        identifier: 'BAH-001',
        identifierType: { uuid: 'type-uuid', name: 'Patient ID' },
        preferred: true,
        voided: false,
      },
    ],
    person: {
      uuid: 'person-uuid-123',
      gender: 'M',
      age: 30,
      birthdate: '1996-01-01',
      birthtime: '08:00:00',
      birthdateEstimated: false,
      names: [
        {
          uuid: 'name-uuid-1',
          givenName: 'John',
          familyName: 'Doe',
          display: 'John Doe',
          preferred: true,
          voided: false,
        },
      ],
    },
    ...overrides,
  },
});

describe('useFormPatientContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when patientUUID is falsy', () => {
    it('returns null patient without fetching when patientUUID is null', () => {
      const { result } = renderHook(() =>
        useFormPatientContext({
          patientUUID: null,
          activeVisitUuid: null,
          activeEncounterUuid: null,
        }),
      );

      expect(result.current.patient).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockGetPatientProfile).not.toHaveBeenCalled();
    });

    it('returns null patient without fetching when patientUUID is undefined', () => {
      const { result } = renderHook(() =>
        useFormPatientContext({
          patientUUID: undefined,
          activeVisitUuid: null,
          activeEncounterUuid: null,
        }),
      );

      expect(result.current.patient).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockGetPatientProfile).not.toHaveBeenCalled();
    });

    it('returns null patient without fetching when patientUUID is empty string', () => {
      const { result } = renderHook(() =>
        useFormPatientContext({
          patientUUID: '',
          activeVisitUuid: null,
          activeEncounterUuid: null,
        }),
      );

      expect(result.current.patient).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockGetPatientProfile).not.toHaveBeenCalled();
    });
  });

  describe('happy path', () => {
    it('returns enriched patient context with all fields populated', async () => {
      mockGetPatientProfile.mockResolvedValueOnce(buildProfileResponse());

      const { result } = renderHook(() =>
        useFormPatientContext({
          patientUUID: PATIENT_UUID,
          activeVisitUuid: ACTIVE_VISIT_UUID,
          activeEncounterUuid: ACTIVE_ENCOUNTER_UUID,
        }),
      );

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockGetPatientProfile).toHaveBeenCalledWith(PATIENT_UUID);
      expect(result.current.error).toBeNull();
      expect(result.current.patient).toEqual(
        expect.objectContaining({
          uuid: PATIENT_UUID,
          identifier: 'BAH-001',
          display: 'John Doe',
          givenName: 'John',
          familyName: 'Doe',
          age: 30,
          ageInDays: 10950,
          birthdate: '1996-01-01',
          birthtime: '08:00:00',
          gender: 'M',
          activeVisitUuid: ACTIVE_VISIT_UUID,
          currentEncounterUuid: ACTIVE_ENCOUNTER_UUID,
        }),
      );
      expect(typeof result.current.patient?.getAgeDetails).toBe('function');
      expect(result.current.patient?.getAgeDetails()).toEqual({
        year: 30,
        month: 0,
        day: 10950,
        ageInDays: 10950,
        ageText: '30y 0m 10950d',
      });
    });

    it('sets activeVisitUuid and currentEncounterUuid to undefined when not provided', async () => {
      mockGetPatientProfile.mockResolvedValueOnce(buildProfileResponse());

      const { result } = renderHook(() =>
        useFormPatientContext({
          patientUUID: PATIENT_UUID,
          activeVisitUuid: null,
          activeEncounterUuid: null,
        }),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.patient?.activeVisitUuid).toBeUndefined();
      expect(result.current.patient?.currentEncounterUuid).toBeUndefined();
    });
  });

  describe('identifier fallbacks', () => {
    it('falls back to first non-preferred identifier when no preferred one exists', async () => {
      const profile = buildProfileResponse({
        identifiers: [
          {
            uuid: 'id-uuid-2',
            identifier: 'BAH-SECOND',
            identifierType: { uuid: 'type-uuid', name: 'Patient ID' },
            preferred: false,
            voided: false,
          },
        ],
      });
      mockGetPatientProfile.mockResolvedValueOnce(profile);

      const { result } = renderHook(() =>
        useFormPatientContext({
          patientUUID: PATIENT_UUID,
          activeVisitUuid: null,
          activeEncounterUuid: null,
        }),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.patient?.identifier).toBe('BAH-SECOND');
    });

    it('returns undefined identifier when no identifiers exist', async () => {
      const profile = buildProfileResponse({ identifiers: [] });
      mockGetPatientProfile.mockResolvedValueOnce(profile);

      const { result } = renderHook(() =>
        useFormPatientContext({
          patientUUID: PATIENT_UUID,
          activeVisitUuid: null,
          activeEncounterUuid: null,
        }),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.patient?.identifier).toBeUndefined();
    });

    it('skips voided identifiers when selecting preferred', async () => {
      const profile = buildProfileResponse({
        identifiers: [
          {
            uuid: 'id-voided',
            identifier: 'BAH-VOIDED',
            identifierType: { uuid: 'type-uuid', name: 'Patient ID' },
            preferred: true,
            voided: true,
          },
          {
            uuid: 'id-active',
            identifier: 'BAH-ACTIVE',
            identifierType: { uuid: 'type-uuid', name: 'Patient ID' },
            preferred: false,
            voided: false,
          },
        ],
      });
      mockGetPatientProfile.mockResolvedValueOnce(profile);

      const { result } = renderHook(() =>
        useFormPatientContext({
          patientUUID: PATIENT_UUID,
          activeVisitUuid: null,
          activeEncounterUuid: null,
        }),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.patient?.identifier).toBe('BAH-ACTIVE');
    });
  });

  describe('name fallbacks', () => {
    it('falls back to first non-preferred name when no preferred one exists', async () => {
      const profile = buildProfileResponse({
        person: {
          uuid: 'person-uuid',
          gender: 'F',
          age: 25,
          birthdate: '2001-01-01',
          birthtime: null,
          birthdateEstimated: false,
          names: [
            {
              uuid: 'name-uuid-2',
              givenName: 'Jane',
              familyName: 'Smith',
              display: 'Jane Smith',
              preferred: false,
              voided: false,
            },
          ],
        },
      });
      mockGetPatientProfile.mockResolvedValueOnce(profile);

      const { result } = renderHook(() =>
        useFormPatientContext({
          patientUUID: PATIENT_UUID,
          activeVisitUuid: null,
          activeEncounterUuid: null,
        }),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.patient?.givenName).toBe('Jane');
      expect(result.current.patient?.familyName).toBe('Smith');
      expect(result.current.patient?.display).toBe('Jane Smith');
    });

    it('returns undefined name fields when names array is empty', async () => {
      const profile = buildProfileResponse({
        person: {
          uuid: 'person-uuid',
          gender: 'M',
          age: 40,
          birthdate: '1986-01-01',
          birthtime: null,
          birthdateEstimated: false,
          names: [],
        },
      });
      mockGetPatientProfile.mockResolvedValueOnce(profile);

      const { result } = renderHook(() =>
        useFormPatientContext({
          patientUUID: PATIENT_UUID,
          activeVisitUuid: null,
          activeEncounterUuid: null,
        }),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.patient?.display).toBeUndefined();
      expect(result.current.patient?.givenName).toBeUndefined();
      expect(result.current.patient?.familyName).toBeUndefined();
    });

    it('builds display from givenName and familyName when display field is missing', async () => {
      const profile = buildProfileResponse({
        person: {
          uuid: 'person-uuid',
          gender: 'M',
          age: 30,
          birthdate: '1996-01-01',
          birthtime: null,
          birthdateEstimated: false,
          names: [
            {
              uuid: 'name-uuid-3',
              givenName: 'Alice',
              familyName: 'Brown',
              display: undefined, // no display field
              preferred: true,
              voided: false,
            },
          ],
        },
      });
      mockGetPatientProfile.mockResolvedValueOnce(profile);

      const { result } = renderHook(() =>
        useFormPatientContext({
          patientUUID: PATIENT_UUID,
          activeVisitUuid: null,
          activeEncounterUuid: null,
        }),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.patient?.display).toBe('Alice Brown');
    });
  });

  describe('name field mapping with middleName', () => {
    it('includes middleName in givenName', async () => {
      const profile = buildProfileResponse({
        person: {
          uuid: 'person-uuid',
          gender: 'M',
          age: 30,
          birthdate: '1996-01-01',
          birthtime: null,
          birthdateEstimated: false,
          names: [
            {
              uuid: 'name-uuid-1',
              givenName: 'John',
              middleName: 'Michael',
              familyName: 'Doe',
              display: 'John Michael Doe',
              preferred: true,
              voided: false,
            },
          ],
        },
      });
      mockGetPatientProfile.mockResolvedValueOnce(profile);

      const { result } = renderHook(() =>
        useFormPatientContext({
          patientUUID: PATIENT_UUID,
          activeVisitUuid: null,
          activeEncounterUuid: null,
        }),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.patient?.givenName).toBe('John Michael');
      expect(result.current.patient?.familyName).toBe('Doe');
    });
  });

  describe('getAgeDetails', () => {
    it('returns null when birthdate is missing', async () => {
      const profile = buildProfileResponse({
        person: {
          uuid: 'person-uuid',
          gender: 'M',
          age: null,
          birthdate: null,
          birthtime: null,
          birthdateEstimated: false,
          names: [
            {
              uuid: 'name-uuid-1',
              givenName: 'John',
              familyName: 'Doe',
              display: 'John Doe',
              preferred: true,
              voided: false,
            },
          ],
        },
      });
      mockGetPatientProfile.mockResolvedValueOnce(profile);

      const { result } = renderHook(() =>
        useFormPatientContext({
          patientUUID: PATIENT_UUID,
          activeVisitUuid: null,
          activeEncounterUuid: null,
        }),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.patient?.getAgeDetails()).toBeNull();
    });
  });

  describe('missing birthdate', () => {
    it('returns undefined for ageInDays and birthdate when birthdate is missing', async () => {
      const profile = buildProfileResponse({
        person: {
          uuid: 'person-uuid',
          gender: 'M',
          age: null,
          birthdate: null,
          birthtime: null,
          birthdateEstimated: false,
          names: [
            {
              uuid: 'name-uuid-1',
              givenName: 'John',
              familyName: 'Doe',
              display: 'John Doe',
              preferred: true,
              voided: false,
            },
          ],
        },
      });
      mockGetPatientProfile.mockResolvedValueOnce(profile);

      const { result } = renderHook(() =>
        useFormPatientContext({
          patientUUID: PATIENT_UUID,
          activeVisitUuid: null,
          activeEncounterUuid: null,
        }),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.patient?.birthdate).toBeUndefined();
      expect(result.current.patient?.ageInDays).toBeUndefined();
      expect(result.current.patient?.birthtime).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('returns error state and null patient when getPatientProfile fails', async () => {
      const networkError = new Error('Network error');
      mockGetPatientProfile.mockRejectedValueOnce(networkError);

      const { result } = renderHook(() =>
        useFormPatientContext({
          patientUUID: PATIENT_UUID,
          activeVisitUuid: null,
          activeEncounterUuid: null,
        }),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.patient).toBeNull();
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Network error');
    });

    it('wraps non-Error rejection in an Error object', async () => {
      mockGetPatientProfile.mockRejectedValueOnce('string error');

      const { result } = renderHook(() =>
        useFormPatientContext({
          patientUUID: PATIENT_UUID,
          activeVisitUuid: null,
          activeEncounterUuid: null,
        }),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('string error');
    });
  });
});
