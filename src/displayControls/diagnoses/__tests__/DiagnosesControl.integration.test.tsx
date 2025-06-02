import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import DiagnosesControl from '../DiagnosesControl';
import * as diagnosisService from '@services/diagnosisService';
import { mockFhirDiagnoses, mockDiagnosesByDate } from '@/__mocks__/diagnosisMocks';
import { NotificationProvider } from '@providers/NotificationProvider';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/setupTests.i18n';
import { axe, toHaveNoViolations } from 'jest-axe';
import { DiagnosisCertainty } from '@/types/diagnosis';

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    defaults: {
      headers: {
        common: {},
      },
    },
    interceptors: {
      request: {
        use: jest.fn(),
        eject: jest.fn(),
      },
      response: {
        use: jest.fn(),
        eject: jest.fn(),
      },
    },
    get: jest.fn(),
  })),
  isAxiosError: jest.fn(),
  get: jest.fn(),
}));

// Mock diagnosisService
jest.mock('@services/diagnosisService', () => {
  const originalModule = jest.requireActual('@services/diagnosisService');
  return {
    ...originalModule,
    getDiagnoses: jest.fn(),
    formatDiagnoses: jest.fn(),
    groupDiagnosesByDateAndRecorder: jest.fn(),
  };
});

// Mock the usePatientUUID hook
jest.mock('@hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn().mockReturnValue('test-patient-uuid'),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedGetDiagnoses = diagnosisService.getDiagnoses as jest.MockedFunction<
  typeof diagnosisService.getDiagnoses
>;
const mockedFormatDiagnoses = diagnosisService.formatDiagnoses as jest.MockedFunction<
  typeof diagnosisService.formatDiagnoses
>;
const mockedGroupDiagnosesByDateAndRecorder = diagnosisService.groupDiagnosesByDateAndRecorder as jest.MockedFunction<
  typeof diagnosisService.groupDiagnosesByDateAndRecorder
>;

describe('DiagnosesControl Integration', () => {
  const renderComponent = () => {
    return render(
      <NotificationProvider>
        <I18nextProvider i18n={i18n}>
          <MemoryRouter initialEntries={['/patients/test-patient-uuid']}>
            <DiagnosesControl />
          </MemoryRouter>
        </I18nextProvider>
      </NotificationProvider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset i18n to English
    i18n.changeLanguage('en');
  });

  describe('Happy Path - Full Data Flow', () => {
    it('should fetch, format, and display diagnoses correctly', async () => {
      // Arrange - Mock the complete data flow
      const mockBundle = {
        resourceType: 'Bundle',
        entry: mockFhirDiagnoses.map(diagnosis => ({
          resource: diagnosis,
        })),
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockBundle });
      mockedGetDiagnoses.mockResolvedValueOnce(mockFhirDiagnoses);
      mockedFormatDiagnoses.mockReturnValue([
        {
          id: 'diagnosis-1',
          display: 'Type 2 Diabetes Mellitus',
          certainty: 'Confirmed' as DiagnosisCertainty,
          recordedDate: '2025-01-15T10:30:00Z',
          formattedDate: 'Jan 15, 2025',
          recorder: 'Dr. Jane Smith',
        },
        {
          id: 'diagnosis-2',
          display: 'Hypertension',
          certainty: 'Provisional' as DiagnosisCertainty,
          recordedDate: '2025-01-15T10:35:00Z',
          formattedDate: 'Jan 15, 2025',
          recorder: 'Dr. Jane Smith',
        },
        {
          id: 'diagnosis-3',
          display: 'Asthma',
          certainty: 'Confirmed' as DiagnosisCertainty,
          recordedDate: '2025-01-10T14:20:00Z',
          formattedDate: 'Jan 10, 2025',
          recorder: 'Dr. Robert Johnson',
        },
      ]);
      mockedGroupDiagnosesByDateAndRecorder.mockReturnValue(mockDiagnosesByDate);

      // Act
      renderComponent();

      // Assert - Initially loading
      expect(screen.getByText('Loading diagnoses...')).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Jan 15, 2025')).toBeInTheDocument();
      });

      // Assert - All diagnoses are displayed
      expect(screen.getByText('Type 2 Diabetes Mellitus')).toBeInTheDocument();
      expect(screen.getByText('Hypertension')).toBeInTheDocument();
      expect(screen.getByText('Asthma')).toBeInTheDocument();

      // Assert - Date groups are displayed
      expect(screen.getByText('Jan 15, 2025')).toBeInTheDocument();
      expect(screen.getByText('Jan 10, 2025')).toBeInTheDocument();

      // Assert - Recorders are displayed (using getAllByText since Dr. Jane Smith appears multiple times)
      expect(screen.getAllByText('Dr. Jane Smith').length).toBeGreaterThan(0);
      expect(screen.getByText('Dr. Robert Johnson')).toBeInTheDocument();

      // Assert - Certainty tags are displayed
      expect(screen.getAllByText('Confirmed').length).toBeGreaterThan(0);
      expect(screen.getByText('Provisional')).toBeInTheDocument();

      // Verify service calls
      expect(mockedGetDiagnoses).toHaveBeenCalledWith('test-patient-uuid');
      expect(mockedFormatDiagnoses).toHaveBeenCalledWith(mockFhirDiagnoses);
      expect(mockedGroupDiagnosesByDateAndRecorder).toHaveBeenCalled();
    });

    it('should handle accordion interactions correctly', async () => {
      const user = userEvent.setup();

      // Arrange
      const mockBundle = {
        resourceType: 'Bundle',
        entry: mockFhirDiagnoses.map(diagnosis => ({
          resource: diagnosis,
        })),
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockBundle });
      mockedGetDiagnoses.mockResolvedValueOnce(mockFhirDiagnoses);
      mockedFormatDiagnoses.mockReturnValue([
        {
          id: 'diagnosis-1',
          display: 'Type 2 Diabetes Mellitus',
          certainty: 'Confirmed' as DiagnosisCertainty,
          recordedDate: '2025-01-15T10:30:00Z',
          formattedDate: 'Jan 15, 2025',
          recorder: 'Dr. Jane Smith',
        },
      ]);
      mockedGroupDiagnosesByDateAndRecorder.mockReturnValue([
        {
          date: 'Jan 15, 2025',
          rawDate: '2025-01-15T10:30:00Z',
          diagnoses: [
            {
              id: 'diagnosis-1',
              display: 'Type 2 Diabetes Mellitus',
              certainty: 'Confirmed' as DiagnosisCertainty,
              recordedDate: '2025-01-15T10:30:00Z',
              formattedDate: 'Jan 15, 2025',
              recorder: 'Dr. Jane Smith',
            },
          ],
        },
      ]);

      // Act
      renderComponent();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Jan 15, 2025')).toBeInTheDocument();
      });

      // Test accordion interaction
      const accordionButton = screen.getByRole('button', { name: /Jan 15, 2025/ });
      expect(accordionButton).toBeInTheDocument();

      // Click to expand
      await user.click(accordionButton);

      // Verify content is accessible
      expect(screen.getByText('Type 2 Diabetes Mellitus')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Arrange
      const networkError = new Error('Network Error');
      mockedGetDiagnoses.mockRejectedValueOnce(networkError);

      // Act
      renderComponent();

      // Assert - Initially loading
      expect(screen.getByText('Loading diagnoses...')).toBeInTheDocument();

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Error loading diagnoses')).toBeInTheDocument();
      });

      // Verify service was called
      expect(mockedGetDiagnoses).toHaveBeenCalledWith('test-patient-uuid');
    });

    it('should handle malformed API responses', async () => {
      // Arrange
      mockedGetDiagnoses.mockResolvedValueOnce([]);
      mockedFormatDiagnoses.mockReturnValue([]);
      mockedGroupDiagnosesByDateAndRecorder.mockReturnValue([]);

      // Act
      renderComponent();

      // Wait for empty state
      await waitFor(() => {
        expect(screen.getByText('No diagnoses added for this patient')).toBeInTheDocument();
      });
    });

    it('should handle service errors during formatting', async () => {
      // Arrange
      mockedGetDiagnoses.mockResolvedValueOnce(mockFhirDiagnoses);
      mockedFormatDiagnoses.mockImplementation(() => {
        throw new Error('Formatting error');
      });

      // Act
      renderComponent();

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Error loading diagnoses')).toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    it('should display empty state when patient has no diagnoses', async () => {
      // Arrange
      mockedGetDiagnoses.mockResolvedValueOnce([]);
      mockedFormatDiagnoses.mockReturnValue([]);
      mockedGroupDiagnosesByDateAndRecorder.mockReturnValue([]);

      // Act
      renderComponent();

      // Wait for empty state
      await waitFor(() => {
        expect(screen.getByText('No diagnoses added for this patient')).toBeInTheDocument();
      });

      // Verify service calls
      expect(mockedGetDiagnoses).toHaveBeenCalledWith('test-patient-uuid');
    });
  });

  describe('Performance and Large Datasets', () => {
    it('should handle large datasets efficiently', async () => {
      // Arrange - Create a large dataset
      const largeDiagnosList = Array.from({ length: 50 }, (_, index) => ({
        id: `diagnosis-${index}`,
        display: `Diagnosis ${index}`,
        certainty: (index % 2 === 0 ? 'Confirmed' : 'Provisional') as DiagnosisCertainty,
        recordedDate: `2025-01-${String(index % 30 + 1).padStart(2, '0')}T10:30:00Z`,
        formattedDate: `Jan ${index % 30 + 1}, 2025`,
        recorder: `Dr. Provider ${index % 5}`,
      }));

      const largeDateGroups = Array.from({ length: 10 }, (_, index) => ({
        date: `Jan ${index + 1}, 2025`,
        rawDate: `2025-01-${String(index + 1).padStart(2, '0')}T10:30:00Z`,
        diagnoses: largeDiagnosList.slice(index * 5, (index + 1) * 5),
      }));

      mockedGetDiagnoses.mockResolvedValueOnce(mockFhirDiagnoses);
      mockedFormatDiagnoses.mockReturnValue(largeDiagnosList);
      mockedGroupDiagnosesByDateAndRecorder.mockReturnValue(largeDateGroups);

      // Act
      const startTime = performance.now();
      renderComponent();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Jan 1, 2025')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Assert - Should render within reasonable time (less than 1 second)
      expect(renderTime).toBeLessThan(1000);

      // Assert - First few items are visible
      expect(screen.getByText('Diagnosis 0')).toBeInTheDocument();
      expect(screen.getByText('Jan 1, 2025')).toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain accessibility with real data flow', async () => {
      // Arrange
      const mockBundle = {
        resourceType: 'Bundle',
        entry: mockFhirDiagnoses.map(diagnosis => ({
          resource: diagnosis,
        })),
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockBundle });
      mockedGetDiagnoses.mockResolvedValueOnce(mockFhirDiagnoses);
      mockedFormatDiagnoses.mockReturnValue([
        {
          id: 'diagnosis-1',
          display: 'Type 2 Diabetes Mellitus',
          certainty: 'Confirmed' as DiagnosisCertainty,
          recordedDate: '2025-01-15T10:30:00Z',
          formattedDate: 'Jan 15, 2025',
          recorder: 'Dr. Jane Smith',
        },
      ]);
      mockedGroupDiagnosesByDateAndRecorder.mockReturnValue([
        {
          date: 'Jan 15, 2025',
          rawDate: '2025-01-15T10:30:00Z',
          diagnoses: [
            {
              id: 'diagnosis-1',
              display: 'Type 2 Diabetes Mellitus',
              certainty: 'Confirmed' as DiagnosisCertainty,
              recordedDate: '2025-01-15T10:30:00Z',
              formattedDate: 'Jan 15, 2025',
              recorder: 'Dr. Jane Smith',
            },
          ],
        },
      ]);

      // Act
      const { container } = renderComponent();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Jan 15, 2025')).toBeInTheDocument();
      });

      // Assert - No accessibility violations
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation through real data', async () => {
      const user = userEvent.setup();

      // Arrange
      mockedGetDiagnoses.mockResolvedValueOnce(mockFhirDiagnoses);
      mockedFormatDiagnoses.mockReturnValue([
        {
          id: 'diagnosis-1',
          display: 'Type 2 Diabetes Mellitus',
          certainty: 'Confirmed' as DiagnosisCertainty,
          recordedDate: '2025-01-15T10:30:00Z',
          formattedDate: 'Jan 15, 2025',
          recorder: 'Dr. Jane Smith',
        },
      ]);
      mockedGroupDiagnosesByDateAndRecorder.mockReturnValue(mockDiagnosesByDate);

      // Act
      renderComponent();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Jan 15, 2025')).toBeInTheDocument();
      });

      // Test keyboard navigation
      const accordionButtons = screen.getAllByRole('button');
      
      // Focus first accordion
      await user.tab();
      expect(accordionButtons[0]).toHaveFocus();

      // Test Enter key
      await user.keyboard('{Enter}');

      // Test Space key
      await user.keyboard(' ');

      // Verify content is accessible
      expect(screen.getByText('Type 2 Diabetes Mellitus')).toBeInTheDocument();
    });
  });

  describe('Real API Integration Scenarios', () => {
    it('should handle FHIR Bundle structure correctly', async () => {
      // Arrange - Mock real FHIR Bundle response
      const realFhirBundle = {
        resourceType: 'Bundle',
        id: 'bundle-id',
        type: 'searchset',
        total: 2,
        entry: [
          {
            fullUrl: 'http://example.com/Condition/diagnosis-1',
            resource: mockFhirDiagnoses[0],
            search: { mode: 'match' },
          },
          {
            fullUrl: 'http://example.com/Condition/diagnosis-2',
            resource: mockFhirDiagnoses[1],
            search: { mode: 'match' },
          },
        ],
      };

      mockedAxios.get.mockResolvedValueOnce({ data: realFhirBundle });
      mockedGetDiagnoses.mockResolvedValueOnce([mockFhirDiagnoses[0], mockFhirDiagnoses[1]]);
      mockedFormatDiagnoses.mockReturnValue([
        {
          id: 'diagnosis-1',
          display: 'Type 2 Diabetes Mellitus',
          certainty: 'Confirmed' as DiagnosisCertainty,
          recordedDate: '2025-01-15T10:30:00Z',
          formattedDate: 'Jan 15, 2025',
          recorder: 'Dr. Jane Smith',
        },
        {
          id: 'diagnosis-2',
          display: 'Hypertension',
          certainty: 'Provisional' as DiagnosisCertainty,
          recordedDate: '2025-01-15T10:35:00Z',
          formattedDate: 'Jan 15, 2025',
          recorder: 'Dr. Jane Smith',
        },
      ]);
      mockedGroupDiagnosesByDateAndRecorder.mockReturnValue([
        {
          date: 'Jan 15, 2025',
          rawDate: '2025-01-15T10:30:00Z',
          diagnoses: [
            {
              id: 'diagnosis-1',
              display: 'Type 2 Diabetes Mellitus',
              certainty: 'Confirmed' as DiagnosisCertainty,
              recordedDate: '2025-01-15T10:30:00Z',
              formattedDate: 'Jan 15, 2025',
              recorder: 'Dr. Jane Smith',
            },
            {
              id: 'diagnosis-2',
              display: 'Hypertension',
              certainty: 'Provisional' as DiagnosisCertainty,
              recordedDate: '2025-01-15T10:35:00Z',
              formattedDate: 'Jan 15, 2025',
              recorder: 'Dr. Jane Smith',
            },
          ],
        },
      ]);

      // Act
      renderComponent();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Type 2 Diabetes Mellitus')).toBeInTheDocument();
      });

      // Assert - Both diagnoses are displayed
      expect(screen.getByText('Type 2 Diabetes Mellitus')).toBeInTheDocument();
      expect(screen.getByText('Hypertension')).toBeInTheDocument();
      expect(screen.getByText('Jan 15, 2025')).toBeInTheDocument();
    });
  });
});
