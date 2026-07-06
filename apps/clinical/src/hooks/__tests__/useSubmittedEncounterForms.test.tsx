import {
  FHIR_OBSERVATION_FORM_NAMESPACE_PATH_URL,
  getObservationsBundleByEncounterUuid,
  useEncounterSessionStore,
  useSubscribeConsultationSaved,
  ObservationForm,
} from '@bahmni/services';
import { usePatientUUID } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { Bundle, Observation } from 'fhir/r4';
import React from 'react';
import { useSubmittedEncounterForms } from '../useSubmittedEncounterForms';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getObservationsBundleByEncounterUuid: jest.fn(),
  useEncounterSessionStore: jest.fn(),
  useSubscribeConsultationSaved: jest.fn(),
}));

jest.mock('@bahmni/widgets', () => ({
  usePatientUUID: jest.fn(),
  extractFormFieldPath: (observation?: {
    extension?: { url: string; valueString?: string }[];
  }) =>
    observation?.extension?.find(
      (ext) =>
        ext.url ===
        jest.requireActual('@bahmni/services')
          .FHIR_OBSERVATION_FORM_NAMESPACE_PATH_URL,
    )?.valueString,
}));

const mockGetObservationsBundleByEncounterUuid =
  getObservationsBundleByEncounterUuid as jest.MockedFunction<
    typeof getObservationsBundleByEncounterUuid
  >;
const mockUseEncounterSessionStore =
  useEncounterSessionStore as jest.MockedFunction<
    typeof useEncounterSessionStore
  >;
const mockUseSubscribeConsultationSaved =
  useSubscribeConsultationSaved as jest.MockedFunction<
    typeof useSubscribeConsultationSaved
  >;
const mockUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PATIENT_UUID = 'patient-abc';
const ENCOUNTER_UUID = 'encounter-123';

const allForms: ObservationForm[] = [
  { uuid: 'form-uuid-vitals', name: 'Vitals', id: 1, privileges: [] },
  { uuid: 'form-uuid-history', name: 'History', id: 2, privileges: [] },
  { uuid: 'form-uuid-notes', name: 'Progress Notes', id: 3, privileges: [] },
];

/** Build a FHIR Observation with a form-namespace-path extension. */
function makeObservation(valueString: string): Observation {
  return {
    resourceType: 'Observation',
    id: `obs-${valueString}`,
    status: 'final',
    code: { coding: [] },
    extension: [
      {
        url: FHIR_OBSERVATION_FORM_NAMESPACE_PATH_URL,
        valueString,
      },
    ],
  };
}

/** Build an empty Bundle or a Bundle with the given observations. */
function makeBundle(observations: Observation[]): Bundle<Observation> {
  return {
    resourceType: 'Bundle',
    type: 'searchset',
    entry: observations.map((obs) => ({ resource: obs })),
  };
}

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
        gcTime: Infinity,
      },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'QueryClientWrapper';
  return Wrapper;
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSubmittedEncounterForms', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default: MATCHED encounter session
    mockUseEncounterSessionStore.mockReturnValue({
      activeEncounter: { id: ENCOUNTER_UUID },
      matchReasons: ['MATCHED'],
    } as unknown as ReturnType<typeof useEncounterSessionStore>);

    mockUsePatientUUID.mockReturnValue(PATIENT_UUID);
    mockUseSubscribeConsultationSaved.mockImplementation(() => {});
  });

  describe('bundle → uuid set mapping', () => {
    it('returns a Set containing the uuid of a submitted form', async () => {
      mockGetObservationsBundleByEncounterUuid.mockResolvedValue(
        makeBundle([makeObservation('Vitals.1/10-0')]),
      );

      const { result } = renderHook(
        () => useSubmittedEncounterForms(allForms),
        { wrapper: createWrapper() },
      );

      await waitFor(() =>
        expect(mockGetObservationsBundleByEncounterUuid).toHaveBeenCalledWith(
          ENCOUNTER_UUID,
        ),
      );

      await waitFor(() => expect(result.current.size).toBe(1));
      expect(result.current.has('form-uuid-vitals')).toBe(true);
    });

    it('handles namespace-prefixed valueString (Bahmni^Vitals.1/10-0)', async () => {
      mockGetObservationsBundleByEncounterUuid.mockResolvedValue(
        makeBundle([makeObservation('Bahmni^Vitals.1/10-0')]),
      );

      const { result } = renderHook(
        () => useSubmittedEncounterForms(allForms),
        { wrapper: createWrapper() },
      );

      await waitFor(() => expect(result.current.size).toBe(1));
      expect(result.current.has('form-uuid-vitals')).toBe(true);
    });

    it('returns uuids for multiple submitted forms', async () => {
      mockGetObservationsBundleByEncounterUuid.mockResolvedValue(
        makeBundle([
          makeObservation('Vitals.1/1-0'),
          makeObservation('History.2/3-0'),
        ]),
      );

      const { result } = renderHook(
        () => useSubmittedEncounterForms(allForms),
        { wrapper: createWrapper() },
      );

      await waitFor(() => expect(result.current.size).toBe(2));
      expect(result.current.has('form-uuid-vitals')).toBe(true);
      expect(result.current.has('form-uuid-history')).toBe(true);
    });

    it('ignores observations whose parsed form name does not match any allForms entry', async () => {
      mockGetObservationsBundleByEncounterUuid.mockResolvedValue(
        makeBundle([makeObservation('UnknownForm.1/1-0')]),
      );

      const { result } = renderHook(
        () => useSubmittedEncounterForms(allForms),
        { wrapper: createWrapper() },
      );

      await waitFor(() =>
        expect(mockGetObservationsBundleByEncounterUuid).toHaveBeenCalledTimes(
          1,
        ),
      );

      expect(result.current.size).toBe(0);
    });

    it('deduplicates: returns one uuid even when multiple obs reference the same form', async () => {
      mockGetObservationsBundleByEncounterUuid.mockResolvedValue(
        makeBundle([
          makeObservation('Vitals.1/1-0'),
          makeObservation('Vitals.1/2-0'),
        ]),
      );

      const { result } = renderHook(
        () => useSubmittedEncounterForms(allForms),
        { wrapper: createWrapper() },
      );

      await waitFor(() => expect(result.current.size).toBe(1));
      expect(result.current.has('form-uuid-vitals')).toBe(true);
    });
  });

  describe('no MATCHED session → empty set', () => {
    it('returns empty set when matchReasons does not include MATCHED', () => {
      mockUseEncounterSessionStore.mockReturnValue({
        activeEncounter: { id: ENCOUNTER_UUID },
        matchReasons: ['SESSION_EXPIRED'],
      } as unknown as ReturnType<typeof useEncounterSessionStore>);

      const { result } = renderHook(
        () => useSubmittedEncounterForms(allForms),
        { wrapper: createWrapper() },
      );

      // Query is disabled — fetch must NOT be called
      expect(mockGetObservationsBundleByEncounterUuid).not.toHaveBeenCalled();
      expect(result.current.size).toBe(0);
    });

    it('returns empty set when matchReasons is empty (new encounter)', () => {
      mockUseEncounterSessionStore.mockReturnValue({
        activeEncounter: null,
        matchReasons: [],
      } as unknown as ReturnType<typeof useEncounterSessionStore>);

      const { result } = renderHook(
        () => useSubmittedEncounterForms(allForms),
        { wrapper: createWrapper() },
      );

      expect(mockGetObservationsBundleByEncounterUuid).not.toHaveBeenCalled();
      expect(result.current.size).toBe(0);
    });

    it('returns empty set when patientUUID is null', () => {
      mockUsePatientUUID.mockReturnValue(null);

      const { result } = renderHook(
        () => useSubmittedEncounterForms(allForms),
        { wrapper: createWrapper() },
      );

      expect(mockGetObservationsBundleByEncounterUuid).not.toHaveBeenCalled();
      expect(result.current.size).toBe(0);
    });
  });

  describe('encounter duration completed (SESSION_EXPIRED) → no forms greyed', () => {
    it('returns empty set even when the expired encounter has submitted observations', async () => {
      mockUseEncounterSessionStore.mockReturnValue({
        activeEncounter: { id: ENCOUNTER_UUID },
        matchReasons: ['SESSION_EXPIRED'],
      } as unknown as ReturnType<typeof useEncounterSessionStore>);

      mockGetObservationsBundleByEncounterUuid.mockResolvedValue(
        makeBundle([
          makeObservation('Vitals.1/1-0'),
          makeObservation('History.2/3-0'),
        ]),
      );

      const { result } = renderHook(
        () => useSubmittedEncounterForms(allForms),
        { wrapper: createWrapper() },
      );

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockGetObservationsBundleByEncounterUuid).not.toHaveBeenCalled();
      expect(result.current.size).toBe(0);
    });
  });

  describe('empty bundle → empty set', () => {
    it('returns empty set when bundle has no entries', async () => {
      mockGetObservationsBundleByEncounterUuid.mockResolvedValue(
        makeBundle([]),
      );

      const { result } = renderHook(
        () => useSubmittedEncounterForms(allForms),
        { wrapper: createWrapper() },
      );

      await waitFor(() =>
        expect(mockGetObservationsBundleByEncounterUuid).toHaveBeenCalledTimes(
          1,
        ),
      );

      expect(result.current.size).toBe(0);
    });

    it('returns empty set when bundle entry has no resource', async () => {
      mockGetObservationsBundleByEncounterUuid.mockResolvedValue({
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [{ fullUrl: 'http://example.com/obs/1' }], // no resource
      } as Bundle<Observation>);

      const { result } = renderHook(
        () => useSubmittedEncounterForms(allForms),
        { wrapper: createWrapper() },
      );

      await waitFor(() =>
        expect(mockGetObservationsBundleByEncounterUuid).toHaveBeenCalledTimes(
          1,
        ),
      );

      expect(result.current.size).toBe(0);
    });
  });

  describe('fetch error → fail-open (empty set)', () => {
    it('returns an empty set and does not throw when the fetch rejects', async () => {
      const consoleerrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockGetObservationsBundleByEncounterUuid.mockRejectedValue(
        new Error('network error'),
      );

      const { result } = renderHook(
        () => useSubmittedEncounterForms(allForms),
        { wrapper: createWrapper() },
      );

      await waitFor(() =>
        expect(mockGetObservationsBundleByEncounterUuid).toHaveBeenCalledTimes(
          1,
        ),
      );

      expect(result.current.size).toBe(0);
      consoleerrorSpy.mockRestore();
    });
  });

  describe('namespace and version parsing', () => {
    it.each([
      ['Bahmni^Vitals.1/10-0', 'form-uuid-vitals'],
      ['Vitals.1/1-0', 'form-uuid-vitals'],
      ['Vitals.1.2/1-0', 'form-uuid-vitals'],
      ['History.2/3-0', 'form-uuid-history'],
      ['Bahmni^History.3/1-0', 'form-uuid-history'],
    ])('parses "%s" to form uuid %s', async (valueString, expectedUuid) => {
      mockGetObservationsBundleByEncounterUuid.mockResolvedValue(
        makeBundle([makeObservation(valueString)]),
      );

      const { result } = renderHook(
        () => useSubmittedEncounterForms(allForms),
        { wrapper: createWrapper() },
      );

      await waitFor(() => expect(result.current.size).toBe(1));
      expect(result.current.has(expectedUuid)).toBe(true);
    });
  });

  describe('consultationSaved refetch', () => {
    it('calls refetch when consultationSaved fires for the current patient', async () => {
      mockGetObservationsBundleByEncounterUuid.mockResolvedValue(
        makeBundle([]),
      );

      // Capture the callback registered with useSubscribeConsultationSaved
      let capturedCallback: ((payload: any) => void) | null = null;
      mockUseSubscribeConsultationSaved.mockImplementation((cb) => {
        capturedCallback = cb;
      });

      const { result } = renderHook(
        () => useSubmittedEncounterForms(allForms),
        { wrapper: createWrapper() },
      );

      await waitFor(() =>
        expect(mockGetObservationsBundleByEncounterUuid).toHaveBeenCalledTimes(
          1,
        ),
      );

      // After first fetch, simulate a saved bundle with a Vitals form
      mockGetObservationsBundleByEncounterUuid.mockResolvedValue(
        makeBundle([makeObservation('Vitals.1/1-0')]),
      );

      // Fire the consultation-saved event for the current patient
      act(() => {
        capturedCallback!({
          patientUUID: PATIENT_UUID,
          updatedResources: {
            conditions: false,
            allergies: false,
            medications: false,
            serviceRequests: {},
          },
          updatedConcepts: new Map(),
        });
      });

      await waitFor(() =>
        expect(mockGetObservationsBundleByEncounterUuid).toHaveBeenCalledTimes(
          2,
        ),
      );

      await waitFor(() => expect(result.current.size).toBe(1));
      expect(result.current.has('form-uuid-vitals')).toBe(true);
    });

    it('does NOT refetch when consultationSaved fires for a different patient', async () => {
      mockGetObservationsBundleByEncounterUuid.mockResolvedValue(
        makeBundle([]),
      );

      let capturedCallback: ((payload: any) => void) | null = null;
      mockUseSubscribeConsultationSaved.mockImplementation((cb) => {
        capturedCallback = cb;
      });

      renderHook(() => useSubmittedEncounterForms(allForms), {
        wrapper: createWrapper(),
      });

      await waitFor(() =>
        expect(mockGetObservationsBundleByEncounterUuid).toHaveBeenCalledTimes(
          1,
        ),
      );

      act(() => {
        capturedCallback!({
          patientUUID: 'different-patient',
          updatedResources: {
            conditions: false,
            allergies: false,
            medications: false,
            serviceRequests: {},
          },
          updatedConcepts: new Map(),
        });
      });

      // Should still be called only once (no refetch for different patient)
      expect(mockGetObservationsBundleByEncounterUuid).toHaveBeenCalledTimes(1);
    });
  });
});
