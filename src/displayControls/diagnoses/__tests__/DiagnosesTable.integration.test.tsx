import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import i18n from '@/setupTests.i18n';
import { CERTAINITY_CONCEPTS } from '@constants/concepts';
import { getPatientDiagnoses } from '@services/diagnosesService';
import { Diagnosis } from '@types/diagnosis';
import DiagnosesTable from '../DiagnosesTable';

// Mock only the service layer
jest.mock('@services/diagnosesService');

const mockedGetPatientDiagnoses = getPatientDiagnoses as jest.MockedFunction<
  typeof getPatientDiagnoses
>;

// Mock data for integration tests
const mockPatientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';

const mockDiagnoses: Diagnosis[] = [
  {
    id: 'diagnosis-1',
    display: 'Hypertension',
    certainty: CERTAINITY_CONCEPTS[0], // confirmed
    recordedDate: '2024-01-15T10:30:00Z',
    recorder: 'Dr. Smith',
  },
  {
    id: 'diagnosis-2',
    display: 'Diabetes Type 2',
    certainty: CERTAINITY_CONCEPTS[1], // provisional
    recordedDate: '2024-01-15T11:00:00Z',
    recorder: 'Dr. Johnson',
  },
  {
    id: 'diagnosis-3',
    display: 'Asthma',
    certainty: CERTAINITY_CONCEPTS[0], // confirmed
    recordedDate: '2024-01-10T14:20:00Z',
    recorder: '',
  },
];

const mockSingleDiagnosis: Diagnosis[] = [
  {
    id: 'diagnosis-single',
    display: 'High Blood Pressure',
    certainty: CERTAINITY_CONCEPTS[0],
    recordedDate: '2024-01-20T09:15:00Z',
    recorder: 'Dr. Williams',
  },
];

// Mock the usePatientUUID hook to return our test UUID
jest.mock('@hooks/usePatientUUID', () => ({
  usePatientUUID: () => mockPatientUUID,
}));

describe('DiagnosesTable Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
    // Reset i18n to English
    i18n.changeLanguage('en');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Data Fetching and Display Tests
  describe('Data Fetching and Display', () => {
    it('should fetch diagnosis data and display it correctly with multiple date groups', async () => {
      // Mock the service to return diagnoses
      mockedGetPatientDiagnoses.mockResolvedValue(mockDiagnoses);

      render(<DiagnosesTable />);

      // Wait for loading to complete and data to be displayed
      await waitFor(() => {
        expect(screen.getByText('Hypertension')).toBeInTheDocument();
      });

      // Verify the data fetching flow
      expect(getPatientDiagnoses).toHaveBeenCalledWith(mockPatientUUID);

      // Verify formatted dates are displayed as table titles
      expect(screen.getByText('January 15, 2024')).toBeInTheDocument();
      expect(screen.getByText('January 10, 2024')).toBeInTheDocument();

      // Verify diagnoses are displayed correctly
      expect(screen.getByText('Hypertension')).toBeInTheDocument();
      expect(screen.getByText('Diabetes Type 2')).toBeInTheDocument();
      expect(screen.getByText('Asthma')).toBeInTheDocument();

      // Verify recorders are displayed
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('Dr. Johnson')).toBeInTheDocument();
      expect(screen.getByText('Not available')).toBeInTheDocument(); // For empty recorder

      // Verify certainty tags are rendered
      expect(screen.getAllByText('Confirmed')).toHaveLength(2);
      expect(screen.getByText('Provisional')).toBeInTheDocument();
    });

    it('should render the loading state when data is being fetched', () => {
      // Mock the service to never resolve (simulating loading)
      mockedGetPatientDiagnoses.mockImplementation(() => new Promise(() => {}));

      render(<DiagnosesTable />);

      // Verify loading state is shown (looking for skeleton table)
      expect(screen.getByRole('table')).toHaveClass('cds--skeleton');
      expect(
        screen.queryByTestId('expandable-data-table'),
      ).not.toBeInTheDocument();
    });

    it('should display error message when data fetching fails', async () => {
      // Mock the service to reject
      mockedGetPatientDiagnoses.mockRejectedValue(new Error('Network error'));

      render(<DiagnosesTable />);

      // Wait for error to appear
      await waitFor(() => {
        expect(
          screen.getByText('Error fetching diagnoses. Please try again later.'),
        ).toBeInTheDocument();
      });

      // Verify no data tables are rendered
      expect(
        screen.queryByTestId('expandable-data-table'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('data-table-skeleton'),
      ).not.toBeInTheDocument();
    });

    it('should display component when the patient has no recorded diagnoses', async () => {
      // Mock the service to return empty array
      mockedGetPatientDiagnoses.mockResolvedValue([]);

      render(<DiagnosesTable />);

      // Wait for loading to complete - empty diagnoses still show skeleton initially
      await waitFor(() => {
        expect(screen.getByRole('table')).toHaveClass('cds--skeleton');
      });

      // Verify the component renders but with no data tables
      expect(
        screen.getByTestId('diagnoses-accordion-item'),
      ).toBeInTheDocument();
      expect(screen.getByText('Diagnoses')).toBeInTheDocument();
      expect(
        screen.queryByTestId('expandable-data-table'),
      ).not.toBeInTheDocument();
    });
  });

  // Certainty Tags and Styling Tests
  describe('Certainty Tags and Styling', () => {
    it('should render certainty tags with correct styling and labels', async () => {
      mockedGetPatientDiagnoses.mockResolvedValue(mockDiagnoses);

      render(<DiagnosesTable />);

      await waitFor(() => {
        expect(
          screen.queryByTestId('data-table-skeleton'),
        ).not.toBeInTheDocument();
      });

      // Verify confirmed tags
      const confirmedTags = screen.getAllByText('Confirmed');
      expect(confirmedTags).toHaveLength(2); // Hypertension and Asthma

      // Verify provisional tags
      const provisionalTags = screen.getAllByText('Provisional');
      expect(provisionalTags).toHaveLength(1); // Diabetes Type 2

      // Test that the tags have the correct CSS classes would require testing implementation details
      // This is covered by unit tests, so we focus on the integration aspect here
    });

    it('should handle different certainty codes correctly', async () => {
      const customDiagnoses: Diagnosis[] = [
        {
          id: 'custom-confirmed',
          display: 'Custom Confirmed Diagnosis',
          certainty: CERTAINITY_CONCEPTS[0], // confirmed
          recordedDate: '2024-01-25T10:00:00Z',
          recorder: 'Dr. Test',
        },
        {
          id: 'custom-provisional',
          display: 'Custom Provisional Diagnosis',
          certainty: CERTAINITY_CONCEPTS[1], // provisional
          recordedDate: '2024-01-25T11:00:00Z',
          recorder: 'Dr. Test',
        },
      ];

      mockedGetPatientDiagnoses.mockResolvedValue(customDiagnoses);

      render(<DiagnosesTable />);

      await waitFor(() => {
        expect(
          screen.queryByTestId('data-table-skeleton'),
        ).not.toBeInTheDocument();
      });

      // Verify both certainty types are rendered correctly
      expect(
        screen.getByText('Custom Confirmed Diagnosis'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Custom Provisional Diagnosis'),
      ).toBeInTheDocument();
      expect(screen.getByText('Confirmed')).toBeInTheDocument();
      expect(screen.getByText('Provisional')).toBeInTheDocument();
    });
  });

  // Table Configuration Tests
  describe('Table Configuration and Multiple Date Groups', () => {
    it('should display diagnoses grouped by date', async () => {
      mockedGetPatientDiagnoses.mockResolvedValue(mockDiagnoses);

      render(<DiagnosesTable />);

      await waitFor(() => {
        expect(screen.getByText('Hypertension')).toBeInTheDocument();
      });

      // Verify formatted dates are displayed as section headers
      expect(screen.getByText('January 15, 2024')).toBeInTheDocument();
      expect(screen.getByText('January 10, 2024')).toBeInTheDocument();

      // Verify all diagnoses are displayed
      expect(screen.getByText('Hypertension')).toBeInTheDocument();
      expect(screen.getByText('Diabetes Type 2')).toBeInTheDocument();
      expect(screen.getByText('Asthma')).toBeInTheDocument();
    });

    it('should handle single diagnosis correctly', async () => {
      mockedGetPatientDiagnoses.mockResolvedValue(mockSingleDiagnosis);

      render(<DiagnosesTable />);

      await waitFor(() => {
        expect(screen.getByText('High Blood Pressure')).toBeInTheDocument();
      });

      // Verify diagnosis is displayed correctly
      expect(screen.getByText('High Blood Pressure')).toBeInTheDocument();
      expect(screen.getByText('Dr. Williams')).toBeInTheDocument();
      expect(screen.getByText('January 20, 2024')).toBeInTheDocument();
    });

    it('should display all diagnosis information correctly', async () => {
      mockedGetPatientDiagnoses.mockResolvedValue(mockDiagnoses);

      render(<DiagnosesTable />);

      await waitFor(() => {
        expect(screen.getByText('Hypertension')).toBeInTheDocument();
      });

      // Verify diagnosis names from first date group (2024-01-15)
      expect(screen.getByText('Hypertension')).toBeInTheDocument();
      expect(screen.getByText('Diabetes Type 2')).toBeInTheDocument();

      // Verify diagnosis from second date group (2024-01-10)
      expect(screen.getByText('Asthma')).toBeInTheDocument();

      // Verify recorders
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('Dr. Johnson')).toBeInTheDocument();
      expect(screen.getByText('Not available')).toBeInTheDocument(); // For empty recorder
    });
  });

  // Edge Cases and Error Handling
  describe('Edge Cases and Error Handling', () => {
    it('should handle missing recorder fields gracefully', async () => {
      const diagnosesWithMissingRecorder: Diagnosis[] = [
        {
          id: 'diagnosis-missing-recorder',
          display: 'Diagnosis Without Recorder',
          certainty: CERTAINITY_CONCEPTS[0],
          recordedDate: '2024-01-30T12:00:00Z',
          recorder: '', // Empty recorder
        },
        {
          id: 'diagnosis-null-recorder',
          display: 'Diagnosis With Null Recorder',
          certainty: CERTAINITY_CONCEPTS[1],
          recordedDate: '2024-01-30T13:00:00Z',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          recorder: null as any, // Null recorder
        },
      ];

      mockedGetPatientDiagnoses.mockResolvedValue(diagnosesWithMissingRecorder);

      render(<DiagnosesTable />);

      // Wait for the data to load by checking for the diagnosis text
      await waitFor(() => {
        expect(
          screen.getByText('Diagnosis Without Recorder'),
        ).toBeInTheDocument();
      });

      // Verify both diagnoses are displayed
      expect(
        screen.getByText('Diagnosis Without Recorder'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Diagnosis With Null Recorder'),
      ).toBeInTheDocument();

      // Verify fallback text for missing recorders
      const notAvailable = screen.getAllByText('Not available');
      expect(notAvailable).toHaveLength(2);
    });

    it('should handle date group with empty diagnoses array', async () => {
      // With interface, empty array means no diagnoses at all
      mockedGetPatientDiagnoses.mockResolvedValue([]);

      render(<DiagnosesTable />);

      // Empty diagnoses still show skeleton initially, then show empty state
      await waitFor(() => {
        expect(screen.getByRole('table')).toHaveClass('cds--skeleton');
      });

      // Verify no data tables are rendered
      expect(
        screen.queryByTestId('expandable-data-table'),
      ).not.toBeInTheDocument();

      // Verify the main component is still rendered
      expect(
        screen.getByTestId('diagnoses-accordion-item'),
      ).toBeInTheDocument();
    });

    it('should handle service errors gracefully', async () => {
      // Mock service to throw an error
      mockedGetPatientDiagnoses.mockRejectedValue(
        new Error('Service unavailable'),
      );

      render(<DiagnosesTable />);

      await waitFor(() => {
        expect(
          screen.getByText('Error fetching diagnoses. Please try again later.'),
        ).toBeInTheDocument();
      });

      // Verify error state doesn't crash the component
      expect(
        screen.getByTestId('diagnoses-accordion-item'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('data-table-skeleton'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('expandable-data-table'),
      ).not.toBeInTheDocument();
    });

    it('should refetch diagnoses when component remounts', async () => {
      mockedGetPatientDiagnoses.mockResolvedValue(mockDiagnoses);

      const { unmount } = render(<DiagnosesTable />);

      await waitFor(() => {
        expect(screen.getByText('Hypertension')).toBeInTheDocument();
      });

      // Verify initial call
      expect(getPatientDiagnoses).toHaveBeenCalledTimes(1);
      expect(getPatientDiagnoses).toHaveBeenCalledWith(mockPatientUUID);

      // Unmount the component
      unmount();

      // Render a new instance of the component
      render(<DiagnosesTable />);

      await waitFor(() => {
        expect(screen.getByText('Hypertension')).toBeInTheDocument();
      });

      // Verify service was called again
      expect(getPatientDiagnoses).toHaveBeenCalledTimes(2);
    });
  });

  // Date Formatting Integration Tests
  describe('Date Formatting Integration', () => {
    it('should format dates correctly using real date utilities', async () => {
      const customDateDiagnoses: Diagnosis[] = [
        {
          id: 'christmas-diagnosis',
          display: 'Holiday Diagnosis',
          certainty: CERTAINITY_CONCEPTS[0],
          recordedDate: '2023-12-25T08:00:00Z',
          recorder: 'Dr. Holiday',
        },
      ];

      mockedGetPatientDiagnoses.mockResolvedValue(customDateDiagnoses);

      render(<DiagnosesTable />);

      // Wait for the diagnosis content to appear
      await waitFor(() => {
        expect(screen.getByText('Holiday Diagnosis')).toBeInTheDocument();
      });

      // Verify the date is formatted correctly
      expect(screen.getByText('December 25, 2023')).toBeInTheDocument();
      expect(screen.getByText('Holiday Diagnosis')).toBeInTheDocument();
    });

    it('should handle date formatting errors gracefully', async () => {
      // Create diagnoses with malformed date that might cause formatting issues
      const malformedDateDiagnoses: Diagnosis[] = [
        {
          id: 'malformed-date-diagnosis',
          display: 'Diagnosis with Bad Date',
          certainty: CERTAINITY_CONCEPTS[0],
          recordedDate: 'invalid-date-format',
          recorder: 'Dr. Test',
        },
      ];

      mockedGetPatientDiagnoses.mockResolvedValue(malformedDateDiagnoses);

      render(<DiagnosesTable />);

      // Wait for the diagnosis content to appear
      await waitFor(() => {
        expect(screen.getByText('Diagnosis with Bad Date')).toBeInTheDocument();
      });

      // Verify component doesn't crash with bad date
      expect(screen.getByText('Diagnosis with Bad Date')).toBeInTheDocument();
    });
  });
});
