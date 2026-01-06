import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { render, screen, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useNotification } from '../../notification';
import RadiologyInvestigationTable from '../RadiologyInvestigationTable';

expect.extend(toHaveNoViolations);

jest.mock('../../notification');
jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(() => 'test-patient-uuid'),
}));
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getPatientRadiologyInvestigations: jest.fn(),
}));

const mockAddNotification = jest.fn();

describe('RadiologyInvestigationTable', () => {
  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = (
    <QueryClientProvider client={queryClient}>
      <RadiologyInvestigationTable />
    </QueryClientProvider>
  );

  it('should show loading state when data is loading', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: null,
      error: null,
      isError: false,
      isLoading: true,
    });
    render(wrapper);
    expect(
      screen.getByTestId('radiology-investigations-table-test-id'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('sortable-table-skeleton')).toBeInTheDocument();
  });

  it('should show error state when an error occurs', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: null,
      error: new Error('An unexpected error occurred'),
      isError: true,
      isLoading: false,
    });
    render(wrapper);
    expect(
      screen.getByTestId('radiology-investigations-table-test-id'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('sortable-table-error')).toBeInTheDocument();
    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'error',
      title: 'ERROR_DEFAULT_TITLE',
      message: 'An unexpected error occurred',
    });
  });

  it('should show empty state when there is no data', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [],
      error: null,
      isError: false,
      isLoading: false,
    });
    render(wrapper);
    expect(
      screen.getByTestId('radiology-investigations-table-test-id'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('sortable-table-empty')).toBeInTheDocument();
  });

  it('should show radiology investigations table when patient has investigations', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [
        {
          id: 'investigation-1',
          testName: 'Chest X-Ray',
          priority: 'stat',
          orderedBy: 'Dr. Smith',
          orderedDate: '2023-12-01T10:30:00.000Z',
          note: 'Patient should be fasting',
        },
        {
          id: 'investigation-2',
          testName: 'CT Scan',
          priority: 'routine',
          orderedBy: 'Dr. Johnson',
          orderedDate: '2023-12-01T14:15:00.000Z',
        },
      ],
      error: null,
      isError: false,
      isLoading: false,
    });
    render(wrapper);
    expect(
      screen.getByTestId('radiology-investigations-table-test-id'),
    ).toBeInTheDocument();
    expect(screen.getByText('Chest X-Ray')).toBeInTheDocument();
    expect(screen.getByText('CT Scan')).toBeInTheDocument();
    expect(screen.getByText('RADIOLOGY_PRIORITY_URGENT')).toBeInTheDocument();
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(screen.getByText('Dr. Johnson')).toBeInTheDocument();
  });

  describe('emptyEncounterFilter condition', () => {
    it('should not fetch radiology investigations when emptyEncounterFilter is true (episodeOfCareUuids has values and encounterUuids is empty)', async () => {
      mockGetPatientRadiologyInvestigations.mockResolvedValue(
        mockRadiologyInvestigations,
      );

      render(
        renderRadiologyInvestigations(
          { orderType: 'Radiology Order' },
          [], // empty encounterUuids
          ['episode-1'], // episodeOfCareUuids has values
        ),
      );

      await waitFor(() => {
        expect(
          screen.getByText('No radiology investigations recorded'),
        ).toBeInTheDocument();
      });

      // Verify that getPatientRadiologyInvestigations was NOT called
      expect(mockGetPatientRadiologyInvestigations).not.toHaveBeenCalled();
    });

    it('should fetch radiology investigations when emptyEncounterFilter is false (episodeOfCareUuids is empty)', async () => {
      mockGroupByDate.mockReturnValue([
        {
          date: '2023-12-01',
          items: [
            mockRadiologyInvestigations[0],
            mockRadiologyInvestigations[1],
          ],
        },
      ]);

      mockGetPatientRadiologyInvestigations.mockResolvedValue(
        mockRadiologyInvestigations,
      );

      render(
        renderRadiologyInvestigations(
          { orderType: 'Radiology Order' },
          ['encounter-1'], // encounterUuids has values
          [], // empty episodeOfCareUuids
        ),
      );

      await waitFor(() => {
        expect(mockGetPatientRadiologyInvestigations).toHaveBeenCalled();
      });
    });

    it('should fetch radiology investigations when emptyEncounterFilter is false (both have values)', async () => {
      mockGroupByDate.mockReturnValue([
        {
          date: '2023-12-01',
          items: [
            mockRadiologyInvestigations[0],
            mockRadiologyInvestigations[1],
          ],
        },
      ]);

      mockGetPatientRadiologyInvestigations.mockResolvedValue(
        mockRadiologyInvestigations,
      );

      render(
        renderRadiologyInvestigations(
          { orderType: 'Radiology Order' },
          ['encounter-1'], // encounterUuids has values
          ['episode-1'], // episodeOfCareUuids has values
        ),
      );

      await waitFor(() => {
        expect(mockGetPatientRadiologyInvestigations).toHaveBeenCalled();
      });
    });

    it('should fetch radiology investigations when emptyEncounterFilter is false (no episode provided)', async () => {
      mockGroupByDate.mockReturnValue([
        {
          date: '2023-12-01',
          items: [
            mockRadiologyInvestigations[0],
            mockRadiologyInvestigations[1],
          ],
        },
      ]);

      mockGetPatientRadiologyInvestigations.mockResolvedValue(
        mockRadiologyInvestigations,
      );

      render(renderRadiologyInvestigations({ orderType: 'Radiology Order' }));

      await waitFor(() => {
        expect(mockGetPatientRadiologyInvestigations).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('passes accessibility tests with data', async () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [
          {
            id: 'investigation-1',
            testName: 'Chest X-Ray',
            priority: 'stat',
            orderedBy: 'Dr. Smith',
            orderedDate: '2023-12-01T10:30:00.000Z',
          },
          {
            id: 'investigation-2',
            testName: 'CT Scan',
            priority: 'routine',
            orderedBy: 'Dr. Johnson',
            orderedDate: '2023-12-01T14:15:00.000Z',
          },
        ],
        error: null,
        isError: false,
        isLoading: false,
      });
      const { container } = render(wrapper);
      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });
});
