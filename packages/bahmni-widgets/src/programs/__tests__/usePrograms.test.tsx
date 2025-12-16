import { getPatientPrograms } from '@bahmni/services';
import { renderHook, waitFor } from '@testing-library/react';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import { useNotification } from '../../notification';
import usePrograms from '../usePrograms';

jest.mock('@bahmni/services', () => ({
  getPatientPrograms: jest.fn(),
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../../hooks/usePatientUUID');
jest.mock('../../notification');

const mockedGetPatientPrograms = getPatientPrograms as jest.MockedFunction<
  typeof getPatientPrograms
>;
const mockedUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;
const mockedUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
>;

const mockAddNotification = jest.fn();

const mockProgramEnrollment = {
  uuid: 'program-uuid-1',
  display: 'HIV Program Enrollment',
  patient: {
    uuid: 'patient-uuid',
    display: 'John Doe',
  },
  program: {
    uuid: 'program-type-uuid',
    name: 'HIV Program',
    display: 'HIV Program',
  },
  dateEnrolled: '2023-01-15T10:00:00.000Z',
  dateCompleted: null,
  dateEnded: null,
  outcome: {
    uuid: 'outcome-uuid',
    display: 'Active Treatment',
  },
  states: [
    {
      uuid: 'state-uuid',
      startDate: '2023-01-15T10:00:00.000Z',
      endDate: null,
      state: {
        uuid: 'state-concept-uuid',
        display: 'Active Treatment',
        concept: {
          uuid: 'concept-uuid',
          display: 'Active Treatment',
        },
      },
    },
  ],
  attributes: [
    {
      uuid: 'attr-uuid',
      display: 'Reference Number',
      attributeType: {
        uuid: 'attr-type-uuid',
        display: 'Reference',
        description: 'Reference Number',
        retired: false,
        format: 'string',
      },
      value: 'REF-12345',
      voided: false,
    },
  ],
  location: {
    uuid: 'location-uuid',
    display: 'Main Hospital',
  },
};

describe('usePrograms', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNotification.mockReturnValue({
      addNotification: mockAddNotification,
      notifications: [],
      removeNotification: jest.fn(),
      clearAllNotifications: jest.fn(),
    });
  });

  it('should return initial loading state', () => {
    mockedUsePatientUUID.mockReturnValue('patient-uuid');
    mockedGetPatientPrograms.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => usePrograms());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.hasError).toBe(false);
    expect(result.current.programs).toEqual([]);
  });

  it('should not fetch programs when patientUUID is null', async () => {
    mockedUsePatientUUID.mockReturnValue(null);

    const { result } = renderHook(() => usePrograms());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockedGetPatientPrograms).not.toHaveBeenCalled();
    expect(result.current.programs).toEqual([]);
    expect(result.current.hasError).toBe(false);
  });

  it('should fetch and map programs successfully', async () => {
    mockedUsePatientUUID.mockReturnValue('patient-uuid');
    mockedGetPatientPrograms.mockResolvedValue({
      activePrograms: [mockProgramEnrollment],
      endedPrograms: [],
    });

    const { result } = renderHook(() => usePrograms());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockedGetPatientPrograms).toHaveBeenCalledWith('patient-uuid');
    expect(result.current.programs).toHaveLength(1);
    expect(result.current.programs[0].programName).toBe('HIV Program');
    expect(result.current.programs[0].referenceNumber).toBe('REF-12345');
    expect(result.current.hasError).toBe(false);
  });

  it('should handle error and show notification', async () => {
    mockedUsePatientUUID.mockReturnValue('patient-uuid');
    const errorMessage = 'Failed to fetch programs';
    mockedGetPatientPrograms.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => usePrograms());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasError).toBe(true);
    expect(result.current.programs).toEqual([]);
    expect(mockAddNotification).toHaveBeenCalledWith({
      title: 'ERROR_DEFAULT_TITLE',
      message: errorMessage,
      type: 'error',
    });
  });

  it('should set loading state correctly during fetch', async () => {
    mockedUsePatientUUID.mockReturnValue('patient-uuid');
    let resolvePromise: (value: {
      activePrograms: any[];
      endedPrograms: any[];
    }) => void;
    const promise = new Promise<{
      activePrograms: any[];
      endedPrograms: any[];
    }>((resolve) => {
      resolvePromise = resolve;
    });
    mockedGetPatientPrograms.mockReturnValue(promise);

    const { result } = renderHook(() => usePrograms());

    expect(result.current.isLoading).toBe(true);

    resolvePromise!({
      activePrograms: [mockProgramEnrollment],
      endedPrograms: [],
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});
