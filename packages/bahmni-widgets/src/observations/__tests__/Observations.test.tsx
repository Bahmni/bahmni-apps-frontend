import {
  searchConceptByName,
  useTranslation,
  getPatientObservationsWithEncounterBundle,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import { useNotification } from '../../notification';
import { mockBundleWithMixedObservations } from '../__mocks__/observationTestData';
import Observations from '../Observations';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  searchConceptByName: jest.fn(),
  useTranslation: jest.fn(),
  getPatientObservationsWithEncounterBundle: jest.fn(),
}));

jest.mock('../../hooks/usePatientUUID');
jest.mock('../../notification');

jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  transformObservationToRowCell: jest.fn((obs, index) => ({
    index,
    header: obs.display,
    value: '120 mmHg',
    provider: 'Dr. Smith',
  })),
}));

const mockSearchConceptByName = searchConceptByName as jest.MockedFunction<
  typeof searchConceptByName
>;
const mockGetPatientObservationsWithEncounterBundle =
  getPatientObservationsWithEncounterBundle as jest.MockedFunction<
    typeof getPatientObservationsWithEncounterBundle
  >;
const mockUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;
const mockUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
>;
const mockUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;

const mockAddNotification = jest.fn();

const createWrapper = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
};

describe('Observations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePatientUUID.mockReturnValue('patient-uuid-123');
    mockUseNotification.mockReturnValue({
      addNotification: mockAddNotification,
    } as any);
    mockUseTranslation.mockReturnValue({
      t: (key: string) => key,
    } as any);
  });

  describe('Loading states', () => {
    it('should show loading state when concept queries are loading', () => {
      mockSearchConceptByName.mockReturnValue(new Promise(() => {}) as any);

      const config = {
        titleTranslationKey: 'Obs',
        conceptNames: ['Temperature'],
      };

      createWrapper(<Observations config={config} />);

      expect(screen.getByText('Obs')).toBeInTheDocument();
      // testId includes the translated title when titleTranslationKey is provided
      expect(screen.getByTestId('observations-title-Obs')).toBeInTheDocument();
      expect(
        screen.getByTestId('observations-table-skeleton'),
      ).toBeInTheDocument();
    });

    it('should show loading state when observations query is loading', async () => {
      mockSearchConceptByName.mockResolvedValue({
        uuid: 'concept-uuid-1',
        display: 'Temperature',
      } as any);
      mockGetPatientObservationsWithEncounterBundle.mockReturnValue(
        new Promise(() => {}) as any,
      );

      const config = {
        conceptUuid: ['1342AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'],
      };

      createWrapper(<Observations config={config} />);

      await waitFor(() => {
        expect(
          screen.getByTestId('observations-table-skeleton'),
        ).toBeInTheDocument();
      });
    });

    it('should not show loading when concept queries complete', async () => {
      mockSearchConceptByName.mockResolvedValue({
        uuid: 'concept-uuid-1',
        display: 'Temperature',
      } as any);
      mockGetPatientObservationsWithEncounterBundle.mockResolvedValue(
        mockBundleWithMixedObservations,
      );

      const config = {
        conceptNames: ['Temperature'],
      };

      createWrapper(<Observations config={config} />);

      await waitFor(() => {
        expect(screen.getByText('Temperature')).toBeInTheDocument();
      });
    });
  });

  describe('Error handling with notifications', () => {
    it('should show error notification when concept search fails', async () => {
      mockSearchConceptByName.mockRejectedValue(new Error('Concept not found'));

      const config = {
        conceptNames: ['InvalidConcept'],
      };

      createWrapper(<Observations config={config} />);

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith({
          title: 'ERROR_DEFAULT_TITLE',
          message: 'ERROR_FETCHING_CONCEPT',
          type: 'error',
        });
      });
    });

    it('should show error notification when observations fetch fails', async () => {
      mockSearchConceptByName.mockResolvedValue({
        uuid: 'concept-uuid-1',
        display: 'Temperature',
      } as any);
      mockGetPatientObservationsWithEncounterBundle.mockRejectedValue(
        new Error('Fetch failed'),
      );

      const config = {
        conceptNames: ['Temperature'],
      };

      createWrapper(<Observations config={config} />);

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith({
          title: 'ERROR_DEFAULT_TITLE',
          message: 'ERROR_FETCHING_OBSERVATIONS',
          type: 'error',
        });
      });
    });

    it('should show error message in SortableDataTable when observations error occurs', async () => {
      mockSearchConceptByName.mockResolvedValue({
        uuid: 'concept-uuid-1',
        display: 'Temperature',
      } as any);
      mockGetPatientObservationsWithEncounterBundle.mockRejectedValue(
        new Error('Fetch failed'),
      );

      const config = {
        conceptNames: ['Temperature'],
      };

      createWrapper(<Observations config={config} />);

      await waitFor(() => {
        expect(
          screen.getByText('ERROR_FETCHING_OBSERVATIONS'),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Empty states', () => {
    it('should show empty message when no observations are returned', async () => {
      mockSearchConceptByName.mockResolvedValue({
        uuid: 'concept-uuid-1',
        display: 'Temperature',
      } as any);
      mockGetPatientObservationsWithEncounterBundle.mockResolvedValue({
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [],
      } as any);

      const config = {
        conceptNames: ['Temperature'],
      };

      createWrapper(<Observations config={config} />);

      await waitFor(() => {
        expect(screen.getByText('NO_OBSERVATIONS_FOUND')).toBeInTheDocument();
      });
    });

    it('should show empty message when no concept UUIDs are provided', async () => {
      const config = {
        conceptNames: [],
        conceptUuid: [],
      };

      createWrapper(<Observations config={config} />);

      await waitFor(() => {
        expect(screen.getByText('NO_OBSERVATIONS_FOUND')).toBeInTheDocument();
      });
    });

    it('should show empty message when observations bundle has no entries', async () => {
      mockSearchConceptByName.mockResolvedValue({
        uuid: 'concept-uuid-1',
        display: 'Temperature',
      } as any);
      mockGetPatientObservationsWithEncounterBundle.mockResolvedValue({
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [],
      } as any);

      const config = {
        conceptNames: ['Temperature'],
      };

      createWrapper(<Observations config={config} />);

      await waitFor(() => {
        expect(screen.getByText('NO_OBSERVATIONS_FOUND')).toBeInTheDocument();
      });
    });
  });
});
