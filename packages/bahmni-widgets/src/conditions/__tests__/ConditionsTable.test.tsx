import {
  ConditionStatus,
  FormattedCondition,
  formatDateDistance,
  useTranslation,
} from '@bahmni-frontend/bahmni-services';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import ConditionsTable from '../ConditionsTable';
import { useConditions } from '../useConditions';

expect.extend(toHaveNoViolations);

jest.mock('../useConditions');
jest.mock('@bahmni-frontend/bahmni-services', () => ({
  ...jest.requireActual('@bahmni-frontend/bahmni-services'),
  useTranslation: jest.fn(),
  formatDateDistance: jest.fn(),
}));
jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

const mockUseConditions = useConditions as jest.MockedFunction<
  typeof useConditions
>;
const mockFormatDateDistance = formatDateDistance as jest.MockedFunction<
  typeof formatDateDistance
>;

// Mock useTranslation
const mockUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;

const mockConditions: FormattedCondition[] = [
  {
    id: '1',
    code: 'K82.9',
    codeDisplay: 'K82.9',
    display: 'Cyst of Gallbladder',
    status: ConditionStatus.Active,
    onsetDate: '2025-03-24T18:30:00+00:00',
    recorder: 'Dr. Smith',
  },
  {
    id: '2',
    code: 'M79.3',
    codeDisplay: 'M79.3',
    display: 'Panniculitis',
    status: ConditionStatus.Inactive,
    onsetDate: '2025-01-15T10:00:00+00:00',
    recorder: 'Dr. Johnson',
  },
];

describe('ConditionsTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock translation function
    mockUseTranslation.mockReturnValue({
      t: (key: string, options?: { timeAgo?: string }) => {
        const translations: Record<string, string> = {
          CONDITION_LIST_DISPLAY_CONTROL_TITLE: 'Conditions',
          CONDITION_LIST_CONDITION: 'Condition',
          CONDITION_TABLE_DURATION: 'Duration',
          CONDITION_TABLE_RECORDED_BY: 'Recorded By',
          CONDITION_LIST_STATUS: 'Status',
          CONDITION_LIST_ACTIVE: 'Active',
          CONDITION_LIST_INACTIVE: 'Inactive',
          CONDITION_LIST_NO_CONDITIONS: 'No conditions recorded',
          CONDITION_TABLE_NOT_AVAILABLE: 'Not available',
          CONDITION_ONSET_SINCE_FORMAT: options?.timeAgo
            ? `Since ${options.timeAgo}`
            : 'Since',
        };
        return translations[key] || key;
      },
    });

    mockFormatDateDistance.mockReturnValue({ formattedResult: '3 days' });
  });

  describe('loading and error states', () => {
    it('renders loading skeleton when loading', () => {
      mockUseConditions.mockReturnValue({
        conditions: [],
        loading: true,
        error: null,
        refetch: jest.fn(),
      });

      render(<ConditionsTable />);

      expect(screen.getByTestId('sortable-table-skeleton')).toBeInTheDocument();
    });

    it('renders error message when error occurs', () => {
      mockUseConditions.mockReturnValue({
        conditions: [],
        loading: false,
        error: new Error('Network error'),
        refetch: jest.fn(),
      });

      render(<ConditionsTable />);

      expect(screen.getByTestId('sortable-table-error')).toBeInTheDocument();
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });

    it('renders empty state when no conditions', () => {
      mockUseConditions.mockReturnValue({
        conditions: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<ConditionsTable />);

      expect(screen.getByTestId('sortable-table-empty')).toBeInTheDocument();
      expect(screen.getByText('No conditions recorded')).toBeInTheDocument();
    });
  });

  describe('with conditions data', () => {
    beforeEach(() => {
      mockUseConditions.mockReturnValue({
        conditions: mockConditions,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
    });

    it('renders title and table structure', () => {
      render(<ConditionsTable />);

      expect(screen.getByText('Conditions')).toBeInTheDocument();
      expect(screen.getByTestId('condition-table')).toBeInTheDocument();
      expect(screen.getByTestId('sortable-data-table')).toBeInTheDocument();
    });

    it('renders table headers', () => {
      render(<ConditionsTable />);

      expect(screen.getByText('Condition')).toBeInTheDocument();
      expect(screen.getByText('Duration')).toBeInTheDocument();
      expect(screen.getByText('Recorded By')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('renders condition names', () => {
      render(<ConditionsTable />);

      expect(screen.getByText('Cyst of Gallbladder')).toBeInTheDocument();
      expect(screen.getByText('Panniculitis')).toBeInTheDocument();
    });

    it('renders active status tag', () => {
      render(<ConditionsTable />);

      const activeTag = screen.getByTestId('condition-status-K82.9');
      expect(activeTag).toHaveTextContent('Active');
    });

    it('renders inactive status tag', () => {
      render(<ConditionsTable />);

      const inactiveTag = screen.getByTestId('condition-status-M79.3');
      expect(inactiveTag).toHaveTextContent('Inactive');
    });

    it('renders formatted onset dates', () => {
      render(<ConditionsTable />);

      expect(screen.getAllByText('Since 3 days')).toHaveLength(2);
      expect(mockFormatDateDistance).toHaveBeenCalledWith(
        '2025-03-24T18:30:00+00:00',
      );
      expect(mockFormatDateDistance).toHaveBeenCalledWith(
        '2025-01-15T10:00:00+00:00',
      );
    });

    it('renders "Not available" when date formatting fails', () => {
      mockFormatDateDistance.mockReturnValue({
        formattedResult: '',
        error: { title: 'Error', message: 'Invalid date' },
      });

      render(<ConditionsTable />);

      expect(screen.getAllByText('Not available')).toHaveLength(2);
    });

    it('renders recorder names', () => {
      render(<ConditionsTable />);

      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('Dr. Johnson')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles missing onset date', () => {
      const conditionWithoutDate: FormattedCondition = {
        ...mockConditions[0],
        onsetDate: '',
      };

      mockUseConditions.mockReturnValue({
        conditions: [conditionWithoutDate],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<ConditionsTable />);

      expect(mockFormatDateDistance).toHaveBeenCalledWith('');
    });

    it('handles missing recorder', () => {
      const conditionWithoutRecorder: FormattedCondition = {
        ...mockConditions[0],
        recorder: '',
      };

      mockUseConditions.mockReturnValue({
        conditions: [conditionWithoutRecorder],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      expect(() => render(<ConditionsTable />)).not.toThrow();
    });
  });

  describe('accessibility', () => {
    it('has no accessibility violations with data', async () => {
      mockUseConditions.mockReturnValue({
        conditions: mockConditions,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const { container } = render(<ConditionsTable />);
      expect(await axe(container)).toHaveNoViolations();
    });

    it('has no accessibility violations in empty state', async () => {
      mockUseConditions.mockReturnValue({
        conditions: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const { container } = render(<ConditionsTable />);
      expect(await axe(container)).toHaveNoViolations();
    });

    it('has no accessibility violations in error state', async () => {
      mockUseConditions.mockReturnValue({
        conditions: [],
        loading: false,
        error: new Error('Test error'),
        refetch: jest.fn(),
      });

      const { container } = render(<ConditionsTable />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
