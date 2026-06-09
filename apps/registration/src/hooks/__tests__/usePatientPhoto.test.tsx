import { fetchPatientPhotoFromUrl } from '@bahmni/services';
import { useHasPrivilege } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { usePatientPhoto } from '../usePatientPhoto';

jest.mock('@bahmni/services');
jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useHasPrivilege: jest.fn(),
}));

const mockFetchPatientPhotoFromUrl =
  fetchPatientPhotoFromUrl as jest.MockedFunction<
    typeof fetchPatientPhotoFromUrl
  >;
const mockUseHasPrivilege = useHasPrivilege as jest.MockedFunction<
  typeof useHasPrivilege
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
    mockUseHasPrivilege.mockReturnValue(true);
  });

  it('should fetch patient photo when photoUrl is provided and has privilege', async () => {
    const mockPhotoData = 'data:image/jpeg;base64,/9j/4AAQ';
    const photoUrl = '/openmrs/ws/fhir2/R4/Patient/patient-123/$photo';
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

  it('should not fetch when user lacks Get Patient Photo privilege', () => {
    mockUseHasPrivilege.mockReturnValue(false);

    const { result } = renderHook(
      () =>
        usePatientPhoto({
          photoUrl: '/openmrs/ws/fhir2/R4/Patient/patient-123/$photo',
        }),
      { wrapper: createWrapper() },
    );

    expect(mockFetchPatientPhotoFromUrl).not.toHaveBeenCalled();
    expect(result.current.patientPhoto).toBeUndefined();
  });
});
