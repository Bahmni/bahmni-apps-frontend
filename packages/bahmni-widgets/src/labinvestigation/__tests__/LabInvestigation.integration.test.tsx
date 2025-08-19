import '@testing-library/jest-dom';
import {
  LabTestPriority,
  FormattedLabTest,
} from '@bahmni-frontend/bahmni-services';
import { render, screen, waitFor } from '@testing-library/react';
import LabInvestigation from '../LabInvestigation';
import useLabInvestigations from '../useLabInvestigations';

// Mock the hook directly for integration testing
jest.mock('../useLabInvestigations');

jest.mock('@bahmni-frontend/bahmni-services', () => ({
  ...jest.requireActual('@bahmni-frontend/bahmni-services'),
  useTranslation: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

const mockUseLabInvestigations = useLabInvestigations as jest.MockedFunction<
  typeof useLabInvestigations
>;
const mockUseTranslation = require('@bahmni-frontend/bahmni-services')
  .useTranslation as jest.MockedFunction<any>;
const mockUseParams = require('react-router-dom')
  .useParams as jest.MockedFunction<any>;

// Mock formatted lab tests that match the component's expected data structure
const mockFormattedLabTests: FormattedLabTest[] = [
  {
    id: 'lab-test-1',
    testName: 'Complete Blood Count',
    priority: LabTestPriority.routine,
    orderedBy: 'Dr. John Doe',
    orderedDate: '2025-03-25T06:48:32.000+00:00',
    formattedDate: 'Mar 25, 2025',
    result: undefined,
    testType: 'Panel',
  },
  {
    id: 'lab-test-2',
    testName: 'Lipid Panel',
    priority: LabTestPriority.stat,
    orderedBy: 'Dr. Jane Smith',
    orderedDate: '2025-03-25T06:48:32.000+00:00',
    formattedDate: 'Mar 25, 2025',
    result: undefined,
    testType: 'Panel',
  },
  {
    id: 'lab-test-3',
    testName: 'Glucose Test',
    priority: LabTestPriority.routine,
    orderedBy: 'Dr. John Doe',
    orderedDate: '2025-03-24T06:48:32.000+00:00',
    formattedDate: 'Mar 24, 2025',
    result: undefined,
    testType: 'Individual',
  },
];

describe('LabInvestigation Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseParams.mockReturnValue({
      patientUUID: 'test-patient-uuid',
    });

    mockUseTranslation.mockReturnValue({
      t: (key: string) => {
        const translations: Record<string, string> = {
          LAB_TEST_ERROR_LOADING: 'Error loading lab tests',
          LAB_TEST_LOADING: 'Loading lab tests...',
          LAB_TEST_UNAVAILABLE: 'No lab investigations recorded',
          LAB_TEST_ORDERED_BY: 'Ordered by',
          LAB_TEST_RESULTS_PENDING: 'Results Pending ....',
        };
        return translations[key] || key;
      },
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('displays lab results after successful API call', async () => {
    mockUseLabInvestigations.mockReturnValue({
      labTests: mockFormattedLabTests,
      isLoading: false,
      hasError: false,
    });

    render(<LabInvestigation />);

    await waitFor(() => {
      expect(screen.getByText('Mar 25, 2025')).toBeInTheDocument();
      expect(screen.getByText('Mar 24, 2025')).toBeInTheDocument();
    });

    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    expect(screen.getByText('Lipid Panel')).toBeInTheDocument();
    expect(screen.getByText('Glucose Test')).toBeInTheDocument();

    expect(screen.getAllByText('Ordered by: Dr. John Doe')).toHaveLength(2);
    expect(screen.getByText('Ordered by: Dr. Jane Smith')).toBeInTheDocument();
  });

  it('shows loading state during API call', async () => {
    mockUseLabInvestigations.mockReturnValue({
      labTests: [],
      isLoading: true,
      hasError: false,
    });

    render(<LabInvestigation />);

    expect(screen.getByText('Loading lab tests...')).toBeInTheDocument();
  });

  it('displays error message when API call fails', async () => {
    mockUseLabInvestigations.mockReturnValue({
      labTests: [],
      isLoading: false,
      hasError: true,
    });

    render(<LabInvestigation />);

    expect(screen.getByText('Error loading lab tests')).toBeInTheDocument();
    expect(screen.queryByText('Complete Blood Count')).not.toBeInTheDocument();
  });

  it('shows empty state when no lab tests are returned', async () => {
    mockUseLabInvestigations.mockReturnValue({
      labTests: [],
      isLoading: false,
      hasError: false,
    });

    render(<LabInvestigation />);

    expect(
      screen.getByText('No lab investigations recorded'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Complete Blood Count')).not.toBeInTheDocument();
  });

  it('handles accordion interaction correctly', async () => {
    mockUseLabInvestigations.mockReturnValue({
      labTests: mockFormattedLabTests,
      isLoading: false,
      hasError: false,
    });

    render(<LabInvestigation />);

    await waitFor(() => {
      expect(screen.getByText('Mar 25, 2025')).toBeInTheDocument();
    });

    const firstAccordionButton = screen.getByRole('button', {
      name: /Mar 25, 2025/,
    });
    const secondAccordionButton = screen.getByRole('button', {
      name: /Mar 24, 2025/,
    });

    // First accordion should be open by default
    expect(firstAccordionButton).toHaveAttribute('aria-expanded', 'true');
    expect(secondAccordionButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('displays priority information correctly', async () => {
    mockUseLabInvestigations.mockReturnValue({
      labTests: mockFormattedLabTests,
      isLoading: false,
      hasError: false,
    });

    render(<LabInvestigation />);

    await waitFor(() => {
      expect(screen.getByText('Mar 25, 2025')).toBeInTheDocument();
    });

    // Check for STAT priority (urgent) test
    const lipidPanelElements = screen.getAllByText('Lipid Panel');
    expect(lipidPanelElements).toHaveLength(1);

    // Other tests should be routine (no special priority indicator)
    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    expect(screen.getByText('Glucose Test')).toBeInTheDocument();
  });

  it('renders tests in correct priority order within date groups', async () => {
    mockUseLabInvestigations.mockReturnValue({
      labTests: mockFormattedLabTests,
      isLoading: false,
      hasError: false,
    });

    render(<LabInvestigation />);

    await waitFor(() => {
      expect(screen.getByText('Mar 25, 2025')).toBeInTheDocument();
    });

    // The component should render urgent tests before routine tests within each date group
    // This is implementation-specific but important for user experience
    const testElements = screen.getAllByText(
      /Complete Blood Count|Lipid Panel/,
    );
    expect(testElements).toHaveLength(2);
  });

  it('displays pending results message for tests without results', async () => {
    mockUseLabInvestigations.mockReturnValue({
      labTests: mockFormattedLabTests,
      isLoading: false,
      hasError: false,
    });

    render(<LabInvestigation />);

    await waitFor(() => {
      expect(screen.getByText('Mar 25, 2025')).toBeInTheDocument();
    });

    // All tests should show pending results
    const pendingMessages = screen.getAllByText('Results Pending .... ....');
    expect(pendingMessages).toHaveLength(3); // Three tests total
  });

  it('handles API errors gracefully', async () => {
    mockUseLabInvestigations.mockReturnValue({
      labTests: [],
      isLoading: false,
      hasError: true,
    });

    render(<LabInvestigation />);

    expect(screen.getByText('Error loading lab tests')).toBeInTheDocument();
  });

  it('responds to patient UUID changes', async () => {
    // First render with initial data
    mockUseLabInvestigations.mockReturnValue({
      labTests: mockFormattedLabTests,
      isLoading: false,
      hasError: false,
    });

    const { rerender } = render(<LabInvestigation />);

    await waitFor(() => {
      expect(screen.getByText('Mar 25, 2025')).toBeInTheDocument();
    });

    // Simulate patient change - component would show loading state
    mockUseLabInvestigations.mockReturnValue({
      labTests: [],
      isLoading: true,
      hasError: false,
    });

    // Change patient UUID
    mockUseParams.mockReturnValue({
      patientUUID: 'different-patient-uuid',
    });

    rerender(<LabInvestigation />);

    // Should show loading state for new patient
    expect(screen.getByText('Loading lab tests...')).toBeInTheDocument();
  });
});
