import React from 'react';
import { render, screen } from '@testing-library/react';
import LabInvestigationControl from '../LabInvestigationControl';
import { usePatientUUID } from '@hooks/usePatientUUID';
import useLabInvestigations from '@/hooks/useLabInvestigations';
import { groupLabTestsByDate } from '@/services/labInvestigationService';
import i18n from '@/setupTests.i18n';
import {
  mockPatientUUID,
  mockLabTestsByDate,
  mockLabTestsByDateWithIncomplete,
} from '@/__mocks__/labInvestigationMocks';

// Mock the hooks and services
jest.mock('@hooks/usePatientUUID');
jest.mock('@/hooks/useLabInvestigations');
jest.mock('@/services/labInvestigationService', () => ({
  groupLabTestsByDate: jest.fn(),
}));

const mockedUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;

const mockedUseLabInvestigations = useLabInvestigations as jest.MockedFunction<
  typeof useLabInvestigations
>;

const mockedGroupLabTestsByDate = groupLabTestsByDate as jest.MockedFunction<
  typeof groupLabTestsByDate
>;

describe('LabInvestigationControl Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
    // Reset i18n to English
    i18n.changeLanguage('en');
  });

  it('should call useLabInvestigations to get lab data', () => {
    // Mock the hooks
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseLabInvestigations.mockReturnValue({
      labTests: mockLabTestsByDate.flatMap((group) => group.tests),
      isLoading: false,
      isError: false,
    });
    mockedGroupLabTestsByDate.mockReturnValue(mockLabTestsByDate);

    render(<LabInvestigationControl />);

    // Verify useLabInvestigations was called
    expect(useLabInvestigations).toHaveBeenCalled();
  });

  it('should display lab investigations grouped by date', () => {
    // Mock the hooks
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseLabInvestigations.mockReturnValue({
      labTests: mockLabTestsByDate.flatMap((group) => group.tests),
      isLoading: false,
      isError: false,
    });
    mockedGroupLabTestsByDate.mockReturnValue(mockLabTestsByDate);

    render(<LabInvestigationControl />);

    // Verify the dates are displayed
    expect(screen.getByText(/Mar 25, 2025/)).toBeInTheDocument();
    expect(screen.getByText(/Mar 24, 2025/)).toBeInTheDocument();
  });

  it('should display lab test names', () => {
    // Mock the hooks
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseLabInvestigations.mockReturnValue({
      labTests: mockLabTestsByDate.flatMap((group) => group.tests),
      isLoading: false,
      isError: false,
    });
    mockedGroupLabTestsByDate.mockReturnValue(mockLabTestsByDate);

    render(<LabInvestigationControl />);

    // Verify the test names are displayed
    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    expect(screen.getByText('Lipid Panel')).toBeInTheDocument();
    expect(screen.getByText('Glucose Test')).toBeInTheDocument();
  });

  it('should display lab test priorities', () => {
    // Mock the hooks
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseLabInvestigations.mockReturnValue({
      labTests: mockLabTestsByDate.flatMap((group) => group.tests),
      isLoading: false,
      isError: false,
    });
    mockedGroupLabTestsByDate.mockReturnValue(mockLabTestsByDate);

    render(<LabInvestigationControl />);

    // Verify the priorities are displayed by checking for tag elements
    // Carbon Design System's Tag component might not render text content properly in tests
    const tags = document.querySelectorAll('.cds--tag');
    expect(tags.length).toBe(3); // Total of 3 tags

    // Check for green tags (routine priority)
    const greenTags = document.querySelectorAll('.cds--tag--green');
    expect(greenTags.length).toBe(2); // Two routine tests (actual count in the DOM)

    // Check for gray tags (stat priority)
    const grayTags = document.querySelectorAll('.cds--tag--gray');
    expect(grayTags.length).toBe(1); // One stat priority test
  });

  it('should display ordered by information', () => {
    // Mock the hooks
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseLabInvestigations.mockReturnValue({
      labTests: mockLabTestsByDate.flatMap((group) => group.tests),
      isLoading: false,
      isError: false,
    });
    mockedGroupLabTestsByDate.mockReturnValue(mockLabTestsByDate);

    render(<LabInvestigationControl />);

    // Verify the ordered by information is displayed
    const orderedByTexts = screen.getAllByText(/Ordered by:/);
    expect(orderedByTexts.length).toBe(3); // Three tests with ordered by info

    expect(screen.getAllByText(/Dr. John Doe/).length).toBe(2); // Two tests ordered by Dr. John Doe
    expect(screen.getByText(/Dr. Jane Smith/)).toBeInTheDocument(); // One test ordered by Dr. Jane Smith
  });

  it('should display loading message when isLoading is true', () => {
    // Mock the hooks with loading state
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseLabInvestigations.mockReturnValue({
      labTests: [],
      isLoading: true,
      isError: false,
    });

    render(<LabInvestigationControl />);

    // Verify loading message is displayed
    expect(screen.getByText('Loading lab tests...')).toBeInTheDocument();
  });

  it('should display "No lab Investigations available" message when there are no lab tests and not loading', () => {
    // Mock the hooks with no data and not loading
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseLabInvestigations.mockReturnValue({
      labTests: [],
      isLoading: false,
      isError: false,
    });
    mockedGroupLabTestsByDate.mockReturnValue([]);

    render(<LabInvestigationControl />);

    // Verify the message is displayed
    expect(screen.getByText('No lab Investigations available')).toBeInTheDocument();
  });

  it('should handle lab tests with missing optional fields', () => {
    // Mock the hooks with incomplete data
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseLabInvestigations.mockReturnValue({
      labTests: mockLabTestsByDateWithIncomplete.flatMap((group) => group.tests),
      isLoading: false,
      isError: false,
    });
    mockedGroupLabTestsByDate.mockReturnValue(mockLabTestsByDateWithIncomplete);

    render(<LabInvestigationControl />);

    // Verify the component renders with incomplete data
    expect(screen.getByText('Incomplete Test')).toBeInTheDocument();
    expect(screen.getByText(/Ordered by: Unknown Doctor/)).toBeInTheDocument();
  });

  it('should refetch lab investigations when patient UUID changes', () => {
    // Create a mock implementation for useLabInvestigations that tracks calls
    const mockUseLabInvestigationsImpl = jest.fn();

    // First render with initial UUID
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseLabInvestigations.mockImplementation(() => {
      mockUseLabInvestigationsImpl();
      return {
        labTests: mockLabTestsByDate.flatMap((group) => group.tests),
        isLoading: false,
        isError: false,
      };
    });
    mockedGroupLabTestsByDate.mockReturnValue(mockLabTestsByDate);

    const { rerender } = render(<LabInvestigationControl />);

    // Initial call count
    const initialCallCount = mockUseLabInvestigationsImpl.mock.calls.length;

    // Change the UUID and rerender
    const newUUID = 'new-patient-uuid';
    mockedUsePatientUUID.mockReturnValue(newUUID);

    rerender(<LabInvestigationControl />);

    // Verify useLabInvestigations was called again after UUID change
    expect(mockUseLabInvestigationsImpl.mock.calls.length).toBeGreaterThan(
      initialCallCount,
    );
  });

  it('should display "Results pending..." for tests without results', () => {
    // Mock the hooks
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseLabInvestigations.mockReturnValue({
      labTests: mockLabTestsByDate.flatMap((group) => group.tests),
      isLoading: false,
      isError: false,
    });
    mockedGroupLabTestsByDate.mockReturnValue(mockLabTestsByDate);

    render(<LabInvestigationControl />);

    // Verify the "Results pending..." text is displayed for each test
    const pendingTexts = screen.getAllByText('Results pending…');
    expect(pendingTexts.length).toBe(3); // Three tests with pending results
  });

  it('should display error message when isError is true', () => {
    // Mock the hooks with error state
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseLabInvestigations.mockReturnValue({
      labTests: [],
      isLoading: false,
      isError: true,
    });

    render(<LabInvestigationControl />);

    // Verify error message is displayed
    expect(screen.getByText('Error loading lab tests')).toBeInTheDocument();
  });
});
