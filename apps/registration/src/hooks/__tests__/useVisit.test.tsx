import type { VisitType } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  useActiveVisit,
  useCreateVisit,
  useIsCreatingVisit,
  useVisitTypes,
} from '../useVisit';

const mockCheckIfActiveVisitExists = jest.fn();
const mockCreateVisitForPatient = jest.fn();
const mockGetVisitTypes = jest.fn();
const mockAddNotification = jest.fn();
const mockCreateRegistrationEncounterForPatient = jest.fn();

const mockUseRegistrationEncounterTypeUuid = jest.fn();
jest.mock('../useRegistrationEncounterTypeUuid', () => ({
  useRegistrationEncounterTypeUuid: () =>
    mockUseRegistrationEncounterTypeUuid(),
}));

jest.mock('../../services/registrationEncounterService', () => ({
  createRegistrationEncounterForPatient: (...args: unknown[]) =>
    mockCreateRegistrationEncounterForPatient(...args),
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  checkIfActiveVisitExists: (patientUuid: string) =>
    mockCheckIfActiveVisitExists(patientUuid),
  createVisitForPatient: (patientUuid: string, visitType: any) =>
    mockCreateVisitForPatient(patientUuid, visitType),
  getVisitTypes: () => mockGetVisitTypes(),
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@bahmni/widgets', () => ({
  useNotification: () => ({
    addNotification: mockAddNotification,
  }),
}));

const mockUseParams = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams(),
}));

const patientUuid = '9891a8b4-7404-4c05-a207-5ec9d34fc719';
const mockVisitType: VisitType = {
  name: 'OPD',
  uuid: '54f43754-c6ce-4472-890e-0f28acaeaea6',
};
const mockCreatedVisit = {
  uuid: 'visit-uuid-123',
  startDatetime: '2026-07-01T10:00:00.000+0000',
};

describe('useVisit', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRegistrationEncounterTypeUuid.mockReturnValue(undefined);
    mockUseParams.mockReturnValue({});
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
      mockCreateVisitForPatient.mockResolvedValue(mockCreatedVisit);
      mockUseRegistrationEncounterTypeUuid.mockReturnValue(undefined);
      mockCreateRegistrationEncounterForPatient.mockResolvedValue(undefined);
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

    it('should create the registration encounter with visit linkage after visit creation when encounter type is configured', async () => {
      mockUseRegistrationEncounterTypeUuid.mockReturnValue(
        'reg-encounter-type-uuid',
      );

      const { result } = renderHook(() => useCreateVisit(), { wrapper });

      await result.current.createVisit(patientUuid, mockVisitType);

      await waitFor(() => {
        expect(mockCreateRegistrationEncounterForPatient).toHaveBeenCalledWith(
          patientUuid,
          'reg-encounter-type-uuid',
          {
            visitUuid: mockCreatedVisit.uuid,
            periodStart: mockCreatedVisit.startDatetime,
          },
        );
      });
    });

    it('should not create the registration encounter when visit creation fails', async () => {
      mockUseRegistrationEncounterTypeUuid.mockReturnValue(
        'reg-encounter-type-uuid',
      );
      mockCreateVisitForPatient.mockRejectedValue(
        new Error('Failed to create visit'),
      );

      const { result } = renderHook(() => useCreateVisit(), { wrapper });

      await result.current.createVisit(patientUuid, mockVisitType);

      expect(mockCreateRegistrationEncounterForPatient).not.toHaveBeenCalled();
    });

    it('should not create a visit or registration encounter when the same patient already has an active visit', async () => {
      // useCreateVisit reads patientUuid from the route to check for an active
      // visit; point it at our patient so the guard can engage.
      mockUseParams.mockReturnValue({ patientUuid });
      mockCheckIfActiveVisitExists.mockResolvedValue(true);
      mockUseRegistrationEncounterTypeUuid.mockReturnValue(
        'reg-encounter-type-uuid',
      );

      const { result } = renderHook(() => useActiveVisit(patientUuid), {
        wrapper,
      });

      // Wait for the active-visit check to resolve before starting a visit.
      await waitFor(() => {
        expect(result.current.hasActiveVisit).toBe(true);
      });

      const { result: createVisitResult } = renderHook(() => useCreateVisit(), {
        wrapper,
      });
      await createVisitResult.current.createVisit(patientUuid, mockVisitType);

      expect(mockCreateVisitForPatient).not.toHaveBeenCalled();
      expect(mockCreateRegistrationEncounterForPatient).not.toHaveBeenCalled();
    });

    it('should show error notification when encounter creation fails', async () => {
      const error = new Error('Failed to create encounter');
      mockUseRegistrationEncounterTypeUuid.mockReturnValue(
        'reg-encounter-type-uuid',
      );
      mockCreateRegistrationEncounterForPatient.mockRejectedValue(error);

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

    it('should skip encounter creation when registrationEncounterType is not configured', async () => {
      mockUseRegistrationEncounterTypeUuid.mockReturnValue(undefined);

      const { result } = renderHook(() => useCreateVisit(), { wrapper });

      await result.current.createVisit(patientUuid, mockVisitType);

      await waitFor(() => {
        expect(mockCreateVisitForPatient).toHaveBeenCalled();
      });

      expect(mockCreateRegistrationEncounterForPatient).not.toHaveBeenCalled();
    });

    it('should skip visit creation when a visit already exists in the hasActiveVisit cache', async () => {
      queryClient.setQueryData(['hasActiveVisit', patientUuid], true);

      const { result } = renderHook(() => useCreateVisit(), { wrapper });

      await result.current.createVisit(patientUuid, mockVisitType);

      expect(mockCreateVisitForPatient).not.toHaveBeenCalled();
    });

    it('should not let a stale checkIfActiveVisitExists response overwrite hasActiveVisit after createVisit has already set it to true', async () => {
      let resolveCheckIfActiveVisitExists: (value: boolean) => void;
      mockCheckIfActiveVisitExists.mockReturnValue(
        new Promise((resolve) => {
          resolveCheckIfActiveVisitExists = resolve;
        }),
      );

      // Simulates the remounted VisitTypeSelector's useActiveVisit query,
      // which starts fetching as soon as it mounts -- concurrently with
      // createVisit below, exactly like the real remount scenario.
      const { result: activeVisitResult } = renderHook(
        () => useActiveVisit(patientUuid),
        { wrapper },
      );

      const { result: createVisitResult } = renderHook(() => useCreateVisit(), {
        wrapper,
      });
      await createVisitResult.current.createVisit(patientUuid, mockVisitType);

      expect(queryClient.getQueryData(['hasActiveVisit', patientUuid])).toBe(
        true,
      );

      // The stale GET -- fired before createVisit ran, on a slower
      // backend -- resolves late with its now-outdated "false".
      await act(async () => {
        resolveCheckIfActiveVisitExists!(false);
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(queryClient.getQueryData(['hasActiveVisit', patientUuid])).toBe(
        true,
      );
      expect(activeVisitResult.current.hasActiveVisit).toBe(true);
    });
  });

  describe('useIsCreatingVisit', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    it('should reflect the startVisitInProgress cache entry, updating automatically as it changes', async () => {
      const { result } = renderHook(() => useIsCreatingVisit(), { wrapper });

      expect(result.current).toBe(false);

      queryClient.setQueryData(['startVisitInProgress'], true);

      await waitFor(() => {
        expect(result.current).toBe(true);
      });

      queryClient.setQueryData(['startVisitInProgress'], false);

      await waitFor(() => {
        expect(result.current).toBe(false);
      });
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
