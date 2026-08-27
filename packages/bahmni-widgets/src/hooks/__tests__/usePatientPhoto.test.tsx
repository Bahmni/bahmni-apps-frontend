import { fetchPatientPhotoFromUrl } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { usePatientPhoto } from '../usePatientPhoto';

jest.mock('@bahmni/services');

const mockFetchPatientPhotoFromUrl =
  fetchPatientPhotoFromUrl as jest.MockedFunction<
    typeof fetchPatientPhotoFromUrl
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

  it('should fetch patient photo when photoUrl is provided', async () => {
    const mockPhotoData = 'data:image/jpeg;base64,/9j/4AAQ';
    const photoUrl = '/openmrs/ws/rest/v2/patientImage?patientUuid=patient-123';
    mockFetchPatientPhotoFromUrl.mockResolvedValue(mockPhotoData);

    const { result } = renderHook(() => usePatientPhoto({ photoUrl }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockFetchPatientPhotoFromUrl).toHaveBeenCalledWith(photoUrl);
    expect(result.current.patientPhoto).toBe(mockPhotoData);
  });

  it('should not fetch when photoUrl is undefined', () => {
    const { result } = renderHook(
      () => usePatientPhoto({ photoUrl: undefined }),
      { wrapper: createWrapper() },
    );

    expect(mockFetchPatientPhotoFromUrl).not.toHaveBeenCalled();
    expect(result.current.patientPhoto).toBeUndefined();
  });
});
