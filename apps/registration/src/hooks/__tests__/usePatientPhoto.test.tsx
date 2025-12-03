import { getPatientImageAsDataUrl } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { usePatientPhoto } from '../usePatientPhoto';

jest.mock('@bahmni/services');

const mockGetPatientImageAsDataUrl =
  getPatientImageAsDataUrl as jest.MockedFunction<
    typeof getPatientImageAsDataUrl
  >;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'TestWrapper';
  return Wrapper;
};

describe('usePatientPhoto', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch patient photo when patientUuid is provided', async () => {
    const mockPhotoData = 'data:image/jpeg;base64,/9j/4AAQ';
    mockGetPatientImageAsDataUrl.mockResolvedValue(mockPhotoData);

    const { result } = renderHook(
      () =>
        usePatientPhoto({
          patientUuid: 'patient-123',
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockGetPatientImageAsDataUrl).toHaveBeenCalledWith('patient-123');
    expect(result.current.patientPhoto).toBe(mockPhotoData);
  });

  it('should not fetch when patientUuid is undefined', () => {
    const { result } = renderHook(
      () =>
        usePatientPhoto({
          patientUuid: undefined,
        }),
      { wrapper: createWrapper() },
    );

    expect(mockGetPatientImageAsDataUrl).not.toHaveBeenCalled();
    expect(result.current.patientPhoto).toBeUndefined();
  });
});
