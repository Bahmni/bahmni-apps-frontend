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

  // Data Fetching and Display Tests
  describe('Data Fetching and Display', () => {
    it('should fetch diagnosis data and display it correctly', async () => {
      // Mock the service to return diagnoses
      mockedGetPatientDiagnoses.mockResolvedValue(mockDiagnoses);

      render(<DiagnosesTable />);

      // Wait for loading to complete and data to be displayed
      await waitFor(() => {
        expect(screen.getByText('Hypertension')).toBeInTheDocument();
      });

      // Verify the data fetching flow
      expect(getPatientDiagnoses).toHaveBeenCalledWith(mockPatientUUID);

      expect(screen.getByTestId('diagnoses-table')).toBeInTheDocument();
      expect(screen.getByTestId('sortable-data-table')).toBeInTheDocument();

      // Verify diagnoses are displayed correctly
      expect(screen.getByText('Hypertension')).toBeInTheDocument();
      expect(screen.getByText('Diabetes Type 2')).toBeInTheDocument();
      expect(screen.getByText('Asthma')).toBeInTheDocument();

      // Verify recorders are displayed
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('Dr. Johnson')).toBeInTheDocument();
      expect(screen.getByText('Not available')).toBeInTheDocument(); // For empty recorder

      // Verify certainty tags are rendered
      expect(screen.getByText('Provisional')).toBeInTheDocument();
      expect(screen.getAllByText('Confirmed')).toHaveLength(2);

      // Verify recorded dates are formatted and displayed
      expect(screen.getAllByText('15/01/2024')).toHaveLength(2); // Hypertension and Diabetes
      expect(screen.getByText('10/01/2024')).toBeInTheDocument(); // Asthma

      // Verify data is sorted by date (most recent first)
      // The component uses sortByDate which should sort by recordedDate in descending order
      const diagnosisNames = screen.getAllByText(
        /Asthma|Hypertension|Diabetes Type 2/,
      );

      // Based on the dates: Diabetes (11:00) should come before Hypertension (10:30) on same day,
      // and both should come before Asthma (older date)
      expect(diagnosisNames[0]).toHaveTextContent('Diabetes Type 2'); // 2024-01-15T11:00:00Z
      expect(diagnosisNames[1]).toHaveTextContent('Hypertension'); // 2024-01-15T10:30:00Z
      expect(diagnosisNames[2]).toHaveTextContent('Asthma'); // 2024-01-10T14:20:00Z
    });

    it('should display component when the patient has no recorded diagnoses', async () => {
      // Mock the service to return empty array
      mockedGetPatientDiagnoses.mockResolvedValue([]);

      render(<DiagnosesTable />);

      await waitFor(() => {
        // Verify the component renders but with no data tables
        expect(screen.getByText('Diagnoses')).toBeInTheDocument();
        expect(screen.getByTestId('sortable-table-empty')).toBeInTheDocument();
        expect(
          screen.queryByTestId('sortable-data-table'),
        ).not.toBeInTheDocument();
      });
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

    it('should handle service errors gracefully', async () => {
      // Mock service to throw an error
      mockedGetPatientDiagnoses.mockRejectedValue(
        new Error('Service unavailable'),
      );

      render(<DiagnosesTable />);

      await waitFor(() => {
        expect(screen.getByText('Service unavailable')).toBeInTheDocument();
      });

      // Verify error state doesn't crash the component
      expect(screen.getByTestId('diagnoses-title')).toBeInTheDocument();
      expect(screen.getByTestId('sortable-table-error')).toBeInTheDocument();
    });
  });
});
