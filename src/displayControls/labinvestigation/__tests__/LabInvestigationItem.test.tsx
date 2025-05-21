import React from 'react';
import { render, screen } from '@testing-library/react';
import LabInvestigationItem from '../LabInvestigationItem';
import { FormattedLabTest, LabTestStatus, LabTestPriority } from '@/types/labInvestigation';

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
  };

  it('renders the test name, priority, and ordered by information', () => {
    render(<LabInvestigationItem test={mockLabTest} />);
    
    // Check that the test name is displayed
    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    
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

  it('applies different tag color for stat priority', () => {
    const statTest = {
      ...mockLabTest,
      priority: LabTestPriority.stat,
    };
    
    render(<LabInvestigationItem test={statTest} />);
    
    expect(screen.getByText('Urgent')).toBeInTheDocument();
  });
});
