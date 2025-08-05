import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotification } from '../../notification';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import {
  getFormattedAllergies,
  getFormattedError,
  FormattedAllergy,
} from '@bahmni-frontend/bahmni-services';
import {
  AllergyStatus,
  AllergySeverity,
} from '@bahmni-frontend/bahmni-services';
import { useAllergies } from '../useAllergies';

jest.mock('@bahmni-frontend/bahmni-services', () => ({
  getFormattedAllergies: jest.fn(),
  getFormattedError: jest.fn(),
}));
jest.mock('../../notification');
jest.mock('../../hooks/usePatientUUID');

const mockedGetFormattedAllergies =
  getFormattedAllergies as jest.MockedFunction<typeof getFormattedAllergies>;
const mockedGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;
jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));
describe('useAllergies', () => {
  const mockAddNotification = jest.fn();
  const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';

  const mockAllergy: FormattedAllergy = {
    id: 'allergy-1',
    display: 'Penicillin',
    category: ['medication'],
    criticality: 'high',
    status: 'Active',
    recordedDate: '2024-01-15T10:30:00Z',
    recorder: 'Dr. Smith',
    reactions: [
      {
        manifestation: ['Rash', 'Itching'],
        severity: 'moderate',
      },
    ],
    severity: 'moderate',
    note: 'Patient reported allergic reaction',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePatientUUID as jest.Mock).mockReturnValue(patientUUID);
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });
    mockedGetFormattedError.mockReturnValue({
      title: 'Error',
      message: 'An error occurred',
    });
  });

  it('fetches and returns allergies successfully', async () => {
    const mockAllergies = [mockAllergy];
    mockedGetFormattedAllergies.mockResolvedValueOnce(mockAllergies);

    const { result } = renderHook(() => useAllergies());

    expect(mockedGetFormattedAllergies).toHaveBeenCalledWith(patientUUID);

    await waitFor(() => {
      expect(result.current.allergies).toBe(mockAllergies);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockAddNotification).not.toHaveBeenCalled();
    });
  });

  it('handles empty allergies array', async () => {
    mockedGetFormattedAllergies.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useAllergies());

    await waitFor(() => {
      expect(result.current.allergies).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it('handles invalid patient UUID', async () => {
    (usePatientUUID as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => useAllergies());

    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'error',
      title: 'Error',
      message: 'Invalid patient UUID',
    });
    expect(mockedGetFormattedAllergies).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(result.current.error).toEqual(new Error('Invalid patient UUID'));
      expect(result.current.loading).toBe(false);
      expect(result.current.allergies).toEqual([]);
    });
  });

  it('handles API errors', async () => {
    const error = new Error('Network error');
    mockedGetFormattedAllergies.mockRejectedValueOnce(error);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Network Error',
      message: 'Network error',
    });

    const { result } = renderHook(() => useAllergies());

    await waitFor(() => {
      expect(mockedGetFormattedError).toHaveBeenCalledWith(error);
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Network Error',
        message: 'Network error',
      });
      expect(result.current.error).toEqual(error);
      expect(result.current.loading).toBe(false);
      expect(result.current.allergies).toEqual([]);
    });
  });

  it('handles non-Error objects in catch block', async () => {
    const errorMessage = 'Request failed';
    const nonErrorObject = { message: errorMessage, status: 500 };
    mockedGetFormattedAllergies.mockRejectedValueOnce(nonErrorObject);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Request Error',
      message: errorMessage,
    });

    const { result } = renderHook(() => useAllergies());

    await waitFor(() => {
      expect(result.current.error).toEqual(new Error(errorMessage));
      expect(result.current.loading).toBe(false);
    });
  });

  it('refetches allergies when refetch is called', async () => {
    const initialAllergies = [mockAllergy];
    const updatedAllergies = [
      mockAllergy,
      { ...mockAllergy, id: 'allergy-2', display: 'Aspirin' },
    ];

    mockedGetFormattedAllergies.mockResolvedValueOnce(initialAllergies);

    const { result } = renderHook(() => useAllergies());

    await waitFor(() => {
      expect(result.current.allergies).toBe(initialAllergies);
    });

    mockedGetFormattedAllergies.mockClear();
    mockedGetFormattedAllergies.mockResolvedValueOnce(updatedAllergies);

    act(() => {
      result.current.refetch();
    });

    expect(mockedGetFormattedAllergies).toHaveBeenCalledWith(patientUUID);

    await waitFor(() => {
      expect(result.current.allergies).toBe(updatedAllergies);
      expect(result.current.loading).toBe(false);
    });
  });

  it('refetches when patientUUID changes', async () => {
    const newPatientUUID = 'new-patient-uuid';
    mockedGetFormattedAllergies.mockResolvedValue([mockAllergy]);

    const { rerender } = renderHook(() => useAllergies());

    expect(mockedGetFormattedAllergies).toHaveBeenCalledWith(patientUUID);

    (usePatientUUID as jest.Mock).mockReturnValue(newPatientUUID);
    rerender();

    await waitFor(() => {
      expect(mockedGetFormattedAllergies).toHaveBeenCalledWith(newPatientUUID);
    });
  });

  it('shows loading state during fetch', async () => {
    let resolvePromise: (value: FormattedAllergy[]) => void;
    const pendingPromise = new Promise<FormattedAllergy[]>((resolve) => {
      resolvePromise = resolve;
    });
    mockedGetFormattedAllergies.mockReturnValueOnce(pendingPromise);

    const { result } = renderHook(() => useAllergies());

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
      expect(result.current.allergies).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    act(() => {
      resolvePromise!([mockAllergy]);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.allergies).toEqual([mockAllergy]);
    });
  });

  it('shows loading state during refetch', async () => {
    mockedGetFormattedAllergies.mockResolvedValueOnce([mockAllergy]);

    const { result } = renderHook(() => useAllergies());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.allergies).toEqual([mockAllergy]);
    });

    let resolveRefetch: (value: FormattedAllergy[]) => void;
    const pendingRefetch = new Promise<FormattedAllergy[]>((resolve) => {
      resolveRefetch = resolve;
    });
    mockedGetFormattedAllergies.mockReturnValueOnce(pendingRefetch);

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    act(() => {
      resolveRefetch!([mockAllergy]);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});
