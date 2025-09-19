import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { useVitalFlowSheet } from '../useVitalFlowSheet';
import VitalFlowSheet from '../VitalFlowSheet';

// Mock the hook
jest.mock('../useVitalFlowSheet');
const mockUseVitalFlowSheet = useVitalFlowSheet as jest.MockedFunction<
  typeof useVitalFlowSheet
>;

// Mock react-router-dom to avoid TextEncoder issues
jest.mock('react-router-dom', () => ({
  useParams: () => ({ patientUuid: 'test-patient-uuid' }),
}));

// Mock the SortableDataTable component
jest.mock('@bahmni-frontend/bahmni-design-system', () => ({
  SortableDataTable: ({
    emptyStateMessage,
    rows,
    headers,
    loading,
    errorStateMessage,
  }: any) => {
    if (loading) {
      return <div data-testid="loading-state">Loading...</div>;
    }
    if (errorStateMessage) {
      return <div data-testid="error-state">{errorStateMessage}</div>;
    }
    if (!rows || rows.length === 0) {
      return <div data-testid="empty-state">{emptyStateMessage}</div>;
    }
    return (
      <div data-testid="data-table">
        <div data-testid="headers">{headers.length} headers</div>
        <div data-testid="rows">{rows.length} rows</div>
      </div>
    );
  },
}));

// Mock translation service
jest.mock('@bahmni-frontend/bahmni-services', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        NO_VITAL_SIGNS_DATA: 'No vital signs data available',
        VITAL_SIGN: 'Vital Sign',
        VITAL_FLOW_SHEET_TABLE: 'Vital Flow Sheet Table',
      };
      return translations[key] || key;
    },
  }),
  formatDate: jest.fn(() => ({ formattedResult: '01 Jan, 2024' })),
}));

describe('VitalFlowSheet Empty State', () => {
  const defaultProps = {
    latestCount: 5,
    obsConcepts: ['Temperature', 'Blood Pressure'],
    groupBy: 'obstime',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show empty state when tabularData has empty observation data', () => {
    // Arrange
    mockUseVitalFlowSheet.mockReturnValue({
      data: {
        tabularData: {
          '2024-01-01 10:00:00': {},
          '2024-01-02 10:00:00': {},
        },
        conceptDetails: [
          {
            name: 'Temperature',
            fullName: 'Temperature (C)',
            units: '°C',
            hiNormal: 37.5,
            lowNormal: 36.0,
            attributes: {},
          },
        ],
      },
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<VitalFlowSheet {...defaultProps} />);

    // Assert
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(
      screen.getByText('No vital signs data available'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('data-table')).not.toBeInTheDocument();
  });

  it('should show empty state when conceptDetails is empty', () => {
    // Arrange
    mockUseVitalFlowSheet.mockReturnValue({
      data: {
        tabularData: {
          '2024-01-01 10:00:00': {
            Temperature: { value: '36.5', abnormal: false },
          },
        },
        conceptDetails: [],
      },
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<VitalFlowSheet {...defaultProps} />);

    // Assert
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(
      screen.getByText('No vital signs data available'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('data-table')).not.toBeInTheDocument();
  });

  it('should show data table when valid data is present', () => {
    // Arrange
    mockUseVitalFlowSheet.mockReturnValue({
      data: {
        tabularData: {
          '2024-01-01 10:00:00': {
            Temperature: { value: '36.5', abnormal: false },
            'Blood Pressure': { value: '120/80', abnormal: false },
          },
        },
        conceptDetails: [
          {
            name: 'Temperature',
            fullName: 'Temperature (C)',
            units: '°C',
            hiNormal: 37.5,
            lowNormal: 36.0,
            attributes: {},
          },
          {
            name: 'Blood Pressure',
            fullName: 'Blood Pressure (mmHg)',
            units: 'mmHg',
            hiNormal: 140,
            lowNormal: 90,
            attributes: {},
          },
        ],
      },
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<VitalFlowSheet {...defaultProps} />);

    // Assert
    expect(screen.getByTestId('data-table')).toBeInTheDocument();
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    expect(screen.getByText('2 headers')).toBeInTheDocument(); // Vital Sign + 1 observation time
    expect(screen.getByText('2 rows')).toBeInTheDocument(); // Temperature + Blood Pressure
  });

  it('should show loading state when loading is true', () => {
    // Arrange
    mockUseVitalFlowSheet.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<VitalFlowSheet {...defaultProps} />);

    // Assert - The SortableDataTable should show loading state
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    expect(screen.queryByTestId('data-table')).not.toBeInTheDocument();
  });

  it('should show error state when error is present', () => {
    // Arrange
    const mockError = new Error('Failed to fetch vital signs');
    mockUseVitalFlowSheet.mockReturnValue({
      data: null,
      loading: false,
      error: mockError,
      refetch: jest.fn(),
    });

    // Act
    render(<VitalFlowSheet {...defaultProps} />);

    // Assert - The SortableDataTable should show error state
    expect(screen.getByTestId('error-state')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch vital signs')).toBeInTheDocument();
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    expect(screen.queryByTestId('data-table')).not.toBeInTheDocument();
  });
});
