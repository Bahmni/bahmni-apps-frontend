import React from 'react';
import { render, screen } from '@testing-library/react';
import LabInvestigationControl from '../LabInvestigationControl';
import useLabInvestigations from '@/hooks/useLabInvestigations';
import { groupLabTestsByDate } from '@/services/labInvestigationService';
import {
  LabTestsByDate,
  LabTestStatus,
  LabTestPriority,
  FormattedLabTest,
} from '@types/labInvestigation';
import i18n from '@/setupTests.i18n';

// Mock the useLabInvestigations hook
jest.mock('@/hooks/useLabInvestigations');

// Mock the groupLabTestsByDate function
jest.mock('@/services/labInvestigationService', () => ({
  groupLabTestsByDate: jest.fn(),
}));

// Mock the LabInvestigationItem component
jest.mock('../LabInvestigationItem', () => ({
  __esModule: true,
  default: ({ test }: { test: FormattedLabTest }) => (
    <div data-testid="lab-investigation-item">
      <span data-testid="test-name">{test.testName}</span>
      <span data-testid="test-status">{test.status}</span>
      <span data-testid="test-priority">{test.priority}</span>
    </div>
  ),
}));

// Mock the Carbon components
jest.mock('@carbon/react', () => ({
  Accordion: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AccordionItem: ({
    title,
    children,
  }: {
    title: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div>
      <div data-testid="accordion-title">{title}</div>
      <div data-testid="accordion-content">{children}</div>
    </div>
  ),
  // Add the missing SkeletonText component mock
  SkeletonText: ({
    lineCount,
    width,
  }: {
    lineCount: number;
    width: string;
  }) => (
    <div data-testid="skeleton-text" style={{ width }}>
      {Array(lineCount)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="skeleton-line"></div>
        ))}
    </div>
  ),
}));

describe('LabInvestigationControl', () => {
  // Mock data
  const mockFormattedLabTests: FormattedLabTest[] = [
    {
      id: 'test-1',
      testName: 'Complete Blood Count',
      status: LabTestStatus.Normal,
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
      status: LabTestStatus.Abnormal,
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
      status: LabTestStatus.Pending,
      priority: LabTestPriority.routine,
      orderedBy: 'Dr. Williams',
      orderedDate: '2025-04-09T13:21:22+00:00',
      formattedDate: '04/09/2025',
      result: undefined,
      testType: 'Single Test',
    },
  ];

  const mockLabTestsByDate: LabTestsByDate[] = [
    {
      date: '05/08/2025',
      rawDate: '2025-05-08T12:44:24+00:00',
      tests: [mockFormattedLabTests[0]], // Complete Blood Count (routine)
    },
    {
      date: '04/09/2025',
      rawDate: '2025-04-09T13:21:22+00:00',
      tests: [
        mockFormattedLabTests[1], // Lipid Panel (stat/Urgent) - should be first
        mockFormattedLabTests[2], // Liver Function (stat/Urgent) - should be second
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (groupLabTestsByDate as jest.Mock).mockReturnValue(mockLabTestsByDate);

    // Reset i18n to English
    i18n.changeLanguage('en');
  });

  it('renders a loading message when isLoading is true and there are no lab tests', () => {
    // Mock the hook to return loading state
    (useLabInvestigations as jest.Mock).mockReturnValue({
      labTests: [],
      isLoading: true,
      isError: false,
    });

    render(<LabInvestigationControl />);

    expect(screen.getByText('Loading lab tests...')).toBeInTheDocument();
  });

  it('renders lab tests grouped by date', () => {
    // Mock the hook to return lab tests
    (useLabInvestigations as jest.Mock).mockReturnValue({
      labTests: mockFormattedLabTests,
      isLoading: false,
      isError: false,
    });

    render(<LabInvestigationControl />);

    // Verify groupLabTestsByDate was called with the lab tests
    expect(groupLabTestsByDate).toHaveBeenCalledWith(mockFormattedLabTests);

    // Check that the date headers are displayed
    const accordionTitles = screen.getAllByTestId('accordion-title');
    expect(accordionTitles).toHaveLength(2);
    expect(accordionTitles[0].textContent).toContain('05/08/2025');
    expect(accordionTitles[1].textContent).toContain('04/09/2025');

    // Check that the lab investigation items are displayed
    const labItems = screen.getAllByTestId('lab-investigation-item');
    expect(labItems).toHaveLength(3);

    // Check that the test names are displayed
    const testNames = screen.getAllByTestId('test-name');
    expect(testNames).toHaveLength(3);
    expect(testNames[0].textContent).toBe('Complete Blood Count');
    expect(testNames[1].textContent).toBe('Lipid Panel');
    expect(testNames[2].textContent).toBe('Liver Function');

    // Check that the test statuses are displayed
    const testStatuses = screen.getAllByTestId('test-status');
    expect(testStatuses).toHaveLength(3);
    expect(testStatuses[0].textContent).toBe(LabTestStatus.Normal);
    expect(testStatuses[1].textContent).toBe(LabTestStatus.Abnormal);
    expect(testStatuses[2].textContent).toBe(LabTestStatus.Pending);

    // Check that the test priorities are displayed
    const testPriorities = screen.getAllByTestId('test-priority');
    expect(testPriorities).toHaveLength(3);
    expect(testPriorities[0].textContent).toBe(LabTestPriority.routine);
    expect(testPriorities[1].textContent).toBe(LabTestPriority.stat);
    expect(testPriorities[2].textContent).toBe(LabTestPriority.routine);
  });

  it('renders "No lab Investigations available" message when there are no lab tests and isLoading is false', () => {
    // Mock the hook to return no lab tests
    (useLabInvestigations as jest.Mock).mockReturnValue({
      labTests: [],
      isLoading: false,
      isError: false,
    });

    // Mock empty grouped tests
    (groupLabTestsByDate as jest.Mock).mockReturnValue([]);

    render(<LabInvestigationControl />);

    // Check that the message is displayed
    expect(
      screen.getByText('No lab Investigations available'),
    ).toBeInTheDocument();
  });

  it('renders error message when isError is true', () => {
    // Mock the hook to return error state
    (useLabInvestigations as jest.Mock).mockReturnValue({
      labTests: [],
      isLoading: false,
      isError: true,
    });

    render(<LabInvestigationControl />);

    // Check that the error message is displayed
    expect(screen.getByText('Error loading lab tests')).toBeInTheDocument();
  });

  it('renders urgent tests before non-urgent tests within each group', () => {
    // Mock the hook to return lab tests
    (useLabInvestigations as jest.Mock).mockReturnValue({
      labTests: mockFormattedLabTests,
      isLoading: false,
      isError: false,
    });

    render(<LabInvestigationControl />);

    // Get all test names in DOM order
    const testNames = screen.getAllByTestId('test-name');
    const testPriorities = screen.getAllByTestId('test-priority');

    expect(testNames).toHaveLength(3);

    // The component renders by date groups first, then by priority within each group
    // First date group (05/08/2025): Complete Blood Count (routine)
    expect(testNames[0].textContent).toBe('Complete Blood Count');
    expect(testPriorities[0].textContent).toBe(LabTestPriority.routine);

    // Second date group (04/09/2025): Urgent tests first within this group
    expect(testNames[1].textContent).toBe('Lipid Panel');
    expect(testPriorities[1].textContent).toBe(LabTestPriority.stat);

    expect(testNames[2].textContent).toBe('Liver Function');
    expect(testPriorities[2].textContent).toBe(LabTestPriority.routine);
  });
});
