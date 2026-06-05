import type { VisitType } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useActiveVisit, useCreateVisit, useVisitTypes } from '../useVisit';

const mockCheckIfActiveVisitExists = jest.fn();
const mockCreateVisitForPatient = jest.fn();
const mockGetVisitTypes = jest.fn();
const mockGetActiveVisitByPatient = jest.fn();
const mockSearchEncounters = jest.fn();
const mockUpdateFhirEncounter = jest.fn();
const mockAddNotification = jest.fn();

const mockUseRegistrationConfig = jest.fn();
jest.mock('../../providers/registrationConfig', () => ({
  useRegistrationConfig: () => mockUseRegistrationConfig(),
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  checkIfActiveVisitExists: (patientUuid: string) =>
    mockCheckIfActiveVisitExists(patientUuid),
  createVisitForPatient: (patientUuid: string, visitType: any) =>
    mockCreateVisitForPatient(patientUuid, visitType),
  getVisitTypes: () => mockGetVisitTypes(),
  getActiveVisitByPatient: (patientUuid: string) =>
    mockGetActiveVisitByPatient(patientUuid),
  searchEncounters: (params: any) => mockSearchEncounters(params),
  updateFhirEncounter: (uuid: string, encounter: any) =>
    mockUpdateFhirEncounter(uuid, encounter),
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@bahmni/widgets', () => ({
  useNotification: () => ({
    addNotification: mockAddNotification,
  }),
}));

const patientUuid = '9891a8b4-7404-4c05-a207-5ec9d34fc719';
const mockVisitType: VisitType = {
  name: 'OPD',
  uuid: '54f43754-c6ce-4472-890e-0f28acaeaea6',
};

describe('useVisit', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRegistrationConfig.mockReturnValue({ registrationConfig: null });
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  describe('useActiveVisit', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    it('should return hasActiveVisit as true when patient has active visit', async () => {
      mockCheckIfActiveVisitExists.mockResolvedValue(true);

      const { result } = renderHook(() => useActiveVisit(patientUuid), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.hasActiveVisit).toBe(true);
      });
    });

    it('should return hasActiveVisit as false when patient has no active visit', async () => {
      mockCheckIfActiveVisitExists.mockResolvedValue(false);

      const { result } = renderHook(() => useActiveVisit(patientUuid), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.hasActiveVisit).toBe(false);
      });
    });
  });

  describe('useCreateVisit', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/patient/${patientUuid}`]}>
          {children}
        </MemoryRouter>
      </QueryClientProvider>
    );

    beforeEach(() => {
      mockCheckIfActiveVisitExists.mockResolvedValue(false);
      mockCreateVisitForPatient.mockResolvedValue({});
      mockUseRegistrationConfig.mockReturnValue({ registrationConfig: null });
      mockGetActiveVisitByPatient.mockResolvedValue({
        results: [
          {
            uuid: 'visit-uuid-789',
            visitType: { uuid: 'vt-uuid', name: 'OPD' },
            startDatetime: '2026-06-05T00:00:00.000+00:00',
            stopDatetime: null,
          },
        ],
      });
      mockSearchEncounters.mockResolvedValue([
        {
          id: 'encounter-uuid-456',
          resourceType: 'Encounter',
          status: 'in-progress',
          // no partOf — unlinked
        },
      ]);
      mockUpdateFhirEncounter.mockResolvedValue({});
    });

    it('should create visit when no active visit exists', async () => {
      const { result } = renderHook(() => useCreateVisit(), { wrapper });

      await result.current.createVisit(patientUuid, mockVisitType);

      await waitFor(() => {
        expect(mockCreateVisitForPatient).toHaveBeenCalledWith(
          patientUuid,
          mockVisitType,
        );
      });
    });

    it('should show error notification when visit creation fails', async () => {
      const error = new Error('Failed to create visit');
      mockCreateVisitForPatient.mockRejectedValue(error);

      const { result } = renderHook(() => useCreateVisit(), { wrapper });

      await result.current.createVisit(patientUuid, mockVisitType);

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith({
          title: 'ERROR_DEFAULT_TITLE',
          message: error.message,
          type: 'error',
          timeout: 5000,
        });
      });
    });

    it('should link unlinked registration encounter to visit after visit creation', async () => {
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: {
          registrationEncounterTypeUuid: 'reg-encounter-type-uuid',
        },
      });

      const { result } = renderHook(() => useCreateVisit(), { wrapper });

      await result.current.createVisit(patientUuid, mockVisitType);

      await waitFor(() => {
        expect(mockSearchEncounters).toHaveBeenCalledWith({
          patient: patientUuid,
          type: 'reg-encounter-type-uuid',
        });
      });

      await waitFor(() => {
        expect(mockUpdateFhirEncounter).toHaveBeenCalledWith(
          'encounter-uuid-456',
          expect.objectContaining({
            period: { start: '2026-06-05T00:00:00.000Z' },
            partOf: { reference: 'Encounter/visit-uuid-789' },
          }),
        );
      });
    });

    it('should not link encounter when no unlinked encounter is found', async () => {
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: {
          registrationEncounterTypeUuid: 'reg-encounter-type-uuid',
        },
      });
      // Return an already-linked encounter
      mockSearchEncounters.mockResolvedValue([
        {
          id: 'encounter-uuid-456',
          resourceType: 'Encounter',
          status: 'in-progress',
          partOf: { reference: 'Encounter/some-visit-uuid' },
        },
      ]);

      const { result } = renderHook(() => useCreateVisit(), { wrapper });

      await result.current.createVisit(patientUuid, mockVisitType);

      await waitFor(() => {
        expect(mockCreateVisitForPatient).toHaveBeenCalled();
      });

      // Give time for async linkage logic to settle
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockUpdateFhirEncounter).not.toHaveBeenCalled();
    });

    it('should skip encounter linkage when registrationEncounterTypeUuid is not configured', async () => {
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: {},
      });

      const { result } = renderHook(() => useCreateVisit(), { wrapper });

      await result.current.createVisit(patientUuid, mockVisitType);

      await waitFor(() => {
        expect(mockCreateVisitForPatient).toHaveBeenCalled();
      });

      expect(mockSearchEncounters).not.toHaveBeenCalled();
      expect(mockUpdateFhirEncounter).not.toHaveBeenCalled();
    });
  });

  describe('useVisitTypes', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    it('should return visit types from API', async () => {
      const mockVisitTypesResponse = {
        visitTypes: {
          OPD: '54f43754-c6ce-4472-890e-0f28acaeaea6',
          IPD: 'b2e3c5d1-9876-4321-abcd-ef1234567890',
        },
      };

      mockGetVisitTypes.mockResolvedValue(mockVisitTypesResponse);

      const { result } = renderHook(() => useVisitTypes(), { wrapper });

      await waitFor(() => {
        expect(result.current.visitTypes).toEqual(mockVisitTypesResponse);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle loading state', () => {
      mockGetVisitTypes.mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      const { result } = renderHook(() => useVisitTypes(), { wrapper });

      expect(result.current.isLoading).toBe(true);
    });
  });
});
