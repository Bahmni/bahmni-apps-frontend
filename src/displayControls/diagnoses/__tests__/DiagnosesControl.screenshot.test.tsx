import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DiagnosesControl from '../DiagnosesControl';
import { mockDiagnosesByDate } from '@/__mocks__/diagnosisMocks';
import { NotificationProvider } from '@providers/NotificationProvider';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/setupTests.i18n';
import useDiagnoses from '@/hooks/useDiagnoses';

// Mock the useDiagnoses hook
jest.mock('@/hooks/useDiagnoses');

describe('DiagnosesControl Screenshot Tests', () => {
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

  it('should match snapshot for loading state', () => {
    // Arrange
    (useDiagnoses as jest.Mock).mockReturnValue({
      diagnosesByDate: [],
      isLoading: true,
      isError: false,
    });

    // Act
    const { container } = renderComponent();

    // Assert
    expect(container.firstChild).toMatchSnapshot('diagnoses-control-loading');
  });

  it('should match snapshot for error state', () => {
    // Arrange
    (useDiagnoses as jest.Mock).mockReturnValue({
      diagnosesByDate: [],
      isLoading: false,
      isError: true,
    });

    // Act
    const { container } = renderComponent();

    // Assert
    expect(container.firstChild).toMatchSnapshot('diagnoses-control-error');
  });

  it('should match snapshot for empty state', () => {
    // Arrange
    (useDiagnoses as jest.Mock).mockReturnValue({
      diagnosesByDate: [],
      isLoading: false,
      isError: false,
    });

    // Act
    const { container } = renderComponent();

    // Assert
    expect(container.firstChild).toMatchSnapshot('diagnoses-control-empty');
  });

  it('should match snapshot with diagnoses data', () => {
    // Arrange
    (useDiagnoses as jest.Mock).mockReturnValue({
      diagnosesByDate: mockDiagnosesByDate,
      isLoading: false,
      isError: false,
    });

    // Act
    const { container } = renderComponent();

    // Assert
    expect(container.firstChild).toMatchSnapshot('diagnoses-control-with-data');
  });

  it('should match snapshot with single diagnosis', () => {
    // Arrange
    const singleDiagnosisData = [
      {
        date: 'Jan 15, 2025',
        rawDate: '2025-01-15T10:30:00Z',
        diagnoses: [
          {
            id: 'diagnosis-1',
            display: 'Type 2 Diabetes Mellitus',
            certainty: 'Confirmed' as any,
            recordedDate: '2025-01-15T10:30:00Z',
            formattedDate: 'Jan 15, 2025',
            recorder: 'Dr. Jane Smith',
          },
        ],
      },
    ];

    (useDiagnoses as jest.Mock).mockReturnValue({
      diagnosesByDate: singleDiagnosisData,
      isLoading: false,
      isError: false,
    });

    // Act
    const { container } = renderComponent();

    // Assert
    expect(container.firstChild).toMatchSnapshot('diagnoses-control-single-diagnosis');
  });

  it('should match snapshot with multiple diagnoses on same date', () => {
    // Arrange
    const multipleDiagnosesData = [
      {
        date: 'Jan 15, 2025',
        rawDate: '2025-01-15T10:30:00Z',
        diagnoses: [
          {
            id: 'diagnosis-1',
            display: 'Type 2 Diabetes Mellitus',
            certainty: 'Confirmed' as any,
            recordedDate: '2025-01-15T10:30:00Z',
            formattedDate: 'Jan 15, 2025',
            recorder: 'Dr. Jane Smith',
          },
          {
            id: 'diagnosis-2',
            display: 'Hypertension',
            certainty: 'Provisional' as any,
            recordedDate: '2025-01-15T10:35:00Z',
            formattedDate: 'Jan 15, 2025',
            recorder: 'Dr. Jane Smith',
          },
          {
            id: 'diagnosis-3',
            display: 'Chronic Kidney Disease',
            certainty: 'Confirmed' as any,
            recordedDate: '2025-01-15T11:00:00Z',
            formattedDate: 'Jan 15, 2025',
            recorder: 'Dr. Robert Johnson',
          },
        ],
      },
    ];

    (useDiagnoses as jest.Mock).mockReturnValue({
      diagnosesByDate: multipleDiagnosesData,
      isLoading: false,
      isError: false,
    });

    // Act
    const { container } = renderComponent();

    // Assert
    expect(container.firstChild).toMatchSnapshot('diagnoses-control-multiple-same-date');
  });

  it('should match snapshot with different certainty types', () => {
    // Arrange
    const differentCertaintiesData = [
      {
        date: 'Jan 15, 2025',
        rawDate: '2025-01-15T10:30:00Z',
        diagnoses: [
          {
            id: 'diagnosis-1',
            display: 'Confirmed Diagnosis',
            certainty: 'Confirmed' as any,
            recordedDate: '2025-01-15T10:30:00Z',
            formattedDate: 'Jan 15, 2025',
            recorder: 'Dr. Jane Smith',
          },
          {
            id: 'diagnosis-2',
            display: 'Provisional Diagnosis',
            certainty: 'Provisional' as any,
            recordedDate: '2025-01-15T10:35:00Z',
            formattedDate: 'Jan 15, 2025',
            recorder: 'Dr. Jane Smith',
          },
        ],
      },
    ];

    (useDiagnoses as jest.Mock).mockReturnValue({
      diagnosesByDate: differentCertaintiesData,
      isLoading: false,
      isError: false,
    });

    // Act
    const { container } = renderComponent();

    // Assert
    expect(container.firstChild).toMatchSnapshot('diagnoses-control-different-certainties');
  });

  it('should match snapshot with long diagnosis names', () => {
    // Arrange
    const longNamesData = [
      {
        date: 'Jan 15, 2025',
        rawDate: '2025-01-15T10:30:00Z',
        diagnoses: [
          {
            id: 'diagnosis-1',
            display: 'Very Long Diagnosis Name That Should Test Text Wrapping and Layout Behavior in the Component',
            certainty: 'Confirmed' as any,
            recordedDate: '2025-01-15T10:30:00Z',
            formattedDate: 'Jan 15, 2025',
            recorder: 'Dr. Jane Smith with a Very Long Name',
          },
          {
            id: 'diagnosis-2',
            display: 'Another Extremely Long Medical Diagnosis Name That Tests How the UI Handles Extended Text Content',
            certainty: 'Provisional' as any,
            recordedDate: '2025-01-15T10:35:00Z',
            formattedDate: 'Jan 15, 2025',
            recorder: 'Dr. Robert Johnson-Williams-Brown',
          },
        ],
      },
    ];

    (useDiagnoses as jest.Mock).mockReturnValue({
      diagnosesByDate: longNamesData,
      isLoading: false,
      isError: false,
    });

    // Act
    const { container } = renderComponent();

    // Assert
    expect(container.firstChild).toMatchSnapshot('diagnoses-control-long-names');
  });

  it('should match snapshot with many date groups', () => {
    // Arrange
    const manyDateGroupsData = Array.from({ length: 5 }, (_, index) => ({
      date: `Jan ${index + 10}, 2025`,
      rawDate: `2025-01-${String(index + 10).padStart(2, '0')}T10:30:00Z`,
      diagnoses: [
        {
          id: `diagnosis-${index}-1`,
          display: `Diagnosis ${index + 1}A`,
          certainty: index % 2 === 0 ? 'Confirmed' as any : 'Provisional' as any,
          recordedDate: `2025-01-${String(index + 10).padStart(2, '0')}T10:30:00Z`,
          formattedDate: `Jan ${index + 10}, 2025`,
          recorder: `Dr. Provider ${index + 1}`,
        },
        {
          id: `diagnosis-${index}-2`,
          display: `Diagnosis ${index + 1}B`,
          certainty: index % 2 === 1 ? 'Confirmed' as any : 'Provisional' as any,
          recordedDate: `2025-01-${String(index + 10).padStart(2, '0')}T11:00:00Z`,
          formattedDate: `Jan ${index + 10}, 2025`,
          recorder: `Dr. Provider ${index + 1}`,
        },
      ],
    }));

    (useDiagnoses as jest.Mock).mockReturnValue({
      diagnosesByDate: manyDateGroupsData,
      isLoading: false,
      isError: false,
    });

    // Act
    const { container } = renderComponent();

    // Assert
    expect(container.firstChild).toMatchSnapshot('diagnoses-control-many-date-groups');
  });

  describe('Responsive Layout Screenshots', () => {
    beforeEach(() => {
      // Mock different viewport sizes
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
    });

    it('should match snapshot for desktop layout', () => {
      // Arrange
      window.innerWidth = 1024;
      
      (useDiagnoses as jest.Mock).mockReturnValue({
        diagnosesByDate: mockDiagnosesByDate,
        isLoading: false,
        isError: false,
      });

      // Act
      const { container } = renderComponent();

      // Assert
      expect(container.firstChild).toMatchSnapshot('diagnoses-control-desktop');
    });

    it('should match snapshot for tablet layout', () => {
      // Arrange
      window.innerWidth = 768;
      
      (useDiagnoses as jest.Mock).mockReturnValue({
        diagnosesByDate: mockDiagnosesByDate,
        isLoading: false,
        isError: false,
      });

      // Act
      const { container } = renderComponent();

      // Assert
      expect(container.firstChild).toMatchSnapshot('diagnoses-control-tablet');
    });

    it('should match snapshot for mobile layout', () => {
      // Arrange
      window.innerWidth = 375;
      
      (useDiagnoses as jest.Mock).mockReturnValue({
        diagnosesByDate: mockDiagnosesByDate,
        isLoading: false,
        isError: false,
      });

      // Act
      const { container } = renderComponent();

      // Assert
      expect(container.firstChild).toMatchSnapshot('diagnoses-control-mobile');
    });
  });

  describe('Internationalization Screenshots', () => {
    it('should match snapshot for Spanish locale', () => {
      // Arrange
      i18n.changeLanguage('es');
      
      (useDiagnoses as jest.Mock).mockReturnValue({
        diagnosesByDate: mockDiagnosesByDate,
        isLoading: false,
        isError: false,
      });

      // Act
      const { container } = renderComponent();

      // Assert
      expect(container.firstChild).toMatchSnapshot('diagnoses-control-spanish');
    });

    it('should match snapshot for loading state in Spanish', () => {
      // Arrange
      i18n.changeLanguage('es');
      
      (useDiagnoses as jest.Mock).mockReturnValue({
        diagnosesByDate: [],
        isLoading: true,
        isError: false,
      });

      // Act
      const { container } = renderComponent();

      // Assert
      expect(container.firstChild).toMatchSnapshot('diagnoses-control-loading-spanish');
    });

    it('should match snapshot for empty state in Spanish', () => {
      // Arrange
      i18n.changeLanguage('es');
      
      (useDiagnoses as jest.Mock).mockReturnValue({
        diagnosesByDate: [],
        isLoading: false,
        isError: false,
      });

      // Act
      const { container } = renderComponent();

      // Assert
      expect(container.firstChild).toMatchSnapshot('diagnoses-control-empty-spanish');
    });
  });
});
