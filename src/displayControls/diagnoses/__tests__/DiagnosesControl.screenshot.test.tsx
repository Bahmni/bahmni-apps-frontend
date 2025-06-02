import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DiagnosesControl from '../DiagnosesControl';
import * as diagnosisService from '@services/diagnosisService';
import { mockFhirDiagnoses, mockDiagnosesByDate } from '@/__mocks__/diagnosisMocks';
import { NotificationProvider } from '@providers/NotificationProvider';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/setupTests.i18n';
import { DiagnosisCertainty } from '@/types/diagnosis';

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

const mockedGetDiagnoses = diagnosisService.getDiagnoses as jest.MockedFunction<
  typeof diagnosisService.getDiagnoses
>;
const mockedFormatDiagnoses = diagnosisService.formatDiagnoses as jest.MockedFunction<
  typeof diagnosisService.formatDiagnoses
>;
const mockedGroupDiagnosesByDateAndRecorder = diagnosisService.groupDiagnosesByDateAndRecorder as jest.MockedFunction<
  typeof diagnosisService.groupDiagnosesByDateAndRecorder
>;

describe('DiagnosesControl Visual Regression Tests', () => {
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

  describe('Loading States', () => {
    it('should render loading state correctly', () => {
      // Arrange - Mock loading state
      mockedGetDiagnoses.mockImplementation(
        () => new Promise(() => {}), // Never resolves to keep loading
      );

      // Act
      const { container } = renderComponent();

      // Assert - Take screenshot of loading state
      expect(container).toMatchSnapshot('diagnoses-control-loading');
    });
  });

  describe('Data States', () => {
    it('should render with diagnoses data correctly', async () => {
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
      const { container } = renderComponent();

      // Wait for data to load
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert - Take screenshot with data
      expect(container).toMatchSnapshot('diagnoses-control-with-data');
    });

    it('should render empty state correctly', async () => {
      // Arrange
      mockedGetDiagnoses.mockResolvedValueOnce([]);
      mockedFormatDiagnoses.mockReturnValue([]);
      mockedGroupDiagnosesByDateAndRecorder.mockReturnValue([]);

      // Act
      const { container } = renderComponent();

      // Wait for empty state
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert - Take screenshot of empty state
      expect(container).toMatchSnapshot('diagnoses-control-empty');
    });

    it('should render error state correctly', async () => {
      // Arrange
      mockedGetDiagnoses.mockRejectedValueOnce(new Error('Network Error'));

      // Act
      const { container } = renderComponent();

      // Wait for error state
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert - Take screenshot of error state
      expect(container).toMatchSnapshot('diagnoses-control-error');
    });
  });

  describe('Different Data Scenarios', () => {
    it('should render single diagnosis correctly', async () => {
      // Arrange
      mockedGetDiagnoses.mockResolvedValueOnce([mockFhirDiagnoses[0]]);
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
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert - Take screenshot with single diagnosis
      expect(container).toMatchSnapshot('diagnoses-control-single-diagnosis');
    });

    it('should render multiple diagnoses with different certainties', async () => {
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
          display: 'Suspected Pneumonia',
          certainty: 'Differential' as DiagnosisCertainty,
          recordedDate: '2025-01-14T09:15:00Z',
          formattedDate: 'Jan 14, 2025',
          recorder: 'Dr. Michael Brown',
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
        {
          date: 'Jan 14, 2025',
          rawDate: '2025-01-14T09:15:00Z',
          diagnoses: [
            {
              id: 'diagnosis-3',
              display: 'Suspected Pneumonia',
              certainty: 'Differential' as DiagnosisCertainty,
              recordedDate: '2025-01-14T09:15:00Z',
              formattedDate: 'Jan 14, 2025',
              recorder: 'Dr. Michael Brown',
            },
          ],
        },
      ]);

      // Act
      const { container } = renderComponent();

      // Wait for data to load
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert - Take screenshot with different certainties
      expect(container).toMatchSnapshot('diagnoses-control-different-certainties');
    });

    it('should render long diagnosis names correctly', async () => {
      // Arrange
      mockedGetDiagnoses.mockResolvedValueOnce([mockFhirDiagnoses[0]]);
      mockedFormatDiagnoses.mockReturnValue([
        {
          id: 'diagnosis-1',
          display: 'Very Long Diagnosis Name That Should Test Text Wrapping and Layout Behavior in the Component',
          certainty: 'Confirmed' as DiagnosisCertainty,
          recordedDate: '2025-01-15T10:30:00Z',
          formattedDate: 'Jan 15, 2025',
          recorder: 'Dr. Jane Smith with a Very Long Name',
        },
      ]);
      mockedGroupDiagnosesByDateAndRecorder.mockReturnValue([
        {
          date: 'Jan 15, 2025',
          rawDate: '2025-01-15T10:30:00Z',
          diagnoses: [
            {
              id: 'diagnosis-1',
              display: 'Very Long Diagnosis Name That Should Test Text Wrapping and Layout Behavior in the Component',
              certainty: 'Confirmed' as DiagnosisCertainty,
              recordedDate: '2025-01-15T10:30:00Z',
              formattedDate: 'Jan 15, 2025',
              recorder: 'Dr. Jane Smith with a Very Long Name',
            },
          ],
        },
      ]);

      // Act
      const { container } = renderComponent();

      // Wait for data to load
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert - Take screenshot with long names
      expect(container).toMatchSnapshot('diagnoses-control-long-names');
    });
  });

  describe('Responsive Layout Tests', () => {
    it('should render correctly in mobile viewport', async () => {
      // Arrange - Set mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

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
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert - Take screenshot in mobile viewport
      expect(container).toMatchSnapshot('diagnoses-control-mobile');
    });

    it('should render correctly in tablet viewport', async () => {
      // Arrange - Set tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      mockedGetDiagnoses.mockResolvedValueOnce(mockFhirDiagnoses);
      mockedFormatDiagnoses.mockReturnValue(mockDiagnosesByDate[0].diagnoses);
      mockedGroupDiagnosesByDateAndRecorder.mockReturnValue([mockDiagnosesByDate[0]]);

      // Act
      const { container } = renderComponent();

      // Wait for data to load
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert - Take screenshot in tablet viewport
      expect(container).toMatchSnapshot('diagnoses-control-tablet');
    });
  });
});
