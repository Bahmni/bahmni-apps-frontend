import {
  useSubscribeConsultationSaved,
  dispatchConsultationSaved,
} from '@bahmni/services';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { usePatientUUID } from '../../hooks/usePatientUUID';
import { useVitalFlowSheet } from '../useVitalFlowSheet';
import VitalFlowSheet from '../VitalFlowSheet';

// Mock the hook
jest.mock('../useVitalFlowSheet');
const mockUseVitalFlowSheet = useVitalFlowSheet as jest.MockedFunction<
  typeof useVitalFlowSheet
>;

const mockUseSubscribeConsultationSaved =
  useSubscribeConsultationSaved as jest.MockedFunction<
    typeof useSubscribeConsultationSaved
  >;

const mockUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;

// Mock react-router-dom to avoid TextEncoder issues
jest.mock('react-router-dom', () => ({
  useParams: () => ({ patientUuid: 'test-patient-uuid' }),
}));

// Mock the SortableDataTable component
jest.mock('@bahmni/design-system', () => ({
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

// Mock translation service and hooks
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
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
  formatDateTime: jest.fn(() => ({
    formattedResult: '01/01/2024 12:00 PM',
    isValid: true,
  })),
  useSubscribeConsultationSaved: jest.fn(),
}));

// Mock usePatientUUID hook
jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(() => 'test-patient-uuid'),
}));

describe('VitalFlowSheet Empty State', () => {
  const defaultProps = {
    config: {
      latestCount: 5,
      obsConcepts: ['Temperature', 'Blood Pressure'],
      groupBy: 'obstime',
    },
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

describe('VitalFlowSheet Snapshots', () => {
  const defaultProps = {
    config: {
      latestCount: 5,
      obsConcepts: ['Temperature', 'Blood Pressure'],
      groupBy: 'obstime',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePatientUUID.mockReturnValue('test-patient-uuid');
  });

  it('should match snapshot with vital data', () => {
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

    const { container } = render(<VitalFlowSheet {...defaultProps} />);

    expect(container).toMatchSnapshot();
  });

  it('should match snapshot in loading state', () => {
    mockUseVitalFlowSheet.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: jest.fn(),
    });

    const { container } = render(<VitalFlowSheet {...defaultProps} />);

    expect(container).toMatchSnapshot();
  });

  it('should match snapshot in empty state', () => {
    mockUseVitalFlowSheet.mockReturnValue({
      data: {
        tabularData: {
          '2024-01-01 10:00:00': {},
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

    const { container } = render(<VitalFlowSheet {...defaultProps} />);

    expect(container).toMatchSnapshot();
  });

  it('should match snapshot in error state', () => {
    const mockError = new Error('Failed to fetch vital signs');
    mockUseVitalFlowSheet.mockReturnValue({
      data: null,
      loading: false,
      error: mockError,
      refetch: jest.fn(),
    });

    const { container } = render(<VitalFlowSheet {...defaultProps} />);

    expect(container).toMatchSnapshot();
  });
});

describe('VitalFlowSheet Auto-Refresh', () => {
  const defaultProps = {
    config: {
      latestCount: 5,
      obsConcepts: ['Temperature', 'Blood Pressure'],
      groupBy: 'obstime',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePatientUUID.mockReturnValue('test-patient-uuid');
  });

  it('should call useSubscribeConsultationSaved with correct dependencies', () => {
    // Arrange
    const mockRefetch = jest.fn();
    mockUseVitalFlowSheet.mockReturnValue({
      data: {
        tabularData: {
          '2024-01-01 10:00:00': {
            Temperature: { value: '36.5', abnormal: false },
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
        ],
      },
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    // Act
    render(<VitalFlowSheet {...defaultProps} />);

    // Assert
    expect(mockUseSubscribeConsultationSaved).toHaveBeenCalled();
  });

  it('should refetch when consultation is saved with matching patient UUID and observations updated', () => {
    // Arrange
    const mockRefetch = jest.fn();
    let capturedCallback: ((payload: any) => void) | null = null;

    mockUseSubscribeConsultationSaved.mockImplementation(
      (callback: (payload: any) => void) => {
        capturedCallback = callback;
      },
    );

    mockUseVitalFlowSheet.mockReturnValue({
      data: {
        tabularData: {
          '2024-01-01 10:00:00': {
            Temperature: { value: '36.5', abnormal: false },
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
        ],
      },
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    mockUsePatientUUID.mockReturnValue('test-patient-uuid');

    // Act
    render(<VitalFlowSheet {...defaultProps} />);

    // Simulate consultation saved event with matching patient and observations
    if (capturedCallback) {
      const updatedConcepts = new Map<string, string>();
      updatedConcepts.set('temp-uuid', 'Temperature');
      (capturedCallback as (payload: any) => void)({
        patientUUID: 'test-patient-uuid',
        updatedResources: {},
        updatedConcepts,
      });
    }

    // Assert
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should not refetch when consultation is saved but patient UUID does not match', () => {
    // Arrange
    const mockRefetch = jest.fn();
    let capturedCallback: ((payload: any) => void) | null = null;

    mockUseSubscribeConsultationSaved.mockImplementation(
      (callback: (payload: any) => void) => {
        capturedCallback = callback;
      },
    );

    mockUseVitalFlowSheet.mockReturnValue({
      data: {
        tabularData: {
          '2024-01-01 10:00:00': {
            Temperature: { value: '36.5', abnormal: false },
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
        ],
      },
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    mockUsePatientUUID.mockReturnValue('test-patient-uuid');

    // Act
    render(<VitalFlowSheet {...defaultProps} />);

    // Simulate consultation saved event with different patient UUID
    if (capturedCallback) {
      (capturedCallback as jest.Mock)({
        patientUUID: 'different-patient-uuid',
        updatedResources: {},
      });
    }

    // Assert
    expect(mockRefetch).not.toHaveBeenCalled();
  });

  it('should not refetch when consultation is saved but observations were not updated', () => {
    // Arrange
    const mockRefetch = jest.fn();
    let capturedCallback: ((payload: any) => void) | null = null;

    mockUseSubscribeConsultationSaved.mockImplementation(
      (callback: (payload: any) => void) => {
        capturedCallback = callback;
      },
    );

    mockUseVitalFlowSheet.mockReturnValue({
      data: {
        tabularData: {
          '2024-01-01 10:00:00': {
            Temperature: { value: '36.5', abnormal: false },
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
        ],
      },
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    mockUsePatientUUID.mockReturnValue('test-patient-uuid');

    // Act
    render(<VitalFlowSheet {...defaultProps} />);

    // Simulate consultation saved event with matching patient but no observation updates
    if (capturedCallback) {
      const emptyMap = new Map<string, string>();
      (capturedCallback as jest.Mock)({
        patientUUID: 'test-patient-uuid',
        updatedResources: {},
        updatedConcepts: emptyMap,
      });
    }

    // Assert
    expect(mockRefetch).not.toHaveBeenCalled();
  });
});

describe('VitalFlowSheet Auto-Refresh with Real Events', () => {
  const defaultProps = {
    config: {
      latestCount: 5,
      obsConcepts: ['Temperature', 'Blood Pressure'],
      groupBy: 'obstime',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockUsePatientUUID.mockReturnValue('test-patient-uuid');
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should refetch when real consultation saved event is dispatched with matching patient and observations', () => {
    // Arrange
    const mockRefetch = jest.fn();
    mockUseVitalFlowSheet.mockReturnValue({
      data: {
        tabularData: {
          '2024-01-01 10:00:00': {
            Temperature: { value: '36.5', abnormal: false },
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
        ],
      },
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    mockUsePatientUUID.mockReturnValue('test-patient-uuid');

    // Use real useSubscribeConsultationSaved for this test
    mockUseSubscribeConsultationSaved.mockImplementation((callback) => {
      const handler = (event: Event) => {
        const customEvent = event as CustomEvent;
        callback(customEvent.detail);
      };
      window.addEventListener('consultation:saved', handler);
      return () => window.removeEventListener('consultation:saved', handler);
    });

    // Act
    render(<VitalFlowSheet {...defaultProps} />);

    const updatedConcepts = new Map<string, string>();
    updatedConcepts.set('temp-concept-uuid', 'Temperature');

    dispatchConsultationSaved({
      patientUUID: 'test-patient-uuid',
      updatedResources: {
        conditions: false,
        allergies: false,
        medications: false,
        serviceRequests: {},
      },
      updatedConcepts,
    });

    // Run all timers to process the setTimeout in dispatchConsultationSaved
    jest.runAllTimers();

    // Assert - refetch should be called via real event system
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should not refetch when real event is dispatched with different patient UUID', () => {
    // Arrange
    const mockRefetch = jest.fn();
    mockUseVitalFlowSheet.mockReturnValue({
      data: {
        tabularData: {
          '2024-01-01 10:00:00': {
            Temperature: { value: '36.5', abnormal: false },
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
        ],
      },
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    mockUsePatientUUID.mockReturnValue('test-patient-uuid');

    // Use real useSubscribeConsultationSaved for this test
    mockUseSubscribeConsultationSaved.mockImplementation((callback) => {
      const handler = (event: Event) => {
        const customEvent = event as CustomEvent;
        callback(customEvent.detail);
      };
      window.addEventListener('consultation:saved', handler);
      return () => window.removeEventListener('consultation:saved', handler);
    });

    // Act
    render(<VitalFlowSheet {...defaultProps} />);

    // Dispatch real event with different patient UUID
    const emptyMap = new Map<string, string>();
    dispatchConsultationSaved({
      patientUUID: 'different-patient-uuid',
      updatedResources: {
        conditions: false,
        allergies: false,
        medications: false,
        serviceRequests: {},
      },
      updatedConcepts: emptyMap,
    });

    // Run all timers to process the setTimeout in dispatchConsultationSaved
    jest.runAllTimers();

    // Assert - refetch should NOT be called because patient UUID doesn't match
    expect(mockRefetch).not.toHaveBeenCalled();
  });

  it('should not refetch when real event is dispatched without observations update', () => {
    // Arrange
    const mockRefetch = jest.fn();
    mockUseVitalFlowSheet.mockReturnValue({
      data: {
        tabularData: {
          '2024-01-01 10:00:00': {
            Temperature: { value: '36.5', abnormal: false },
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
        ],
      },
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    mockUsePatientUUID.mockReturnValue('test-patient-uuid');

    // Use real useSubscribeConsultationSaved for this test
    mockUseSubscribeConsultationSaved.mockImplementation((callback) => {
      const handler = (event: Event) => {
        const customEvent = event as CustomEvent;
        callback(customEvent.detail);
      };
      window.addEventListener('consultation:saved', handler);
      return () => window.removeEventListener('consultation:saved', handler);
    });

    // Act
    render(<VitalFlowSheet {...defaultProps} />);

    // Dispatch real event with matching patient but no observations update
    const emptyMap = new Map<string, string>();
    dispatchConsultationSaved({
      patientUUID: 'test-patient-uuid',
      updatedResources: {
        conditions: true,
        allergies: true,
        medications: false,
        serviceRequests: {},
      },
      updatedConcepts: emptyMap,
    });

    // Run all timers to process the setTimeout in dispatchConsultationSaved
    jest.runAllTimers();

    // Assert - refetch should NOT be called because no concepts were updated
    expect(mockRefetch).not.toHaveBeenCalled();
  });

  it('should not refetch when real event is dispatched with non-matching concept names', () => {
    const mockRefetch = jest.fn();
    mockUseVitalFlowSheet.mockReturnValue({
      data: {
        tabularData: {
          '2024-01-01 10:00:00': {
            Temperature: { value: '36.5', abnormal: false },
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
        ],
      },
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    mockUsePatientUUID.mockReturnValue('test-patient-uuid');

    mockUseSubscribeConsultationSaved.mockImplementation((callback) => {
      const handler = (event: Event) => {
        const customEvent = event as CustomEvent;
        callback(customEvent.detail);
      };
      window.addEventListener('consultation:saved', handler);
      return () => window.removeEventListener('consultation:saved', handler);
    });

    render(<VitalFlowSheet {...defaultProps} />);

    const updatedConcepts = new Map<string, string>();
    updatedConcepts.set('other-uuid', 'Other Concept');

    dispatchConsultationSaved({
      patientUUID: 'test-patient-uuid',
      updatedResources: {
        conditions: false,
        allergies: false,
        medications: false,
        serviceRequests: {},
      },
      updatedConcepts,
    });

    jest.runAllTimers();

    expect(mockRefetch).not.toHaveBeenCalled();
  });
});
