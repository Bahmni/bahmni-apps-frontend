import type { VisitType } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useActiveVisit, useCreateVisit, useVisitTypes } from '../useVisit';

const mockCheckIfActiveVisitExists = jest.fn();
const mockCreateVisitForPatient = jest.fn();
const mockGetVisitTypes = jest.fn();
const mockAddNotification = jest.fn();
const mockFindValidRegistrationEncounterInSession = jest.fn();
const mockCreateRegistrationEncounterForPatient = jest.fn();

const mockUseRegistrationEncounterTypeUuid = jest.fn();
jest.mock('../useRegistrationEncounterTypeUuid', () => ({
  useRegistrationEncounterTypeUuid: () =>
    mockUseRegistrationEncounterTypeUuid(),
}));

const mockLinkRegistrationEncounterToVisit = jest.fn();
jest.mock('../../services/registrationEncounterService', () => ({
  findValidRegistrationEncounterInSession: (...args: unknown[]) =>
    mockFindValidRegistrationEncounterInSession(...args),

  createRegistrationEncounterForPatient: (...args: unknown[]) =>
    mockCreateRegistrationEncounterForPatient(...args),

  linkRegistrationEncounterToVisit: (...args: unknown[]) =>
    mockLinkRegistrationEncounterToVisit(...args),
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

const patientUuid = '9891a8b4-7404-4c05-a207-5ec9d34fc719';
const mockVisitType: VisitType = {
  name: 'OPD',
  uuid: '54f43754-c6ce-4472-890e-0f28acaeaea6',
};

describe('useVisit', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRegistrationEncounterTypeUuid.mockReturnValue(undefined);
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
      mockUseRegistrationEncounterTypeUuid.mockReturnValue(undefined);
      mockLinkRegistrationEncounterToVisit.mockResolvedValue(undefined);
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

    it('should link registration encounter to visit after visit creation when encounter type is configured', async () => {
      mockUseRegistrationEncounterTypeUuid.mockReturnValue(
        'reg-encounter-type-uuid',
      );

      mockFindValidRegistrationEncounterInSession.mockResolvedValue({
        id: 'enc-123',
      });

      const { result } = renderHook(() => useCreateVisit(), { wrapper });

      await result.current.createVisit(patientUuid, mockVisitType);

      await waitFor(() => {
        expect(
          mockCreateRegistrationEncounterForPatient,
        ).not.toHaveBeenCalled();
        expect(mockLinkRegistrationEncounterToVisit).toHaveBeenCalledWith(
          patientUuid,
          'reg-encounter-type-uuid',
        );
      });
    });

    it('should create a registration encounter when none exists and link it to visit', async () => {
      mockUseRegistrationEncounterTypeUuid.mockReturnValue(
        'reg-encounter-type-uuid',
      );

      mockFindValidRegistrationEncounterInSession.mockResolvedValue(null);
      mockCreateRegistrationEncounterForPatient.mockResolvedValue({
        id: 'new-encounter-id',
      });

      const { result } = renderHook(() => useCreateVisit(), { wrapper });

      await result.current.createVisit(patientUuid, mockVisitType);
      expect(mockCreateRegistrationEncounterForPatient).toHaveBeenCalledWith(
        patientUuid,
        'reg-encounter-type-uuid',
      );
      expect(mockLinkRegistrationEncounterToVisit).toHaveBeenCalledWith(
        patientUuid,
        'reg-encounter-type-uuid',
      );
    });

    it('should show error notification when encounter linkage fails', async () => {
      const error = new Error('Failed to link encounter');
      mockUseRegistrationEncounterTypeUuid.mockReturnValue(
        'reg-encounter-type-uuid',
      );
      mockLinkRegistrationEncounterToVisit.mockRejectedValue(error);

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

    it('should skip encounter linkage when registrationEncounterType is not configured', async () => {
      mockUseRegistrationEncounterTypeUuid.mockReturnValue(undefined);

      const { result } = renderHook(() => useCreateVisit(), { wrapper });

      await result.current.createVisit(patientUuid, mockVisitType);

      await waitFor(() => {
        expect(mockCreateVisitForPatient).toHaveBeenCalled();
      });

      expect(mockLinkRegistrationEncounterToVisit).not.toHaveBeenCalled();
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
