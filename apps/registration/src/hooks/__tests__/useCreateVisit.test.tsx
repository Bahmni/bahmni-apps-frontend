import type { VisitType } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useCreateVisit } from '../useCreateVisit';

const mockCreateVisitForPatient = jest.fn();
const mockCheckIfActiveVisitExists = jest.fn();
const mockAddNotification = jest.fn();

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  createVisitForPatient: (patientUuid: string, visitType: any) =>
    mockCreateVisitForPatient(patientUuid, visitType),
  checkIfActiveVisitExists: (patientUuid: string) =>
    mockCheckIfActiveVisitExists(patientUuid),
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

describe('useCreateVisit', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/patient/${patientUuid}`]}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    mockCheckIfActiveVisitExists.mockResolvedValue(false);
    mockCreateVisitForPatient.mockResolvedValue({});
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
});
