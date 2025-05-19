import React from 'react';
import { render, screen } from '@testing-library/react';
import LabInvestigationItem from '../LabInvestigationItem';
import { FormattedLabTest, LabTestStatus, LabTestPriority, LabTestResult } from '@/types/labInvestigation';

// Mock the BahmniIcon component
jest.mock('@components/common/bahmniIcon/BahmniIcon', () => ({
  __esModule: true,
  default: ({ name, size, id }: { name: string; size: string; id: string }) => (
    <span data-testid={id}>{name}</span>
  ),
}));

describe('LabInvestigationItem', () => {
  // Test data
  const mockLabTest: FormattedLabTest = {
    id: 'test-123',
    testName: 'Complete Blood Count',
    status: LabTestStatus.Normal,
    priority: LabTestPriority.Routine,
    orderedBy: 'Dr. Smith',
    orderedDate: '2025-05-08T12:44:24+00:00',
    formattedDate: '05/08/2025',
    result: undefined,
  };

  const mockLabTestWithResults: FormattedLabTest = {
    ...mockLabTest,
    result: [
      {
        parameter: 'Hemoglobin',
        value: '14.5',
        unit: 'g/dL',
        referenceRange: '13.5-17.5',
      },
      {
        parameter: 'White Blood Cells',
        value: '7.5',
        unit: 'K/uL',
        referenceRange: '4.5-11.0',
      },
    ],
  };

  it('renders the test name, status, priority, and ordered by information', () => {
    render(<LabInvestigationItem test={mockLabTest} />);
    
    // Check that the test name is displayed
    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    
    // Check that the status is displayed
    expect(screen.getByText('Normal')).toBeInTheDocument();
    
    // Check that the priority is displayed
    expect(screen.getByText('Routine')).toBeInTheDocument();
    
    // Check that the ordered by information is displayed
    expect(screen.getByText(/Ordered by:/)).toBeInTheDocument();
    expect(screen.getByText(/Dr. Smith/)).toBeInTheDocument();
  });

  it('displays "Results pending..." when no results are available', () => {
    render(<LabInvestigationItem test={mockLabTest} />);
    
    expect(screen.getByText('Results pending...')).toBeInTheDocument();
  });

  it('renders a table with results when results are available', () => {
    render(<LabInvestigationItem test={mockLabTestWithResults} />);
    
    // Check that the table headers are displayed
    expect(screen.getByText('Parameter')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
    expect(screen.getByText('Unit')).toBeInTheDocument();
    expect(screen.getByText('Reference Range')).toBeInTheDocument();
    
    // Check that the result values are displayed
    expect(screen.getByText('Hemoglobin')).toBeInTheDocument();
    expect(screen.getByText('14.5')).toBeInTheDocument();
    expect(screen.getByText('g/dL')).toBeInTheDocument();
    expect(screen.getByText('13.5-17.5')).toBeInTheDocument();
    
    expect(screen.getByText('White Blood Cells')).toBeInTheDocument();
    expect(screen.getByText('7.5')).toBeInTheDocument();
    expect(screen.getByText('K/uL')).toBeInTheDocument();
    expect(screen.getByText('4.5-11.0')).toBeInTheDocument();
  });

  it('applies different styling for abnormal status', () => {
    const abnormalTest = {
      ...mockLabTest,
      status: LabTestStatus.Abnormal,
    };
    
    render(<LabInvestigationItem test={abnormalTest} />);
    
    expect(screen.getByText('Abnormal')).toBeInTheDocument();
  });

  it('applies different tag color for urgent priority', () => {
    const urgentTest = {
      ...mockLabTest,
      priority: LabTestPriority.Urgent,
    };
    
    render(<LabInvestigationItem test={urgentTest} />);
    
    expect(screen.getByText('Urgent')).toBeInTheDocument();
  });

  it('applies different tag color for stat priority', () => {
    const statTest = {
      ...mockLabTest,
      priority: LabTestPriority.Stat,
    };
    
    render(<LabInvestigationItem test={statTest} />);
    
    expect(screen.getByText('Stat')).toBeInTheDocument();
  });
});
