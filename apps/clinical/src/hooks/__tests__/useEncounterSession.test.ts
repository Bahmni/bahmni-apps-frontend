import {
  resolveEncounterMatchDecision,
  getUserLoginLocation,
} from '@bahmni/services';
import { usePatientUUID } from '@bahmni/widgets';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useEncounterSession } from '../useEncounterSession';

jest.mock('@bahmni/services', () => {
  const { canResumeOwnInSessionEncounter } =
    jest.requireActual('@bahmni/services');
  return {
    resolveEncounterMatchDecision: jest.fn(),
    getUserLoginLocation: jest.fn(),
    canResumeOwnInSessionEncounter,
  };
});

jest.mock('@bahmni/widgets', () => ({
  usePatientUUID: jest.fn(),
}));

const mockResolveEncounterMatchDecision =
  resolveEncounterMatchDecision as jest.MockedFunction<
    typeof resolveEncounterMatchDecision
  >;
const mockGetUserLoginLocation = getUserLoginLocation as jest.MockedFunction<
  typeof getUserLoginLocation
>;
const mockUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;

const PATIENT_UUID = 'patient-123';
const PRACTITIONER_UUID = 'practitioner-456';
const LOCATION_UUID = 'location-789';
const ENCOUNTER_TYPE_UUID = 'encounter-type-abc';

const mockPractitioner = { uuid: PRACTITIONER_UUID } as any;

const defaultOptions = {
  practitioner: mockPractitioner,
  encounterTypeUUID: ENCOUNTER_TYPE_UUID,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUsePatientUUID.mockReturnValue(PATIENT_UUID);
  mockGetUserLoginLocation.mockReturnValue({ uuid: LOCATION_UUID } as any);
});

describe('useEncounterSession', () => {
  describe('early return — missing required values', () => {
    it('returns loading state when patientUUID is null', async () => {
      mockUsePatientUUID.mockReturnValue(null);

      const { result } = renderHook(() => useEncounterSession(defaultOptions));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.hasActiveSession).toBe(false);
      expect(result.current.activeEncounter).toBeNull();
      expect(result.current.matchReason).toEqual([]);
      expect(result.current.editActiveEncounter).toBe(false);
      expect(mockResolveEncounterMatchDecision).not.toHaveBeenCalled();
    });

    it('returns loading state when practitioner is null', async () => {
      const { result } = renderHook(() =>
        useEncounterSession({
          practitioner: null,
          encounterTypeUUID: ENCOUNTER_TYPE_UUID,
        }),
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.hasActiveSession).toBe(false);
      expect(result.current.matchReason).toEqual([]);
      expect(mockResolveEncounterMatchDecision).not.toHaveBeenCalled();
    });

    it('returns loading state when encounterTypeUUID is undefined — prevents unfiltered search', async () => {
      const { result } = renderHook(() =>
        useEncounterSession({ practitioner: mockPractitioner }),
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.matchReason).toEqual([]);
      expect(result.current.editActiveEncounter).toBe(false);
      expect(mockResolveEncounterMatchDecision).not.toHaveBeenCalled();
    });
  });

  describe('MATCHED', () => {
    it('returns editActiveEncounter=true and matchReason=[MATCHED]', async () => {
      const encounter = { id: 'enc-1' } as any;
      mockResolveEncounterMatchDecision.mockResolvedValue({
        matched: true,
        encounter,
        reasons: ['MATCHED'],
      });

      const { result } = renderHook(() => useEncounterSession(defaultOptions));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.hasActiveSession).toBe(true);
      expect(result.current.activeEncounter).toEqual(encounter);
      expect(result.current.matchReason).toEqual(['MATCHED']);
      expect(result.current.editActiveEncounter).toBe(true);
      expect(result.current.isPractitionerMatch).toBe(true);
    });
  });

  describe('SESSION_EXPIRED', () => {
    it('returns editActiveEncounter=false and matchReason=[SESSION_EXPIRED]', async () => {
      mockResolveEncounterMatchDecision.mockResolvedValue({
        matched: false,
        encounter: { id: 'enc-1' } as any,
        reasons: ['SESSION_EXPIRED'],
      });

      const { result } = renderHook(() => useEncounterSession(defaultOptions));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.matchReason).toEqual(['SESSION_EXPIRED']);
      expect(result.current.editActiveEncounter).toBe(false);
      expect(result.current.isPractitionerMatch).toBe(false);
    });
  });

  describe('PROVIDER_MISMATCH', () => {
    it('returns matchReason=[PROVIDER_MISMATCH] when only provider differs', async () => {
      mockResolveEncounterMatchDecision.mockResolvedValue({
        matched: false,
        encounter: { id: 'enc-1' } as any,
        reasons: ['PROVIDER_MISMATCH'],
      });

      const { result } = renderHook(() => useEncounterSession(defaultOptions));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.matchReason).toEqual(['PROVIDER_MISMATCH']);
      expect(result.current.editActiveEncounter).toBe(false);
      expect(result.current.isPractitionerMatch).toBe(false);
    });

    it('returns matchReason=[PROVIDER_MISMATCH, LOCATION_MISMATCH] when both differ', async () => {
      mockResolveEncounterMatchDecision.mockResolvedValue({
        matched: false,
        encounter: { id: 'enc-1' } as any,
        reasons: ['PROVIDER_MISMATCH', 'LOCATION_MISMATCH'],
      });

      const { result } = renderHook(() => useEncounterSession(defaultOptions));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.matchReason).toEqual([
        'PROVIDER_MISMATCH',
        'LOCATION_MISMATCH',
      ]);
      // LOCATION_MISMATCH alongside PROVIDER_MISMATCH means different provider's encounter
      // at a different location — sessionExists is false so both are false
      expect(result.current.editActiveEncounter).toBe(false);
      expect(result.current.isPractitionerMatch).toBe(false);
    });
  });

  describe('LOCATION_MISMATCH', () => {
    it('returns editActiveEncounter=true and matchReason=[LOCATION_MISMATCH]', async () => {
      mockResolveEncounterMatchDecision.mockResolvedValue({
        matched: false,
        encounter: { id: 'enc-1' } as any,
        reasons: ['LOCATION_MISMATCH'],
      });

      const { result } = renderHook(() => useEncounterSession(defaultOptions));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.matchReason).toEqual(['LOCATION_MISMATCH']);
      expect(result.current.editActiveEncounter).toBe(true);
      expect(result.current.isPractitionerMatch).toBe(true);
    });
  });

  describe('NO_ACTIVE_VISIT / NO_ACTIVE_ENCOUNTER', () => {
    it.each(['NO_ACTIVE_VISIT', 'NO_ACTIVE_ENCOUNTER'] as const)(
      'returns editActiveEncounter=false and matchReason=[%s]',
      async (reasonCode) => {
        mockResolveEncounterMatchDecision.mockResolvedValue({
          matched: false,
          encounter: null,
          reasons: [reasonCode],
        });

        const { result } = renderHook(() =>
          useEncounterSession(defaultOptions),
        );

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.hasActiveSession).toBe(false);
        expect(result.current.activeEncounter).toBeNull();
        expect(result.current.matchReason).toEqual([reasonCode]);
        expect(result.current.editActiveEncounter).toBe(false);
      },
    );
  });

  describe('locationUUID sourcing', () => {
    it('passes locationUUID from getUserLoginLocation to the resolver', async () => {
      mockResolveEncounterMatchDecision.mockResolvedValue({
        matched: true,
        encounter: null,
        reasons: ['MATCHED'],
      });

      renderHook(() => useEncounterSession(defaultOptions));

      await waitFor(() =>
        expect(mockResolveEncounterMatchDecision).toHaveBeenCalledWith(
          PATIENT_UUID,
          PRACTITIONER_UUID,
          LOCATION_UUID,
          ENCOUNTER_TYPE_UUID,
        ),
      );
    });

    it('passes undefined when getUserLoginLocation throws', async () => {
      mockGetUserLoginLocation.mockImplementation(() => {
        throw new Error('cookie missing');
      });
      mockResolveEncounterMatchDecision.mockResolvedValue({
        matched: false,
        encounter: null,
        reasons: ['NO_ACTIVE_ENCOUNTER'],
      });

      renderHook(() => useEncounterSession(defaultOptions));

      await waitFor(() =>
        expect(mockResolveEncounterMatchDecision).toHaveBeenCalledWith(
          PATIENT_UUID,
          PRACTITIONER_UUID,
          undefined,
          ENCOUNTER_TYPE_UUID,
        ),
      );
    });
  });

  describe('error handling', () => {
    it('defaults to NO_ACTIVE_ENCOUNTER when resolver throws', async () => {
      mockResolveEncounterMatchDecision.mockRejectedValue(
        new Error('network error'),
      );

      const { result } = renderHook(() => useEncounterSession(defaultOptions));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.hasActiveSession).toBe(false);
      expect(result.current.activeEncounter).toBeNull();
      expect(result.current.matchReason).toEqual(['NO_ACTIVE_ENCOUNTER']);
      expect(result.current.editActiveEncounter).toBe(false);
    });
  });

  describe('refetch', () => {
    it('re-calls the resolver when refetch is invoked', async () => {
      mockResolveEncounterMatchDecision.mockResolvedValue({
        matched: true,
        encounter: { id: 'enc-1' } as any,
        reasons: ['MATCHED'],
      });

      const { result } = renderHook(() => useEncounterSession(defaultOptions));
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(mockResolveEncounterMatchDecision).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() =>
        expect(mockResolveEncounterMatchDecision).toHaveBeenCalledTimes(2),
      );
    });
  });
});
