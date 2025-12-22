import {
  RadiologyInvestigation,
  groupByDate,
  formatDate,
  FULL_MONTH_DATE_FORMAT,
  ISO_DATE_FORMAT,
  useTranslation,
} from '@bahmni/services';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import RadiologyInvestigationTable from '../RadiologyInvestigationTable';
import { useRadiologyInvestigation } from '../useRadiologyInvestigation';
import {
  sortRadiologyInvestigationsByPriority,
  filterRadiologyInvestionsReplacementEntries,
} from '../utils';

expect.extend(toHaveNoViolations);

jest.mock('../useRadiologyInvestigation');
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: jest.fn(),
  groupByDate: jest.fn(),
  formatDate: jest.fn(),
}));

jest.mock('../utils', () => ({
  sortRadiologyInvestigationsByPriority: jest.fn(),
  filterRadiologyInvestionsReplacementEntries: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

const mockUseRadiologyInvestigation =
  useRadiologyInvestigation as jest.MockedFunction<
    typeof useRadiologyInvestigation
  >;
const mockUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
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
        };
        return translations[key] || key;
      }) as any,
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

  it('renders loading state', () => {
    mockUseRadiologyInvestigation.mockReturnValue({
      radiologyInvestigations: [],
      loading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<RadiologyInvestigationTable />);
    expect(screen.getByTestId('sortable-table-skeleton')).toBeInTheDocument();
  });

  it('renders error state', () => {
    mockUseRadiologyInvestigation.mockReturnValue({
      radiologyInvestigations: [],
      loading: false,
      error: new Error('Network error'),
      refetch: jest.fn(),
    });

    render(<RadiologyInvestigationTable />);
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    mockUseRadiologyInvestigation.mockReturnValue({
      radiologyInvestigations: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<RadiologyInvestigationTable />);
    expect(
      screen.getByText('No radiology investigations recorded'),
    ).toBeInTheDocument();
  });

  it('processes data through transformation pipeline', () => {
    mockGroupByDate.mockReturnValue([
      {
        date: '2023-12-01',
        items: [mockRadiologyInvestigations[0], mockRadiologyInvestigations[1]],
      },
      { date: '2023-11-30', items: [mockRadiologyInvestigations[2]] },
    ]);

    mockUseRadiologyInvestigation.mockReturnValue({
      radiologyInvestigations: mockRadiologyInvestigations,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<RadiologyInvestigationTable />);

    expect(
      mockFilterRadiologyInvestionsReplacementEntries,
    ).toHaveBeenCalledWith(mockRadiologyInvestigations);
    expect(mockGroupByDate).toHaveBeenCalledWith(
      mockRadiologyInvestigations,
      expect.any(Function),
    );
    expect(mockSortRadiologyInvestigationsByPriority).toHaveBeenCalledTimes(2);
  });

  it('groups investigations by date', () => {
    mockUseRadiologyInvestigation.mockReturnValue({
      radiologyInvestigations: mockRadiologyInvestigations,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<RadiologyInvestigationTable />);

    const groupByDateCall = mockGroupByDate.mock.calls[0];
    expect(groupByDateCall[0]).toBe(mockRadiologyInvestigations);

    const dateExtractor = groupByDateCall[1];
    dateExtractor(mockRadiologyInvestigations[0]);
    expect(mockFormatDate).toHaveBeenCalledWith(
      mockRadiologyInvestigations[0].orderedDate,
      mockUseTranslation().t,
      ISO_DATE_FORMAT,
    );
  });

  it('formats dates for accordion titles', () => {
    mockGroupByDate.mockReturnValue([
      {
        date: '2023-12-01',
        items: [mockRadiologyInvestigations[0], mockRadiologyInvestigations[1]],
      },
      { date: '2023-11-30', items: [mockRadiologyInvestigations[2]] },
    ]);

    mockUseRadiologyInvestigation.mockReturnValue({
      radiologyInvestigations: mockRadiologyInvestigations,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<RadiologyInvestigationTable />);
    expect(mockFormatDate).toHaveBeenCalledWith(
      '2023-12-01',
      mockUseTranslation().t,
      FULL_MONTH_DATE_FORMAT,
    );
  });

  it('renders accordion with grouped data', () => {
    mockGroupByDate.mockReturnValue([
      {
        date: '2023-12-01',
        items: [mockRadiologyInvestigations[0], mockRadiologyInvestigations[1]],
      },
      { date: '2023-11-30', items: [mockRadiologyInvestigations[2]] },
    ]);

    mockUseRadiologyInvestigation.mockReturnValue({
      radiologyInvestigations: mockRadiologyInvestigations,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<RadiologyInvestigationTable />);

    expect(screen.getAllByTestId('accordian-table-title')).toHaveLength(2);
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

    it('renders testName cell with investigation name', () => {
      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: [testInvestigation] },
      ]);

      mockUseRadiologyInvestigation.mockReturnValue({
        radiologyInvestigations: [testInvestigation],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<RadiologyInvestigationTable />);
      expect(screen.getByText('Test Investigation')).toBeInTheDocument();
    });

    it('renders testName cell with urgent tag for stat priority', () => {
      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: [testInvestigation] },
      ]);

      mockUseRadiologyInvestigation.mockReturnValue({
        radiologyInvestigations: [testInvestigation],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<RadiologyInvestigationTable />);
      expect(screen.getByText('Urgent')).toBeInTheDocument();
    });

    it('renders testName cell without tag for routine priority', () => {
      const routineInvestigation = {
        ...testInvestigation,
        priority: 'routine',
      };

      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: [routineInvestigation] },
      ]);

      mockUseRadiologyInvestigation.mockReturnValue({
        radiologyInvestigations: [routineInvestigation],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<RadiologyInvestigationTable />);
      expect(screen.queryByText('Urgent')).not.toBeInTheDocument();
    });

    it('renders testName cell without tag for empty priority', () => {
      const emptyPriorityInvestigation = { ...testInvestigation, priority: '' };

      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: [emptyPriorityInvestigation] },
      ]);

      mockUseRadiologyInvestigation.mockReturnValue({
        radiologyInvestigations: [emptyPriorityInvestigation],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<RadiologyInvestigationTable />);
      expect(screen.queryByText('Urgent')).not.toBeInTheDocument();
    });

    it('renders results cell with placeholder', () => {
      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: [testInvestigation] },
      ]);

      mockUseRadiologyInvestigation.mockReturnValue({
        radiologyInvestigations: [testInvestigation],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<RadiologyInvestigationTable />);
      expect(screen.getByText('--')).toBeInTheDocument();
    });

    it('renders orderedBy cell with doctor name', () => {
      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: [testInvestigation] },
      ]);

      mockUseRadiologyInvestigation.mockReturnValue({
        radiologyInvestigations: [testInvestigation],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<RadiologyInvestigationTable />);
      expect(screen.getByText('Dr. Test')).toBeInTheDocument();
    });

    it('renders orderedBy cell with empty string when not provided', () => {
      const noOrderedByInvestigation = { ...testInvestigation, orderedBy: '' };

      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: [noOrderedByInvestigation] },
      ]);

      mockUseRadiologyInvestigation.mockReturnValue({
        radiologyInvestigations: [noOrderedByInvestigation],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<RadiologyInvestigationTable />);
      expect(screen.queryByText('Dr. Test')).not.toBeInTheDocument();
    });

    it('renders note tooltip when note is present', () => {
      const investigationWithNote = {
        ...testInvestigation,
        note: 'Patient should be fasting',
      };

      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: [investigationWithNote] },
      ]);

      mockUseRadiologyInvestigation.mockReturnValue({
        radiologyInvestigations: [investigationWithNote],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<RadiologyInvestigationTable />);

      const tooltipButton = screen.getByRole('button', {
        name: 'Show information',
      });
      expect(tooltipButton).toBeInTheDocument();
      expect(screen.getByText('Patient should be fasting')).toBeInTheDocument();
    });

    it('does not render note tooltip when note is absent', () => {
      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: [testInvestigation] },
      ]);

      mockUseRadiologyInvestigation.mockReturnValue({
        radiologyInvestigations: [testInvestigation],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<RadiologyInvestigationTable />);

      const tooltipButton = screen.queryByRole('button', {
        name: 'Show information',
      });
      expect(tooltipButton).not.toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles single date group', () => {
      const singleDateInvestigations = [mockRadiologyInvestigations[0]];
      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: singleDateInvestigations },
      ]);

      mockUseRadiologyInvestigation.mockReturnValue({
        radiologyInvestigations: singleDateInvestigations,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<RadiologyInvestigationTable />);
      expect(screen.getAllByTestId('accordian-table-title')).toHaveLength(1);
    });

    it('handles replacement filtering', () => {
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

      mockUseRadiologyInvestigation.mockReturnValue({
        radiologyInvestigations: investigationsWithReplacements,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<RadiologyInvestigationTable />);

      expect(
        mockFilterRadiologyInvestionsReplacementEntries,
      ).toHaveBeenCalledWith(investigationsWithReplacements);
    });

    it('handles mixed priority values correctly', () => {
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

      mockUseRadiologyInvestigation.mockReturnValue({
        radiologyInvestigations: mixedPriorityInvestigations,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<RadiologyInvestigationTable />);

      expect(screen.getByText('Stat Test')).toBeInTheDocument();
      expect(screen.getByText('Routine Test')).toBeInTheDocument();
      expect(screen.getByText('Empty Priority Test')).toBeInTheDocument();
      expect(screen.getAllByText('Urgent')).toHaveLength(1);
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations with data', async () => {
      mockUseRadiologyInvestigation.mockReturnValue({
        radiologyInvestigations: mockRadiologyInvestigations,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const { container } = render(<RadiologyInvestigationTable />);
      expect(await axe(container)).toHaveNoViolations();
    });

    it('has no accessibility violations in empty state', async () => {
      mockUseRadiologyInvestigation.mockReturnValue({
        radiologyInvestigations: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const { container } = render(<RadiologyInvestigationTable />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
