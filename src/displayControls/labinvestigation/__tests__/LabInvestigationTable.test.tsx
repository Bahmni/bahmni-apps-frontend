import React from 'react';
import { render, screen } from '@testing-library/react';
import LabInvestigationTable from '../LabInvestigationTable';
import useLabInvestigations from '@/hooks/useLabInvestigations';
import { LabTestsByDate, LabTestStatus, LabTestPriority } from '@/types/labInvestigation';

// Mock the useLabInvestigations hook
jest.mock('@/hooks/useLabInvestigations');

// Mock the LabInvestigationItem component
jest.mock('../LabInvestigationItem', () => ({
  __esModule: true,
  default: ({ test }: any) => (
    <div data-testid="lab-investigation-item">
      <span data-testid="test-name">{test.testName}</span>
      <span data-testid="test-status">{test.status}</span>
      <span data-testid="test-priority">{test.priority}</span>
    </div>
  ),
}));

// Mock the Carbon components
jest.mock('@carbon/react', () => ({
  Accordion: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AccordionItem: ({ title, children }: { title: React.ReactNode; children: React.ReactNode }) => (
    <div>
      <div data-testid="accordion-title">{title}</div>
      <div data-testid="accordion-content">{children}</div>
    </div>
  ),
}));

describe('LabInvestigationTable', () => {
  // Mock data
  const mockLabTestsByDate: LabTestsByDate[] = [
    {
      date: '05/08/2025',
      rawDate: '2025-05-08T12:44:24+00:00',
      tests: [
        {
          id: 'test-1',
          testName: 'Complete Blood Count',
          status: LabTestStatus.Normal,
          priority: LabTestPriority.Routine,
          orderedBy: 'Dr. Smith',
          orderedDate: '2025-05-08T12:44:24+00:00',
          formattedDate: '05/08/2025',
          result: undefined,
        },
      ],
    },
    {
      date: '04/09/2025',
      rawDate: '2025-04-09T13:21:22+00:00',
      tests: [
        {
          id: 'test-2',
          testName: 'Lipid Panel',
          status: LabTestStatus.Abnormal,
          priority: LabTestPriority.Urgent,
          orderedBy: 'Dr. Johnson',
          orderedDate: '2025-04-09T13:21:22+00:00',
          formattedDate: '04/09/2025',
          result: undefined,
        },
        {
          id: 'test-3',
          testName: 'Liver Function',
          status: LabTestStatus.Pending,
          priority: LabTestPriority.Stat,
          orderedBy: 'Dr. Williams',
          orderedDate: '2025-04-09T13:21:22+00:00',
          formattedDate: '04/09/2025',
          result: undefined,
        },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a loading message when isLoading is true and there are no lab investigations', () => {
    // Mock the hook to return loading state
    (useLabInvestigations as jest.Mock).mockReturnValue({
      labInvestigations: [],
      formattedLabTests: [],
      isLoading: true,
    });

    render(<LabInvestigationTable />);
    
    expect(screen.getByText('Loading lab tests...')).toBeInTheDocument();
  });

  it('renders lab investigations grouped by date', () => {
    // Mock the hook to return lab investigations
    (useLabInvestigations as jest.Mock).mockReturnValue({
      labInvestigations: mockLabTestsByDate,
      formattedLabTests: mockLabTestsByDate.flatMap(group => group.tests),
      isLoading: false,
    });

    render(<LabInvestigationTable />);
    
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
    expect(testPriorities[0].textContent).toBe(LabTestPriority.Routine);
    expect(testPriorities[1].textContent).toBe(LabTestPriority.Urgent);
    expect(testPriorities[2].textContent).toBe(LabTestPriority.Stat);
  });

  it('renders nothing when there are no lab investigations and isLoading is false', () => {
    // Mock the hook to return no lab investigations
    (useLabInvestigations as jest.Mock).mockReturnValue({
      labInvestigations: [],
      formattedLabTests: [],
      isLoading: false,
    });

    render(<LabInvestigationTable />);
    
    // Check that the accordion is empty
    expect(screen.queryByTestId('accordion-title')).not.toBeInTheDocument();
    expect(screen.queryByTestId('lab-investigation-item')).not.toBeInTheDocument();
  });
});
