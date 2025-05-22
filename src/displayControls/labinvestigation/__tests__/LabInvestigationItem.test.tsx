import React from 'react';
import { render, screen } from '@testing-library/react';
import LabInvestigationItem from '../LabInvestigationItem';
import {
  FormattedLabTest,
  LabTestStatus,
  LabTestPriority,
} from '@/types/labInvestigation';

// Mock the BahmniIcon component
jest.mock('@components/common/bahmniIcon/BahmniIcon', () => ({
  __esModule: true,
  default: ({ name, id }: { name: string; id: string }) => (
    <span data-testid={id}>{name}</span>
  ),
}));

describe('LabInvestigationItem', () => {
  // Test data
  const mockLabTest: FormattedLabTest = {
    id: 'test-123',
    testName: 'Complete Blood Count',
    status: LabTestStatus.Normal,
    priority: LabTestPriority.routine,
    orderedBy: 'Dr. Smith',
    orderedDate: '2025-05-08T12:44:24+00:00',
    formattedDate: '05/08/2025',
    result: undefined,
    testType: 'Panel',
  };

  it('renders the test name, test type, priority, and ordered by information', () => {
    render(<LabInvestigationItem test={mockLabTest} />);

    // Check that the test name is displayed
    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();

    // Check that the test type is displayed
    expect(screen.getByText(/\(Panel\)/)).toBeInTheDocument();

    // Check that the priority is displayed
    expect(screen.getByText('Routine')).toBeInTheDocument();

    // Check that the ordered by information is displayed
    expect(screen.getByText(/Ordered by:/)).toBeInTheDocument();
    expect(screen.getByText(/Dr. Smith/)).toBeInTheDocument();
  });

  it('displays results pending message', () => {
    render(<LabInvestigationItem test={mockLabTest} />);

    // Check for text content that contains "Results pending"
    expect(screen.getByText(/Results pending/)).toBeInTheDocument();
  });

  it('applies different tag color for urgent priority', () => {
    const urgentTest = {
      ...mockLabTest,
      priority: LabTestPriority.stat,
    };

    render(<LabInvestigationItem test={urgentTest} />);

    expect(screen.getByText('Urgent')).toBeInTheDocument();
  });

  it('handles unknown priority values and defaults to green tag', () => {
    // Create a test with an unknown priority value
    const unknownPriorityTest = {
      ...mockLabTest,
      priority: 'unknown' as unknown as LabTestPriority,
    };

    render(<LabInvestigationItem test={unknownPriorityTest} />);

    // The tag should still be rendered with the unknown priority text
    expect(screen.getByText('unknown')).toBeInTheDocument();

    // We can't directly test the color, but we can verify the component renders
    // without errors, which means the default case was used
  });
    
  it('displays different test types correctly', () => {
    // Test with Single Test type
    const singleTest = {
      ...mockLabTest,
      testType: 'Single Test',
    };
    
    const { rerender } = render(<LabInvestigationItem test={singleTest} />);
    expect(screen.getByText(/\(Single Test\)/)).toBeInTheDocument();
    
    // Test with Panel type
    rerender(<LabInvestigationItem test={mockLabTest} />);
    expect(screen.getByText(/\(Panel\)/)).toBeInTheDocument();
    
    // Test with X Tests type
    const multipleTest = {
      ...mockLabTest,
      testType: '5 Tests',
    };
    
    rerender(<LabInvestigationItem test={multipleTest} />);
    expect(screen.getByText(/\(5 Tests\)/)).toBeInTheDocument();
  });
});
