import { getPatientProfile } from '@bahmni/services';
import { renderHook, waitFor } from '@testing-library/react';
import { useFormPatientContext } from '../useFormPatientContext';

jest.mock('@bahmni/services', () => ({
  getPatientProfile: jest.fn(),
}));

// Mock date-fns so ageInDays is deterministic
jest.mock('date-fns', () => ({
  differenceInDays: jest.fn(() => 10950), // ~30 years in days
  parseISO: jest.fn((s: string) => new Date(s)),
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
          name: 'John Doe',
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
    });

    it('sets activeVisitUuid and currentEncounterUuid to null when not provided', async () => {
      mockGetPatientProfile.mockResolvedValueOnce(buildProfileResponse());

      const { result } = renderHook(() =>
        useFormPatientContext({
          patientUUID: PATIENT_UUID,
          activeVisitUuid: null,
          activeEncounterUuid: null,
        }),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.patient?.activeVisitUuid).toBeNull();
      expect(result.current.patient?.currentEncounterUuid).toBeNull();
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

    it('returns null identifier when no identifiers exist', async () => {
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
      expect(result.current.patient?.identifier).toBeNull();
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

    it('returns null name fields when names array is empty', async () => {
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
      expect(result.current.patient?.display).toBeNull();
      expect(result.current.patient?.givenName).toBeNull();
      expect(result.current.patient?.familyName).toBeNull();
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

  describe('missing birthdate', () => {
    it('returns null for ageInDays and birthdate when birthdate is missing', async () => {
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
      expect(result.current.patient?.birthdate).toBeNull();
      expect(result.current.patient?.ageInDays).toBeNull();
      expect(result.current.patient?.birthtime).toBeNull();
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
