import { renderHook, waitFor, act } from '@testing-library/react';
import {
  FormattedPatientData,
  getFormattedPatientById,
  getFormattedError,
} from '@bahmni-frontend/bahmni-services';
import { usePatient } from '../usePatient';
import { usePatientUUID } from '../usePatientUUID';

jest.mock('@bahmni-frontend/bahmni-services');
const mockedGetFormattedPatientById =
  getFormattedPatientById as jest.MockedFunction<
    typeof getFormattedPatientById
  >;
const mockedGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

jest.mock('../usePatientUUID');
const mockedUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;

describe('usePatient hook', () => {
  const mockPatientData: FormattedPatientData = {
    id: 'test-uuid',
    fullName: 'John Doe',
    gender: 'M',
    birthDate: '1994-01-01',
    formattedAddress: '123 Main St, Anytown, State, Country 12345',
    formattedContact: '+1-555-0123',
    identifiers: new Map<string, string>([
      ['OpenMRS ID', 'OP12345'],
      ['National ID', 'NAT67890'],
    ]),
    age: {
      years: 30,
      months: 6,
      days: 15,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state during fetch', async () => {
    mockedUsePatientUUID.mockReturnValue('test-uuid');
    mockedGetFormattedPatientById.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockPatientData), 100)));

    const { result } = renderHook(() => usePatient());

    expect(result.current.loading).toBe(true);
    expect(result.current.patient).toBeNull();
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.patient).toEqual(mockPatientData);
    });
  });

  it('fetches patient data successfully', async () => {
    mockedUsePatientUUID.mockReturnValue('test-uuid');
    mockedGetFormattedPatientById.mockResolvedValueOnce(mockPatientData);

    const { result } = renderHook(() => usePatient());

    await waitFor(() => {
      expect(result.current.patient).toEqual(mockPatientData);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    expect(mockedGetFormattedPatientById).toHaveBeenCalledWith('test-uuid');
  });

  it('sets error when patientUUID is invalid', async () => {
    mockedUsePatientUUID.mockReturnValue(null);

    const { result } = renderHook(() => usePatient());

    await waitFor(() => {
      expect(result.current.error).toEqual(new Error('Invalid patient UUID'));
      expect(result.current.patient).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    expect(mockedGetFormattedPatientById).not.toHaveBeenCalled();
  });

  it('handles API errors', async () => {
    const mockError = new Error('Failed to fetch patient');
    mockedUsePatientUUID.mockReturnValue('test-uuid');
    mockedGetFormattedPatientById.mockRejectedValueOnce(mockError);
    mockedGetFormattedError.mockReturnValue({
      title: 'Error',
      message: 'Failed to fetch patient'
    });

    const { result } = renderHook(() => usePatient());

    await waitFor(() => {
      expect(result.current.error).toEqual(mockError);
      expect(result.current.patient).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  it('handles non-Error rejections using getFormattedError', async () => {
    const nonErrorObject = { message: 'API error' };
    const formattedErrorMessage = 'Formatted API error';
    mockedUsePatientUUID.mockReturnValue('test-uuid');
    mockedGetFormattedPatientById.mockRejectedValueOnce(nonErrorObject);
    mockedGetFormattedError.mockReturnValue({
      title: 'Error',
      message: formattedErrorMessage
    });

    const { result } = renderHook(() => usePatient());

    await waitFor(() => {
      expect(result.current.error).toEqual(new Error(formattedErrorMessage));
      expect(result.current.patient).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    expect(mockedGetFormattedError).toHaveBeenCalledWith(nonErrorObject);
  });

  it('refetches data when refetch is called', async () => {
    mockedUsePatientUUID.mockReturnValue('test-uuid');
    mockedGetFormattedPatientById.mockResolvedValue(mockPatientData);

    const { result } = renderHook(() => usePatient());

    await waitFor(() => {
      expect(result.current.patient).toEqual(mockPatientData);
    });

    mockedGetFormattedPatientById.mockClear();
    const updatedData = { ...mockPatientData, fullName: 'Jane Doe' };
    mockedGetFormattedPatientById.mockResolvedValueOnce(updatedData);

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.patient).toEqual(updatedData);
    });
    expect(mockedGetFormattedPatientById).toHaveBeenCalledWith('test-uuid');
  });

  it('refetches when patientUUID changes', async () => {
    mockedUsePatientUUID.mockReturnValue('initial-uuid');
    mockedGetFormattedPatientById.mockResolvedValue(mockPatientData);

    const { result, rerender } = renderHook(() => usePatient());

    await waitFor(() => {
      expect(result.current.patient).toEqual(mockPatientData);
    });

    mockedUsePatientUUID.mockReturnValue('new-uuid');
    const newPatientData = { ...mockPatientData, id: 'new-uuid' };
    mockedGetFormattedPatientById.mockResolvedValueOnce(newPatientData);

    rerender();

    await waitFor(() => {
      expect(result.current.patient).toEqual(newPatientData);
    });
    expect(mockedGetFormattedPatientById).toHaveBeenCalledWith('new-uuid');
  });

  it('clears error on successful refetch after failure', async () => {
    const mockError = new Error('Network error');
    mockedUsePatientUUID.mockReturnValue('test-uuid');
    mockedGetFormattedPatientById.mockRejectedValueOnce(mockError);
    mockedGetFormattedError.mockReturnValue({
      title: 'Error',
      message: 'Network error'
    });

    const { result } = renderHook(() => usePatient());

    await waitFor(() => {
      expect(result.current.error).toEqual(mockError);
    });

    mockedGetFormattedPatientById.mockResolvedValueOnce(mockPatientData);

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.patient).toEqual(mockPatientData);
      expect(result.current.error).toBeNull();
    });
  });
});
