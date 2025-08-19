import '@testing-library/jest-dom';
import {
  FormattedLabTest,
  LabTestPriority,
} from '@bahmni-frontend/bahmni-services';
import { render, screen } from '@testing-library/react';
import LabInvestigationItem from '../LabInvestigationItem';

jest.mock('@bahmni-frontend/bahmni-services', () => ({
  ...jest.requireActual('@bahmni-frontend/bahmni-services'),
  useTranslation: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

const mockUseTranslation = require('@bahmni-frontend/bahmni-services')
  .useTranslation as jest.MockedFunction<any>;

describe('LabInvestigationItem', () => {
  const baseLabTest: FormattedLabTest = {
    id: 'test-123',
    testName: 'Complete Blood Count',
    priority: LabTestPriority.routine,
    orderedBy: 'Dr. Smith',
    orderedDate: '2025-05-08T12:44:24+00:00',
    formattedDate: '05/08/2025',
    result: undefined,
    testType: 'Individual',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseTranslation.mockReturnValue({
      t: (key: string) => {
        const translations: Record<string, string> = {
          LAB_TEST_PANEL: 'Panel',
          LAB_TEST_STAT: 'STAT',
          LAB_TEST_URGENT: 'STAT',
          LAB_TEST_ORDERED_BY: 'Ordered by',
          LAB_TEST_RESULTS_PENDING: 'Results Pending',
        };
        return translations[key] || key;
      },
    });
  });

  it('renders test name', () => {
    render(<LabInvestigationItem test={baseLabTest} />);

    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
  });

  it('renders ordered by information', () => {
    render(<LabInvestigationItem test={baseLabTest} />);

    expect(screen.getByText('Ordered by: Dr. Smith')).toBeInTheDocument();
  });

  it('renders results pending message', () => {
    render(<LabInvestigationItem test={baseLabTest} />);

    expect(screen.getByText('Results Pending ....')).toBeInTheDocument();
  });

  it('shows test type info only for Panel tests', () => {
    const panelTest = { ...baseLabTest, testType: 'Panel' };
    render(<LabInvestigationItem test={panelTest} />);

    expect(screen.getByText('Panel')).toBeInTheDocument();
  });

  it('does not show test type info for non-Panel tests', () => {
    render(<LabInvestigationItem test={baseLabTest} />);

    expect(screen.queryByText('Individual')).not.toBeInTheDocument();
  });

  it('shows priority tag for stat priority', () => {
    const statTest = { ...baseLabTest, priority: LabTestPriority.stat };
    render(<LabInvestigationItem test={statTest} />);

    expect(screen.getByText('STAT')).toBeInTheDocument();
  });

  it('does not show priority tag for routine priority', () => {
    render(<LabInvestigationItem test={baseLabTest} />);

    expect(screen.queryByText('STAT')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(`lab-test-priority-${LabTestPriority.routine}`),
    ).not.toBeInTheDocument();
  });

  it('renders Panel test with stat priority correctly', () => {
    const panelStatTest = {
      ...baseLabTest,
      testType: 'Panel',
      priority: LabTestPriority.stat,
    };
    render(<LabInvestigationItem test={panelStatTest} />);

    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    expect(screen.getByText('Panel')).toBeInTheDocument();
    expect(screen.getByText('STAT')).toBeInTheDocument();
    expect(screen.getByText('Ordered by: Dr. Smith')).toBeInTheDocument();
    expect(screen.getByText('Results Pending ....')).toBeInTheDocument();
  });
});
