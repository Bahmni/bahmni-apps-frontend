import {
  formatObservations,
  getPatientObservations,
  useConcept,
} from '@bahmni/services';
import { renderHook, waitFor } from '@testing-library/react';

import { usePatientUUID } from '../../hooks/usePatientUUID';
import { useNotification } from '../../notification';
import { useObservations } from '../useObservations';

jest.mock('@bahmni/services');
jest.mock('../../hooks/usePatientUUID');
jest.mock('../../notification');
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockGetPatientObservations =
  getPatientObservations as jest.MockedFunction<typeof getPatientObservations>;
const mockFormatObservations = formatObservations as jest.MockedFunction<
  typeof formatObservations
>;
const mockUseConcept = useConcept as jest.MockedFunction<typeof useConcept>;
const mockUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;
const mockUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
>;

describe('useObservations', () => {
  const mockAddNotification = jest.fn();
  const mockPatientUUID = 'patient-123';
  const mockGetConceptUuids = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNotification.mockReturnValue({
      addNotification: mockAddNotification,
      removeNotification: jest.fn(),
      clearAllNotifications: jest.fn(),
      notifications: [],
    });
    mockUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockUseConcept.mockReturnValue({
      getConceptUuids: mockGetConceptUuids,
    });
  });

  it('should fetch observations with concept codes successfully', async () => {
    const mockBundle = {
      resourceType: 'Bundle' as const,
      total: 1,
      entry: [],
    };
    const mockFormattedObs = [
      {
        id: 'obs-1',
        conceptName: 'Temperature',
        value: '98.6',
        date: '2024-01-01',
        isParent: false,
        children: [],
      },
    ];

    mockGetPatientObservations.mockResolvedValue(mockBundle as any);
    mockFormatObservations.mockReturnValue(mockFormattedObs);

    const { result } = renderHook(() =>
      useObservations({
        conceptCodes: ['concept-uuid-1'],
      }),
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetPatientObservations).toHaveBeenCalledWith(mockPatientUUID, [
      'concept-uuid-1',
    ]);
    expect(result.current.observations).toEqual(mockFormattedObs);
    expect(result.current.error).toBeNull();
  });

  it('should fetch observations with concept names successfully', async () => {
    const mockBundle = {
      resourceType: 'Bundle' as const,
      total: 1,
      entry: [],
    };
    const mockFormattedObs = [
      {
        id: 'obs-1',
        conceptName: 'Temperature',
        value: '98.6',
        date: '2024-01-01',
        isParent: false,
        children: [],
      },
    ];
    const mockUuids = ['uuid-1'];

    mockGetConceptUuids.mockResolvedValue(mockUuids);
    mockGetPatientObservations.mockResolvedValue(mockBundle as any);
    mockFormatObservations.mockReturnValue(mockFormattedObs);

    const { result } = renderHook(() =>
      useObservations({
        conceptNames: ['Temperature'],
      }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetConceptUuids).toHaveBeenCalledWith(['Temperature']);
    expect(mockGetPatientObservations).toHaveBeenCalledWith(
      mockPatientUUID,
      mockUuids,
    );
    expect(result.current.observations).toEqual(mockFormattedObs);
  });

  it('should handle error when fetching observations fails', async () => {
    const error = new Error('Failed to fetch observations');
    mockGetPatientObservations.mockRejectedValue(error);

    const { result } = renderHook(() =>
      useObservations({
        conceptCodes: ['concept-uuid-1'],
      }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.observations).toEqual([]);
    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'error',
      title: 'ERROR',
      message: 'Failed to fetch observations',
    });
  });

  it('should handle error when getConceptUuids fails', async () => {
    const error = new Error('Failed to fetch concept UUIDs');
    mockGetConceptUuids.mockRejectedValue(error);

    const { result } = renderHook(() =>
      useObservations({
        conceptNames: ['Temperature'],
      }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.observations).toEqual([]);
    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'error',
      title: 'ERROR',
      message: 'Failed to fetch concept UUIDs',
    });
  });
});
