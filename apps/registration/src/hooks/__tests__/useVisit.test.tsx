import type { VisitType } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
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

    it('should not start a second createVisitForPatient call for the same patient while the first is still in flight, even from a separate hook instance (simulating a remount)', async () => {
      let resolveCreateVisitForPatient: (value: unknown) => void;
      mockCreateVisitForPatient.mockReturnValue(
        new Promise((resolve) => {
          resolveCreateVisitForPatient = resolve;
        }),
      );

      const { result: firstInstance } = renderHook(() => useCreateVisit(), {
        wrapper,
      });
      const firstCallPromise = firstInstance.current.createVisit(
        patientUuid,
        mockVisitType,
      );

      // A second hook instance sharing the same QueryClient (as would happen
      // after RegistrationActions unmounts/remounts on a route change) must
      // see the in-flight guard and refuse to start a duplicate call.
      const { result: secondInstance } = renderHook(() => useCreateVisit(), {
        wrapper,
      });
      await secondInstance.current.createVisit(patientUuid, mockVisitType);

      expect(mockCreateVisitForPatient).toHaveBeenCalledTimes(1);

      resolveCreateVisitForPatient!({});
      await firstCallPromise;
    });
  });

  describe('useIsCreatingVisit', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/patient/${patientUuid}`]}>
          {children}
        </MemoryRouter>
      </QueryClientProvider>
    );

    beforeEach(() => {
      mockCheckIfActiveVisitExists.mockResolvedValue(false);
      mockUseRegistrationEncounterTypeUuid.mockReturnValue(undefined);
    });

    it('should report true while createVisit is in flight and false once it settles, including from a separately mounted hook instance', async () => {
      let resolveCreateVisitForPatient: (value: unknown) => void;
      mockCreateVisitForPatient.mockReturnValue(
        new Promise((resolve) => {
          resolveCreateVisitForPatient = resolve;
        }),
      );

      const { result: createVisitHook } = renderHook(() => useCreateVisit(), {
        wrapper,
      });
      const { result: loadingStateHook, rerender } = renderHook(
        () => useIsCreatingVisit(patientUuid),
        { wrapper },
      );

      expect(loadingStateHook.current).toBe(false);

      const createVisitPromise = createVisitHook.current.createVisit(
        patientUuid,
        mockVisitType,
      );

      await waitFor(() => {
        rerender();
        expect(loadingStateHook.current).toBe(true);
      });

      resolveCreateVisitForPatient!({});
      await createVisitPromise;

      await waitFor(() => {
        rerender();
        expect(loadingStateHook.current).toBe(false);
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
