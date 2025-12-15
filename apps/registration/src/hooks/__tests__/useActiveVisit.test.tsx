import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useActiveVisit } from '../useActiveVisit';

const mockCheckIfActiveVisitExists = jest.fn();

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  checkIfActiveVisitExists: (patientUuid: string) =>
    mockCheckIfActiveVisitExists(patientUuid),
}));

const patientUuid = '9891a8b4-7404-4c05-a207-5ec9d34fc719';

describe('useActiveVisit', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
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
  });

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
