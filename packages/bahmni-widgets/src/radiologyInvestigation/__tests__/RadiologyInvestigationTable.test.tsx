import {
  RadiologyInvestigation,
  groupByDate,
  formatDate,
  FULL_MONTH_DATE_FORMAT,
  ISO_DATE_FORMAT,
  useTranslation,
  getOrderTypes,
  getPatientRadiologyInvestigations,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import { useNotification } from '../../notification';
import RadiologyInvestigationTable from '../RadiologyInvestigationTable';
import {
  sortRadiologyInvestigationsByPriority,
  filterRadiologyInvestionsReplacementEntries,
} from '../utils';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: jest.fn(),
  groupByDate: jest.fn(),
  formatDate: jest.fn(),
  getOrderTypes: jest.fn(),
  getPatientRadiologyInvestigations: jest.fn(),
}));

jest.mock('../utils', () => ({
  sortRadiologyInvestigationsByPriority: jest.fn(),
  filterRadiologyInvestionsReplacementEntries: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

jest.mock('../../notification', () => ({
  useNotification: jest.fn(),
}));

jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(),
}));

const mockUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;
const mockGetOrderTypes = getOrderTypes as jest.MockedFunction<
  typeof getOrderTypes
>;
const mockGetPatientRadiologyInvestigations =
  getPatientRadiologyInvestigations as jest.MockedFunction<
    typeof getPatientRadiologyInvestigations
  >;
const mockUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
>;
const mockUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;
const mockGroupByDate = groupByDate as jest.MockedFunction<typeof groupByDate>;
const mockFormatDate = formatDate as jest.MockedFunction<typeof formatDate>;
const mockSortRadiologyInvestigationsByPriority =
  sortRadiologyInvestigationsByPriority as jest.MockedFunction<
    typeof sortRadiologyInvestigationsByPriority
  >;
const mockFilterRadiologyInvestionsReplacementEntries =
  filterRadiologyInvestionsReplacementEntries as jest.MockedFunction<
    typeof filterRadiologyInvestionsReplacementEntries
  >;

const renderRadiologyInvestigations = (
  config = { orderType: 'Radiology Order' },
  encounterUuids?: string[],
  episodeOfCareUuids?: string[],
) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <RadiologyInvestigationTable
        config={config}
        encounterUuids={encounterUuids}
        episodeOfCareUuids={episodeOfCareUuids}
      />
    </QueryClientProvider>
  );
};

const mockRadiologyInvestigations: RadiologyInvestigation[] = [
  {
    id: 'order-1',
    testName: 'Chest X-Ray',
    priority: 'stat',
    orderedBy: 'Dr. Smith',
    orderedDate: '2023-12-01T10:30:00.000Z',
  },
  {
    id: 'order-2',
    testName: 'CT Scan',
    priority: 'routine',
    orderedBy: 'Dr. Johnson',
    orderedDate: '2023-12-01T14:15:00.000Z',
  },
  {
    id: 'order-3',
    testName: 'MRI',
    priority: 'stat',
    orderedBy: 'Dr. Brown',
    orderedDate: '2023-11-30T09:00:00.000Z',
  },
];

describe('RadiologyInvestigationTable', () => {
  const mockAddNotification = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseTranslation.mockReturnValue({
      t: ((key: string) => {
        const translations: Record<string, string> = {
          RADIOLOGY_TEST_NAME: 'Test Name',
          RADIOLOGY_RESULTS: 'Results',
          RADIOLOGY_ORDERED_BY: 'Ordered By',
          RADIOLOGY_INVESTIGATION_HEADING: 'Radiology Investigations',
          NO_RADIOLOGY_INVESTIGATIONS: 'No radiology investigations recorded',
          RADIOLOGY_PRIORITY_URGENT: 'Urgent',
          RADIOLOGY_ERROR_LOADING: 'Error loading radiology investigations',
          ERROR_DEFAULT_TITLE: 'Error',
        };
        return translations[key] || key;
      }) as any,
    } as any);

    mockUsePatientUUID.mockReturnValue('patient-123');
    mockUseNotification.mockReturnValue({
      addNotification: mockAddNotification,
      notifications: [],
      removeNotification: jest.fn(),
      clearAllNotifications: jest.fn(),
    });

    mockGetOrderTypes.mockResolvedValue({
      results: [
        {
          uuid: 'radiology-order-type-uuid',
          display: 'Radiology Order',
          conceptClasses: [],
        },
      ],
    } as any);

    mockFormatDate.mockReturnValue({ formattedResult: '01/12/2023' });
    mockFilterRadiologyInvestionsReplacementEntries.mockImplementation(
      (data) => data,
    );
    mockSortRadiologyInvestigationsByPriority.mockImplementation(
      (data) => data,
    );
    mockGroupByDate.mockReturnValue([]);
  });

  it('renders loading state', async () => {
    mockGetPatientRadiologyInvestigations.mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    render(renderRadiologyInvestigations());

    await waitFor(() => {
      expect(screen.getByTestId('sortable-table-skeleton')).toBeInTheDocument();
    });
  });

  it('renders error state', async () => {
    mockGetPatientRadiologyInvestigations.mockRejectedValue(
      new Error('Network error'),
    );

    render(renderRadiologyInvestigations());

    await waitFor(() => {
      expect(
        screen.getByText('Error loading radiology investigations'),
      ).toBeInTheDocument();
    });
  });

  it('renders empty state', async () => {
    mockGetPatientRadiologyInvestigations.mockResolvedValue([]);

    render(renderRadiologyInvestigations());

    await waitFor(() => {
      expect(
        screen.getByText('No radiology investigations recorded'),
      ).toBeInTheDocument();
    });
  });

  it('processes data through transformation pipeline', async () => {
    mockGroupByDate.mockReturnValue([
      {
        date: '2023-12-01',
        items: [mockRadiologyInvestigations[0], mockRadiologyInvestigations[1]],
      },
      { date: '2023-11-30', items: [mockRadiologyInvestigations[2]] },
    ]);

    mockGetPatientRadiologyInvestigations.mockResolvedValue(
      mockRadiologyInvestigations,
    );

    render(renderRadiologyInvestigations());

    await waitFor(() => {
      expect(
        mockFilterRadiologyInvestionsReplacementEntries,
      ).toHaveBeenCalledWith(mockRadiologyInvestigations);
    });

    expect(mockGroupByDate).toHaveBeenCalledWith(
      mockRadiologyInvestigations,
      expect.any(Function),
    );
    expect(mockSortRadiologyInvestigationsByPriority).toHaveBeenCalledWith(
      expect.any(Array),
    );
  });

  it('groups investigations by date', async () => {
    // Clear the default mock behavior before setting up test-specific behavior
    mockGroupByDate.mockClear();
    mockGroupByDate.mockReturnValue([
      {
        date: '2023-12-01',
        items: [mockRadiologyInvestigations[0], mockRadiologyInvestigations[1]],
      },
    ]);

    mockGetPatientRadiologyInvestigations.mockResolvedValue(
      mockRadiologyInvestigations,
    );

    render(renderRadiologyInvestigations());

    await waitFor(() => {
      // Wait for the call that contains actual data (not empty array)
      const callWithData = mockGroupByDate.mock.calls.find(
        (call) => call[0].length > 0,
      );
      expect(callWithData).toBeDefined();
    });

    // Find the call that has actual data (not empty array)
    const groupByDateCallWithData = mockGroupByDate.mock.calls.find(
      (call) => call[0].length > 0,
    );
    expect(groupByDateCallWithData![0]).toEqual(mockRadiologyInvestigations);

    const dateExtractor = groupByDateCallWithData![1];
    dateExtractor(mockRadiologyInvestigations[0]);
    expect(mockFormatDate).toHaveBeenCalledWith(
      mockRadiologyInvestigations[0].orderedDate,
      mockUseTranslation().t,
      ISO_DATE_FORMAT,
    );
  });

  it('formats dates for accordion titles', async () => {
    mockGroupByDate.mockReturnValue([
      {
        date: '2023-12-01',
        items: [mockRadiologyInvestigations[0], mockRadiologyInvestigations[1]],
      },
      { date: '2023-11-30', items: [mockRadiologyInvestigations[2]] },
    ]);

    mockGetPatientRadiologyInvestigations.mockResolvedValue(
      mockRadiologyInvestigations,
    );

    render(renderRadiologyInvestigations());

    await waitFor(() => {
      expect(mockFormatDate).toHaveBeenCalledWith(
        '2023-12-01',
        mockUseTranslation().t,
        FULL_MONTH_DATE_FORMAT,
      );
    });
  });

  it('renders accordion with grouped data', async () => {
    mockGroupByDate.mockReturnValue([
      {
        date: '2023-12-01',
        items: [mockRadiologyInvestigations[0], mockRadiologyInvestigations[1]],
      },
      { date: '2023-11-30', items: [mockRadiologyInvestigations[2]] },
    ]);

    mockGetPatientRadiologyInvestigations.mockResolvedValue(
      mockRadiologyInvestigations,
    );

    render(renderRadiologyInvestigations());

    await waitFor(() => {
      expect(screen.getAllByTestId('accordian-table-title')).toHaveLength(2);
    });

    expect(screen.getAllByTestId('sortable-data-table')).toHaveLength(2);
  });

  describe('renderCell function', () => {
    const testInvestigation: RadiologyInvestigation = {
      id: 'test-1',
      testName: 'Test Investigation',
      priority: 'stat',
      orderedBy: 'Dr. Test',
      orderedDate: '2023-12-01T10:30:00.000Z',
    };

    it('renders testName cell with investigation name', async () => {
      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: [testInvestigation] },
      ]);

      mockGetPatientRadiologyInvestigations.mockResolvedValue([
        testInvestigation,
      ]);

      render(renderRadiologyInvestigations());

      await waitFor(() => {
        expect(screen.getByText('Test Investigation')).toBeInTheDocument();
      });
    });

    it('renders testName cell with urgent tag for stat priority', async () => {
      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: [testInvestigation] },
      ]);

      mockGetPatientRadiologyInvestigations.mockResolvedValue([
        testInvestigation,
      ]);

      render(renderRadiologyInvestigations());

      await waitFor(() => {
        expect(screen.getByText('Urgent')).toBeInTheDocument();
      });
    });

    it('renders testName cell without tag for routine priority', async () => {
      const routineInvestigation = {
        ...testInvestigation,
        priority: 'routine',
      };

      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: [routineInvestigation] },
      ]);

      mockGetPatientRadiologyInvestigations.mockResolvedValue([
        routineInvestigation,
      ]);

      render(renderRadiologyInvestigations());

      await waitFor(() => {
        expect(screen.getByText('Test Investigation')).toBeInTheDocument();
      });

      expect(screen.queryByText('Urgent')).not.toBeInTheDocument();
    });

    it('renders testName cell without tag for empty priority', async () => {
      const emptyPriorityInvestigation = { ...testInvestigation, priority: '' };

      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: [emptyPriorityInvestigation] },
      ]);

      mockGetPatientRadiologyInvestigations.mockResolvedValue([
        emptyPriorityInvestigation,
      ]);

      render(renderRadiologyInvestigations());

      await waitFor(() => {
        expect(screen.getByText('Test Investigation')).toBeInTheDocument();
      });

      expect(screen.queryByText('Urgent')).not.toBeInTheDocument();
    });

    it('renders results cell with placeholder', async () => {
      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: [testInvestigation] },
      ]);

      mockGetPatientRadiologyInvestigations.mockResolvedValue([
        testInvestigation,
      ]);

      render(renderRadiologyInvestigations());

      await waitFor(() => {
        expect(screen.getByText('--')).toBeInTheDocument();
      });
    });

    it('renders orderedBy cell with doctor name', async () => {
      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: [testInvestigation] },
      ]);

      mockGetPatientRadiologyInvestigations.mockResolvedValue([
        testInvestigation,
      ]);

      render(renderRadiologyInvestigations());

      await waitFor(() => {
        expect(screen.getByText('Dr. Test')).toBeInTheDocument();
      });
    });

    it('renders orderedBy cell with empty string when not provided', async () => {
      const noOrderedByInvestigation = { ...testInvestigation, orderedBy: '' };

      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: [noOrderedByInvestigation] },
      ]);

      mockGetPatientRadiologyInvestigations.mockResolvedValue([
        noOrderedByInvestigation,
      ]);

      render(renderRadiologyInvestigations());

      await waitFor(() => {
        expect(screen.getByText('Test Investigation')).toBeInTheDocument();
      });

      expect(screen.queryByText('Dr. Test')).not.toBeInTheDocument();
    });

    it('renders note tooltip when note is present', async () => {
      const investigationWithNote = {
        ...testInvestigation,
        note: 'Patient should be fasting',
      };

      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: [investigationWithNote] },
      ]);

      mockGetPatientRadiologyInvestigations.mockResolvedValue([
        investigationWithNote,
      ]);

      render(renderRadiologyInvestigations());

      await waitFor(() => {
        const tooltipButton = screen.getByRole('button', {
          name: 'Show information',
        });
        expect(tooltipButton).toBeInTheDocument();
      });

      expect(screen.getByText('Patient should be fasting')).toBeInTheDocument();
    });

    it('does not render note tooltip when note is absent', async () => {
      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: [testInvestigation] },
      ]);

      mockGetPatientRadiologyInvestigations.mockResolvedValue([
        testInvestigation,
      ]);

      render(renderRadiologyInvestigations());

      await waitFor(() => {
        expect(screen.getByText('Test Investigation')).toBeInTheDocument();
      });

      const tooltipButton = screen.queryByRole('button', {
        name: 'Show information',
      });
      expect(tooltipButton).not.toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles single date group', async () => {
      const singleDateInvestigations = [mockRadiologyInvestigations[0]];
      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: singleDateInvestigations },
      ]);

      mockGetPatientRadiologyInvestigations.mockResolvedValue(
        singleDateInvestigations,
      );

      render(renderRadiologyInvestigations());

      await waitFor(() => {
        expect(screen.getAllByTestId('accordian-table-title')).toHaveLength(1);
      });
    });

    it('handles replacement filtering', async () => {
      const investigationsWithReplacements = [
        ...mockRadiologyInvestigations,
        {
          id: 'replacement',
          testName: 'Replacement Test',
          priority: 'routine',
          orderedBy: 'Dr. Replace',
          orderedDate: '2023-12-01T10:30:00.000Z',
          replaces: ['order-1'],
        },
      ];

      mockFilterRadiologyInvestionsReplacementEntries.mockReturnValue(
        mockRadiologyInvestigations,
      );

      mockGetPatientRadiologyInvestigations.mockResolvedValue(
        investigationsWithReplacements,
      );

      render(renderRadiologyInvestigations());

      await waitFor(() => {
        expect(
          mockFilterRadiologyInvestionsReplacementEntries,
        ).toHaveBeenCalledWith(investigationsWithReplacements);
      });
    });

    it('handles mixed priority values correctly', async () => {
      const mixedPriorityInvestigations: RadiologyInvestigation[] = [
        {
          id: 'order-1',
          testName: 'Stat Test',
          priority: 'stat',
          orderedBy: 'Dr. Stat',
          orderedDate: '2023-12-01T10:30:00.000Z',
        },
        {
          id: 'order-2',
          testName: 'Routine Test',
          priority: 'routine',
          orderedBy: 'Dr. Routine',
          orderedDate: '2023-12-01T10:30:00.000Z',
        },
        {
          id: 'order-3',
          testName: 'Empty Priority Test',
          priority: '',
          orderedBy: 'Dr. Empty',
          orderedDate: '2023-12-01T10:30:00.000Z',
        },
      ];

      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: mixedPriorityInvestigations },
      ]);

      mockGetPatientRadiologyInvestigations.mockResolvedValue(
        mixedPriorityInvestigations,
      );

      render(renderRadiologyInvestigations());

      await waitFor(() => {
        expect(screen.getByText('Stat Test')).toBeInTheDocument();
      });

      expect(screen.getByText('Routine Test')).toBeInTheDocument();
      expect(screen.getByText('Empty Priority Test')).toBeInTheDocument();
      expect(screen.getAllByText('Urgent')).toHaveLength(1);
    });
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
    it('has no accessibility violations with data', async () => {
      mockGroupByDate.mockReturnValue([
        {
          date: '2023-12-01',
          items: [mockRadiologyInvestigations[0]],
        },
      ]);

      mockGetPatientRadiologyInvestigations.mockResolvedValue(
        mockRadiologyInvestigations,
      );

      const { container } = render(renderRadiologyInvestigations());

      await waitFor(() => {
        expect(screen.getByText('Chest X-Ray')).toBeInTheDocument();
      });

      expect(await axe(container)).toHaveNoViolations();
    });

    it('has no accessibility violations in empty state', async () => {
      mockGetPatientRadiologyInvestigations.mockResolvedValue([]);

      const { container } = render(renderRadiologyInvestigations());

      await waitFor(() => {
        expect(
          screen.getByText('No radiology investigations recorded'),
        ).toBeInTheDocument();
      });

      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
