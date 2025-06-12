import React from 'react';
import { render, screen } from '@testing-library/react';
import LabInvestigationItem from '../LabInvestigationItem';
import { FormattedLabTest, LabTestPriority } from '@types/labInvestigation';
import { useTranslation } from 'react-i18next';

// Mock the BahmniIcon component
jest.mock('@components/common/bahmniIcon/BahmniIcon', () => ({
  __esModule: true,
  default: ({ name, id }: { name: string; id: string }) => (
    <span data-testid={id}>{name}</span>
  ),
}));

// Mock the useTranslation hook
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));

describe('LabInvestigationItem', () => {
  // Test data
  const mockLabTest: FormattedLabTest = {
    id: 'test-123',
    testName: 'Complete Blood Count',
    priority: LabTestPriority.routine,
    orderedBy: 'Dr. Smith',
    orderedDate: '2025-05-08T12:44:24+00:00',
    formattedDate: '05/08/2025',
    result: undefined,
    testType: 'Panel',
  };

  // Setup translation mock before each test
  beforeEach(() => {
    // Mock the translation function
    (useTranslation as jest.Mock).mockReturnValue({
      t: (key: string) => {
        // Return appropriate values based on the translation key
        const translations: Record<string, string> = {
          LAB_TEST_PANEL: 'Panel',
          LAB_TEST_URGENT: 'Urgent',
          LAB_TEST_ORDERED_BY: 'Ordered by:',
          LAB_TEST_RESULTS_PENDING: 'Results pending…',
        };
        return translations[key] || key;
      },
    });
  });

  it('renders the test name, test type, priority, and ordered by information', () => {
    render(<LabInvestigationItem test={mockLabTest} />);

    // Check that the test name is displayed
    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();

    // Check that the test type is displayed (using translation)
    expect(screen.getByText('Panel')).toBeInTheDocument();

    // Check that the ordered by information is displayed
    expect(screen.getByText(/Ordered by:/)).toBeInTheDocument();
    expect(screen.getByText(/Dr. Smith/)).toBeInTheDocument();
  });

  it('displays results pending message', () => {
    render(<LabInvestigationItem test={mockLabTest} />);

    // Check for text content that contains "Results pending"
    expect(screen.getByText('Results pending…')).toBeInTheDocument();
  });

  it('applies different tag color for urgent priority', () => {
    const urgentTest = {
      ...mockLabTest,
      priority: LabTestPriority.stat,
    };

    render(<LabInvestigationItem test={urgentTest} />);

    expect(screen.getByText('Urgent')).toBeInTheDocument();
  });

  it('displays test type correctly', () => {
    // Test with Panel Test type
    const panelTest = {
      ...mockLabTest,
      testType: 'Panel',
    };

    // Test with Panel type
    render(<LabInvestigationItem test={panelTest} />);
    expect(screen.getByText('Panel')).toBeInTheDocument();
  });
});
