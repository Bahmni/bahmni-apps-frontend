import { getPatientProfile, computeAgeDetails } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { useFormPatientContext } from '../useFormPatientContext';

jest.mock('@bahmni/services', () => ({
  getPatientProfile: jest.fn(),
  computeAgeDetails: jest.fn(),
}));

const mockGetPatientProfile = getPatientProfile as jest.MockedFunction<
  typeof getPatientProfile
>;
const mockComputeAgeDetails = computeAgeDetails as jest.MockedFunction<
  typeof computeAgeDetails
>;

const PATIENT_UUID = 'patient-uuid-123';
const ACTIVE_VISIT_UUID = 'visit-uuid-456';
const ACTIVE_ENCOUNTER_UUID = 'encounter-uuid-789';

const MOCK_AGE_DETAILS = {
  year: 30,
  month: 0,
  day: 0,
  ageInDays: 10950,
  ageText: '30y 0m 0d',
};

const AGE_DETAILS_DEFAULT = {
  year: 0,
  month: 0,
  day: 0,
  ageInDays: 0,
  ageText: '',
};

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

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  Wrapper.displayName = 'QueryClientWrapper';
  return Wrapper;
};

describe('useFormPatientContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockComputeAgeDetails.mockReturnValue(MOCK_AGE_DETAILS);
  });

  describe('when patientUUID is falsy', () => {
    it('returns null patient without fetching when patientUUID is null', () => {
      const { result } = renderHook(
        () =>
          useFormPatientContext({
            patientUUID: null,
            activeVisitUuid: null,
            activeEncounterUuid: null,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.patient).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockGetPatientProfile).not.toHaveBeenCalled();
    });

    it('returns null patient without fetching when patientUUID is undefined', () => {
      const { result } = renderHook(
        () =>
          useFormPatientContext({
            patientUUID: undefined,
            activeVisitUuid: null,
            activeEncounterUuid: null,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.patient).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockGetPatientProfile).not.toHaveBeenCalled();
    });

    it('returns null patient without fetching when patientUUID is empty string', () => {
      const { result } = renderHook(
        () =>
          useFormPatientContext({
            patientUUID: '',
            activeVisitUuid: null,
            activeEncounterUuid: null,
          }),
        { wrapper: createWrapper() },
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

      const { result } = renderHook(
        () =>
          useFormPatientContext({
            patientUUID: PATIENT_UUID,
            activeVisitUuid: ACTIVE_VISIT_UUID,
            activeEncounterUuid: ACTIVE_ENCOUNTER_UUID,
          }),
        { wrapper: createWrapper() },
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
          birthdate: expect.stringContaining('1996-01-01'),
          birthtime: expect.stringContaining('1996-01-01'),
          gender: 'M',
          activeVisitUuid: ACTIVE_VISIT_UUID,
          currentEncounterUuid: ACTIVE_ENCOUNTER_UUID,
        }),
      );
      expect(typeof result.current.patient?.getAgeDetails).toBe('function');
      expect(result.current.patient?.getAgeDetails()).toEqual(MOCK_AGE_DETAILS);
    });

    it('sets activeVisitUuid and currentEncounterUuid to undefined when not provided', async () => {
      mockGetPatientProfile.mockResolvedValueOnce(buildProfileResponse());

      const { result } = renderHook(
        () =>
          useFormPatientContext({
            patientUUID: PATIENT_UUID,
            activeVisitUuid: null,
            activeEncounterUuid: null,
          }),
        { wrapper: createWrapper() },
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

      const { result } = renderHook(
        () =>
          useFormPatientContext({
            patientUUID: PATIENT_UUID,
            activeVisitUuid: null,
            activeEncounterUuid: null,
          }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.patient?.identifier).toBe('BAH-SECOND');
    });

    it('returns undefined identifier when no identifiers exist', async () => {
      const profile = buildProfileResponse({ identifiers: [] });
      mockGetPatientProfile.mockResolvedValueOnce(profile);

      const { result } = renderHook(
        () =>
          useFormPatientContext({
            patientUUID: PATIENT_UUID,
            activeVisitUuid: null,
            activeEncounterUuid: null,
          }),
        { wrapper: createWrapper() },
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

      const { result } = renderHook(
        () =>
          useFormPatientContext({
            patientUUID: PATIENT_UUID,
            activeVisitUuid: null,
            activeEncounterUuid: null,
          }),
        { wrapper: createWrapper() },
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

      const { result } = renderHook(
        () =>
          useFormPatientContext({
            patientUUID: PATIENT_UUID,
            activeVisitUuid: null,
            activeEncounterUuid: null,
          }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.patient?.givenName).toBe('Jane');
      expect(result.current.patient?.familyName).toBe('Smith');
      expect(result.current.patient?.display).toBe('Jane Smith');
    });

    it('returns undefined name fields when names array is empty and no profile display', async () => {
      const profile = buildProfileResponse({
        display: null,
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

      const { result } = renderHook(
        () =>
          useFormPatientContext({
            patientUUID: PATIENT_UUID,
            activeVisitUuid: null,
            activeEncounterUuid: null,
          }),
        { wrapper: createWrapper() },
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
              display: undefined,
              preferred: true,
              voided: false,
            },
          ],
        },
      });
      mockGetPatientProfile.mockResolvedValueOnce(profile);

      const { result } = renderHook(
        () =>
          useFormPatientContext({
            patientUUID: PATIENT_UUID,
            activeVisitUuid: null,
            activeEncounterUuid: null,
          }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.patient?.display).toBe('Alice Brown');
    });

    it('falls back to profile.display when all name fields are empty', async () => {
      const profile = buildProfileResponse({
        display: 'Profile Display Name',
        person: {
          uuid: 'person-uuid',
          gender: 'M',
          age: 30,
          birthdate: '1996-01-01',
          birthtime: null,
          birthdateEstimated: false,
          names: [],
        },
      });
      mockGetPatientProfile.mockResolvedValueOnce(profile);

      const { result } = renderHook(
        () =>
          useFormPatientContext({
            patientUUID: PATIENT_UUID,
            activeVisitUuid: null,
            activeEncounterUuid: null,
          }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.patient?.display).toBe('Profile Display Name');
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

      const { result } = renderHook(
        () =>
          useFormPatientContext({
            patientUUID: PATIENT_UUID,
            activeVisitUuid: null,
            activeEncounterUuid: null,
          }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.patient?.givenName).toBe('John Michael');
      expect(result.current.patient?.familyName).toBe('Doe');
    });
  });

  describe('getAgeDetails', () => {
    it('returns safe default when birthdate is missing', async () => {
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

      const { result } = renderHook(
        () =>
          useFormPatientContext({
            patientUUID: PATIENT_UUID,
            activeVisitUuid: null,
            activeEncounterUuid: null,
          }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.patient?.getAgeDetails()).toEqual(
        AGE_DETAILS_DEFAULT,
      );
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

      const { result } = renderHook(
        () =>
          useFormPatientContext({
            patientUUID: PATIENT_UUID,
            activeVisitUuid: null,
            activeEncounterUuid: null,
          }),
        { wrapper: createWrapper() },
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

      const { result } = renderHook(
        () =>
          useFormPatientContext({
            patientUUID: PATIENT_UUID,
            activeVisitUuid: null,
            activeEncounterUuid: null,
          }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.patient).toBeNull();
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Network error');
    });

    it('wraps non-Error rejection in an Error object', async () => {
      mockGetPatientProfile.mockRejectedValueOnce('string error');

      const { result } = renderHook(
        () =>
          useFormPatientContext({
            patientUUID: PATIENT_UUID,
            activeVisitUuid: null,
            activeEncounterUuid: null,
          }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('string error');
    });
  });
});
