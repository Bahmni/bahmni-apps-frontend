import { render, screen } from '@testing-library/react';
import {
  FormattedLabTest,
  LabTestsByDate,
  LabTestPriority,
  groupLabTestsByDate,
  useTranslation,
} from 'bahmni-services';
import LabInvestigation from '../LabInvestigation';
import useLabInvestigations from '../useLabInvestigations';

jest.mock('../useLabInvestigations');
jest.mock('bahmni-services', () => ({
  ...jest.requireActual('bahmni-services'),
  groupLabTestsByDate: jest.fn(),
  useTranslation: jest.fn(),
}));
jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

jest.mock('../LabInvestigationItem', () => ({
  __esModule: true,
  default: ({ test }: { test: FormattedLabTest }) => (
    <div data-testid="lab-investigation-item">
      <span data-testid="test-name">{test.testName}</span>
      <span data-testid="test-priority">{test.priority}</span>
    </div>
  ),
}));

const mockUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;

describe('LabInvestigation', () => {
  const mockFormattedLabTests: FormattedLabTest[] = [
    {
      id: 'test-1',
      testName: 'Complete Blood Count',
      priority: LabTestPriority.routine,
      orderedBy: 'Dr. Smith',
      orderedDate: '2025-05-08T12:44:24+00:00',
      formattedDate: '05/08/2025',
      result: undefined,
      testType: 'Panel',
    },
    {
      id: 'test-2',
      testName: 'Lipid Panel',
      priority: LabTestPriority.stat,
      orderedBy: 'Dr. Johnson',
      orderedDate: '2025-04-09T13:21:22+00:00',
      formattedDate: '04/09/2025',
      result: undefined,
      testType: 'Panel',
    },
    {
      id: 'test-3',
      testName: 'Liver Function',
      priority: LabTestPriority.routine,
      orderedBy: 'Dr. Williams',
      orderedDate: '2025-04-09T13:21:22+00:00',
      formattedDate: '04/09/2025',
      result: undefined,
      testType: 'Individual',
    },
  ];

  const mockLabTestsByDate: LabTestsByDate[] = [
    {
      date: '05/08/2025',
      rawDate: '2025-05-08T12:44:24+00:00',
      tests: [mockFormattedLabTests[0]],
    },
    {
      date: '04/09/2025',
      rawDate: '2025-04-09T13:21:22+00:00',
      tests: [mockFormattedLabTests[1], mockFormattedLabTests[2]],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (groupLabTestsByDate as jest.Mock).mockReturnValue(mockLabTestsByDate);

    mockUseTranslation.mockReturnValue({
      t: (key: string) => {
        const translations: Record<string, string> = {
          LAB_TEST_ERROR_LOADING: 'Error loading lab tests',
          LAB_TEST_LOADING: 'Loading lab tests...',
          LAB_TEST_UNAVAILABLE: 'No lab investigations recorded',
        };
        return translations[key] || key;
      },
    });
  });

  it('renders loading state with message', () => {
    (useLabInvestigations as jest.Mock).mockReturnValue({
      labTests: [],
      isLoading: true,
      hasError: false,
    });

    render(<LabInvestigation />);

    expect(screen.getByText('Loading lab tests...')).toBeInTheDocument();
  });

  it('renders lab tests grouped by date', () => {
    (useLabInvestigations as jest.Mock).mockReturnValue({
      labTests: mockFormattedLabTests,
      isLoading: false,
      hasError: false,
    });

    render(<LabInvestigation />);

    expect(groupLabTestsByDate).toHaveBeenCalledWith(mockFormattedLabTests);

    expect(screen.getByText('05/08/2025')).toBeInTheDocument();
    expect(screen.getByText('04/09/2025')).toBeInTheDocument();

    const labItems = screen.getAllByTestId('lab-investigation-item');
    expect(labItems).toHaveLength(3);
  });

  it('renders empty state message when no lab tests', () => {
    (useLabInvestigations as jest.Mock).mockReturnValue({
      labTests: [],
      isLoading: false,
      hasError: false,
    });

    render(<LabInvestigation />);

    expect(
      screen.getByText('No lab investigations recorded'),
    ).toBeInTheDocument();
  });

  it('renders error message when hasError is true', () => {
    (useLabInvestigations as jest.Mock).mockReturnValue({
      labTests: [],
      isLoading: false,
      hasError: true,
    });

    render(<LabInvestigation />);

    expect(screen.getByText('Error loading lab tests')).toBeInTheDocument();
  });

  it('renders urgent tests before non-urgent tests within each date group', () => {
    (useLabInvestigations as jest.Mock).mockReturnValue({
      labTests: mockFormattedLabTests,
      isLoading: false,
      hasError: false,
    });

    render(<LabInvestigation />);

    const testNames = screen.getAllByTestId('test-name');
    const testPriorities = screen.getAllByTestId('test-priority');

    expect(testNames[0]).toHaveTextContent('Complete Blood Count');
    expect(testPriorities[0]).toHaveTextContent(LabTestPriority.routine);

    expect(testNames[1]).toHaveTextContent('Lipid Panel');
    expect(testPriorities[1]).toHaveTextContent(LabTestPriority.stat);

    expect(testNames[2]).toHaveTextContent('Liver Function');
    expect(testPriorities[2]).toHaveTextContent(LabTestPriority.routine);
  });

  it('opens first accordion item by default', () => {
    (useLabInvestigations as jest.Mock).mockReturnValue({
      labTests: mockFormattedLabTests,
      isLoading: false,
      hasError: false,
    });

    render(<LabInvestigation />);

    const firstAccordionButton = screen.getByRole('button', {
      name: /05\/08\/2025/,
    });
    const secondAccordionButton = screen.getByRole('button', {
      name: /04\/09\/2025/,
    });

    expect(firstAccordionButton).toHaveAttribute('aria-expanded', 'true');
    expect(secondAccordionButton).toHaveAttribute('aria-expanded', 'false');
  });
});
