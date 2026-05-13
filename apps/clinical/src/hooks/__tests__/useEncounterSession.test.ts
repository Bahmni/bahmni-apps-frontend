import {
  resolveEncounterMatchDecision,
  getUserLoginLocation,
} from '@bahmni/services';
import { usePatientUUID } from '@bahmni/widgets';
import { renderHook, waitFor } from '@testing-library/react';
import { useEncounterSession } from '../useEncounterSession';

jest.mock('@bahmni/services', () => ({
  resolveEncounterMatchDecision: jest.fn(),
  getUserLoginLocation: jest.fn(),
}));

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
    it('returns empty state when patientUUID is null', async () => {
      mockUsePatientUUID.mockReturnValue(null);

      const { result } = renderHook(() => useEncounterSession(defaultOptions));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.hasActiveSession).toBe(false);
      expect(result.current.activeEncounter).toBeNull();
      expect(result.current.matchReason).toBeNull();
      expect(result.current.editActiveEncounter).toBe(false);
      expect(mockResolveEncounterMatchDecision).not.toHaveBeenCalled();
    });

    it('returns empty state when practitioner is null', async () => {
      const { result } = renderHook(() =>
        useEncounterSession({ practitioner: null, encounterTypeUUID: ENCOUNTER_TYPE_UUID }),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.hasActiveSession).toBe(false);
      expect(result.current.matchReason).toBeNull();
      expect(mockResolveEncounterMatchDecision).not.toHaveBeenCalled();
    });

    it('returns empty state when encounterTypeUUID is undefined — prevents unfiltered search', async () => {
      const { result } = renderHook(() =>
        useEncounterSession({ practitioner: mockPractitioner }),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.matchReason).toBeNull();
      expect(result.current.editActiveEncounter).toBe(false);
      expect(mockResolveEncounterMatchDecision).not.toHaveBeenCalled();
    });
  });

  describe('MATCHED', () => {
    it('returns editActiveEncounter=true, canEditEncounter=true', async () => {
      const encounter = { id: 'enc-1' } as any;
      mockResolveEncounterMatchDecision.mockResolvedValue({
        matched: true,
        encounter,
        reason: 'MATCHED',
      });

      const { result } = renderHook(() => useEncounterSession(defaultOptions));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.hasActiveSession).toBe(true);
      expect(result.current.activeEncounter).toEqual(encounter);
      expect(result.current.matchReason).toBe('MATCHED');
      expect(result.current.editActiveEncounter).toBe(true);
      expect(result.current.canEditEncounter).toBe(true);
      expect(result.current.isPractitionerMatch).toBe(true);
    });
  });

  describe('SESSION_EXPIRED', () => {
    it('returns editActiveEncounter=false, canEditEncounter=false — no Edit button for expired session', async () => {
      mockResolveEncounterMatchDecision.mockResolvedValue({
        matched: false,
        encounter: { id: 'enc-1' } as any,
        reason: 'SESSION_EXPIRED',
      });

      const { result } = renderHook(() => useEncounterSession(defaultOptions));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.matchReason).toBe('SESSION_EXPIRED');
      expect(result.current.editActiveEncounter).toBe(false);
      expect(result.current.canEditEncounter).toBe(false);
      expect(result.current.isPractitionerMatch).toBe(true);
    });
  });

  describe('PROVIDER_MISMATCH', () => {
    it('returns editActiveEncounter=false but canEditEncounter=true — widgets show Edit, button does not', async () => {
      mockResolveEncounterMatchDecision.mockResolvedValue({
        matched: false,
        encounter: { id: 'enc-1' } as any,
        reason: 'PROVIDER_MISMATCH',
      });

      const { result } = renderHook(() => useEncounterSession(defaultOptions));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.matchReason).toBe('PROVIDER_MISMATCH');
      expect(result.current.editActiveEncounter).toBe(false);
      expect(result.current.canEditEncounter).toBe(true);
      expect(result.current.isPractitionerMatch).toBe(false);
    });
  });

  describe('LOCATION_MISMATCH', () => {
    it('returns editActiveEncounter=true and canEditEncounter=true', async () => {
      mockResolveEncounterMatchDecision.mockResolvedValue({
        matched: false,
        encounter: { id: 'enc-1' } as any,
        reason: 'LOCATION_MISMATCH',
      });

      const { result } = renderHook(() => useEncounterSession(defaultOptions));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.matchReason).toBe('LOCATION_MISMATCH');
      expect(result.current.editActiveEncounter).toBe(true);
      expect(result.current.canEditEncounter).toBe(true);
      expect(result.current.isPractitionerMatch).toBe(true);
    });
  });

  describe('NO_ACTIVE_VISIT / NO_ACTIVE_ENCOUNTER', () => {
    it.each(['NO_ACTIVE_VISIT', 'NO_ACTIVE_ENCOUNTER'] as const)(
      'returns editActiveEncounter=false for %s',
      async (reason) => {
        mockResolveEncounterMatchDecision.mockResolvedValue({
          matched: false,
          encounter: null,
          reason,
        });

        const { result } = renderHook(() => useEncounterSession(defaultOptions));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.hasActiveSession).toBe(false);
        expect(result.current.activeEncounter).toBeNull();
        expect(result.current.matchReason).toBe(reason);
        expect(result.current.editActiveEncounter).toBe(false);
      },
    );
  });

  describe('locationUUID sourcing', () => {
    it('passes locationUUID from getUserLoginLocation to the resolver', async () => {
      mockResolveEncounterMatchDecision.mockResolvedValue({
        matched: true,
        encounter: null,
        reason: 'MATCHED',
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

    it('passes empty string when getUserLoginLocation throws', async () => {
      mockGetUserLoginLocation.mockImplementation(() => {
        throw new Error('cookie missing');
      });
      mockResolveEncounterMatchDecision.mockResolvedValue({
        matched: false,
        encounter: null,
        reason: 'NO_ACTIVE_ENCOUNTER',
      });

      renderHook(() => useEncounterSession(defaultOptions));

      await waitFor(() =>
        expect(mockResolveEncounterMatchDecision).toHaveBeenCalledWith(
          PATIENT_UUID,
          PRACTITIONER_UUID,
          '',
          ENCOUNTER_TYPE_UUID,
        ),
      );
    });
  });

  describe('error handling', () => {
    it('defaults to NO_ACTIVE_ENCOUNTER when resolver throws', async () => {
      mockResolveEncounterMatchDecision.mockRejectedValue(new Error('network error'));

      const { result } = renderHook(() => useEncounterSession(defaultOptions));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.hasActiveSession).toBe(false);
      expect(result.current.activeEncounter).toBeNull();
      expect(result.current.matchReason).toBe('NO_ACTIVE_ENCOUNTER');
      expect(result.current.editActiveEncounter).toBe(false);
    });
  });

  describe('refetch', () => {
    it('re-calls the resolver when refetch is invoked', async () => {
      mockResolveEncounterMatchDecision.mockResolvedValue({
        matched: true,
        encounter: { id: 'enc-1' } as any,
        reason: 'MATCHED',
      });

      const { result } = renderHook(() => useEncounterSession(defaultOptions));
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(mockResolveEncounterMatchDecision).toHaveBeenCalledTimes(1);

      await result.current.refetch();

      expect(mockResolveEncounterMatchDecision).toHaveBeenCalledTimes(2);
    });
  });
});
