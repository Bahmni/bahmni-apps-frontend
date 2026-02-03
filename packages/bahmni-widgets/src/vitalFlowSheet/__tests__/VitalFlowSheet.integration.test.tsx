import '@testing-library/jest-dom';
import {
  getVitalFlowSheetData,
  getFormattedError,
  useTranslation,
  VitalFlowSheetData,
} from '@bahmni/services';
import { render, screen, waitFor } from '@testing-library/react';
import { useParams } from 'react-router-dom';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import VitalFlowSheet from '../VitalFlowSheet';

// Mock the service directly for integration testing
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getVitalFlowSheetData: jest.fn(),
  getFormattedError: jest.fn(),
  useTranslation: jest.fn(),
  formatDate: jest.fn(() => ({ formattedResult: '01 Jan, 2024' })),
}));

jest.mock('../../hooks/usePatientUUID');
jest.mock('../../notification', () => ({
  useNotification: () => ({
    addNotification: jest.fn(),
  }),
}));

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

const mockGetVitalFlowSheetData = getVitalFlowSheetData as jest.MockedFunction<
  typeof getVitalFlowSheetData
>;
const mockGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;
const mockUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;
const mockUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;
const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;

// Mock vital flow sheet data that matches the component's expected data structure
const mockVitalFlowSheetData: VitalFlowSheetData = {
  tabularData: {
    '2024-01-01 10:00:00': {
      Temperature: { value: '36.5', abnormal: false },
      'Blood Pressure': { value: '120/80', abnormal: false },
      'Heart Rate': { value: '72', abnormal: false },
    },
    '2024-01-02 10:00:00': {
      Temperature: { value: '37.2', abnormal: true },
      'Blood Pressure': { value: '130/85', abnormal: false },
      'Heart Rate': { value: '85', abnormal: false },
    },
    '2024-01-03 10:00:00': {
      Temperature: { value: '36.8', abnormal: false },
      'Blood Pressure': { value: '125/82', abnormal: false },
      'Heart Rate': { value: '78', abnormal: false },
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
    {
      name: 'Heart Rate',
      fullName: 'Heart Rate (bpm)',
      units: 'bpm',
      hiNormal: 100,
      lowNormal: 60,
      attributes: {},
    },
  ],
};

const emptyVitalFlowSheetData: VitalFlowSheetData = {
  tabularData: {},
  conceptDetails: [],
};

describe('VitalFlowSheet Integration Tests', () => {
  const defaultProps = {
    config: {
      latestCount: 5,
      obsConcepts: ['Temperature', 'Blood Pressure', 'Heart Rate'],
      groupBy: 'obstime',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseParams.mockReturnValue({
      patientUUID: 'test-patient-uuid',
    });

    mockUsePatientUUID.mockReturnValue('test-patient-uuid');

    mockUseTranslation.mockReturnValue({
      t: (key: string) => {
        const translations: Record<string, string> = {
          NO_VITAL_SIGNS_DATA: 'No vital signs data available',
          VITAL_SIGN: 'Vital Sign',
          VITAL_FLOW_SHEET_TABLE: 'Vital Flow Sheet Table',
          ERROR_LOADING_VITAL_SIGNS: 'Error loading vital signs',
        };
        return translations[key] || key;
      },
    } as any);

    mockGetFormattedError.mockImplementation((error) => ({
      title: 'Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }));
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('displays vital signs data after successful API call', async () => {
    mockGetVitalFlowSheetData.mockResolvedValue(mockVitalFlowSheetData);

    render(<VitalFlowSheet {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('vital-flow-sheet-table')).toBeInTheDocument();
    });

    expect(mockGetVitalFlowSheetData).toHaveBeenCalledWith(
      'test-patient-uuid',
      defaultProps.config.latestCount,
      defaultProps.config.obsConcepts,
      defaultProps.config.groupBy,
    );

    // Check that the table shows the expected data
    expect(screen.getByText('Vital Sign')).toBeInTheDocument();
    expect(screen.getByText('Temperature (C)')).toBeInTheDocument();
    expect(screen.getByText('Blood Pressure (mmHg)')).toBeInTheDocument();
    expect(screen.getByText('Heart Rate (bpm)')).toBeInTheDocument();

    // Check for some vital sign values
    expect(screen.getByText('36.5')).toBeInTheDocument();
    expect(screen.getByText('120/80')).toBeInTheDocument();
    expect(screen.getByText('72')).toBeInTheDocument();
  });

  it('shows loading state during API call', async () => {
    let resolvePromise: (value: VitalFlowSheetData) => void;
    const servicePromise = new Promise<VitalFlowSheetData>((resolve) => {
      resolvePromise = resolve;
    });
    mockGetVitalFlowSheetData.mockReturnValue(servicePromise);

    render(<VitalFlowSheet {...defaultProps} />);

    expect(
      screen.getByTestId('vital-flow-sheet-table-skeleton'),
    ).toBeInTheDocument();

    resolvePromise!(mockVitalFlowSheetData);
    await waitFor(() => {
      expect(screen.getByTestId('vital-flow-sheet-table')).toBeInTheDocument();
    });
  });

  it('displays error message when API call fails', async () => {
    const serviceError = new Error('Network timeout');
    mockGetVitalFlowSheetData.mockRejectedValue(serviceError);

    render(<VitalFlowSheet {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByTestId('vital-flow-sheet-table-error'),
      ).toBeInTheDocument();
    });

    expect(screen.getByText('Network timeout')).toBeInTheDocument();
    expect(mockGetFormattedError).toHaveBeenCalledWith(serviceError);
    expect(
      screen.queryByTestId('vital-flow-sheet-table'),
    ).not.toBeInTheDocument();
  });

  it('shows empty state when no vital signs data is returned', async () => {
    mockGetVitalFlowSheetData.mockResolvedValue(emptyVitalFlowSheetData);

    render(<VitalFlowSheet {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByTestId('vital-flow-sheet-table-empty'),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText('No vital signs data available'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('vital-flow-sheet-table'),
    ).not.toBeInTheDocument();
  });

  it('shows empty state when tabularData has no observations', async () => {
    const dataWithEmptyObservations: VitalFlowSheetData = {
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
    };

    mockGetVitalFlowSheetData.mockResolvedValue(dataWithEmptyObservations);

    render(<VitalFlowSheet {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByTestId('vital-flow-sheet-table-empty'),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText('No vital signs data available'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('vital-flow-sheet-table'),
    ).not.toBeInTheDocument();
  });

  it('shows empty state when conceptDetails is empty', async () => {
    const dataWithEmptyConceptDetails: VitalFlowSheetData = {
      tabularData: {
        '2024-01-01 10:00:00': {
          Temperature: { value: '36.5', abnormal: false },
        },
      },
      conceptDetails: [],
    };

    mockGetVitalFlowSheetData.mockResolvedValue(dataWithEmptyConceptDetails);

    render(<VitalFlowSheet {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByTestId('vital-flow-sheet-table-empty'),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText('No vital signs data available'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('vital-flow-sheet-table'),
    ).not.toBeInTheDocument();
  });

  it('shows empty state when patient UUID is missing', async () => {
    // Mock empty patient UUID - hook will not fetch data
    mockUsePatientUUID.mockReturnValue('');

    render(<VitalFlowSheet {...defaultProps} />);

    // Should show empty state since no data will be fetched
    await waitFor(() => {
      expect(
        screen.getByTestId('vital-flow-sheet-table-empty'),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText('No vital signs data available'),
    ).toBeInTheDocument();
    expect(mockGetVitalFlowSheetData).not.toHaveBeenCalled();
  });

  it('responds to patient UUID changes', async () => {
    // First render with initial data
    mockGetVitalFlowSheetData.mockResolvedValue(mockVitalFlowSheetData);

    const { rerender } = render(<VitalFlowSheet {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('vital-flow-sheet-table')).toBeInTheDocument();
    });

    // Simulate patient change - component would show loading state
    let resolvePromise: (value: VitalFlowSheetData) => void;
    const servicePromise = new Promise<VitalFlowSheetData>((resolve) => {
      resolvePromise = resolve;
    });
    mockGetVitalFlowSheetData.mockReturnValue(servicePromise);

    // Change patient UUID
    mockUsePatientUUID.mockReturnValue('different-patient-uuid');

    rerender(<VitalFlowSheet {...defaultProps} />);

    // Should show loading state for new patient
    expect(
      screen.getByTestId('vital-flow-sheet-table-skeleton'),
    ).toBeInTheDocument();

    // Resolve with new data
    const newPatientData: VitalFlowSheetData = {
      tabularData: {
        '2024-01-04 10:00:00': {
          Temperature: { value: '37.0', abnormal: false },
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
    };

    resolvePromise!(newPatientData);
    await waitFor(() => {
      expect(screen.getByTestId('vital-flow-sheet-table')).toBeInTheDocument();
    });

    expect(mockGetVitalFlowSheetData).toHaveBeenCalledWith(
      'different-patient-uuid',
      defaultProps.config.latestCount,
      defaultProps.config.obsConcepts,
      defaultProps.config.groupBy,
    );
  });

  it('responds to parameter changes', async () => {
    mockGetVitalFlowSheetData.mockResolvedValue(mockVitalFlowSheetData);

    const { rerender } = render(<VitalFlowSheet {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('vital-flow-sheet-table')).toBeInTheDocument();
    });

    // Change parameters
    const newProps = {
      config: {
        latestCount: 10,
        obsConcepts: ['Temperature', 'Heart Rate'],
        groupBy: 'encounter',
      },
    };

    const newData: VitalFlowSheetData = {
      tabularData: {
        '2024-01-05 10:00:00': {
          Temperature: { value: '36.9', abnormal: false },
          'Heart Rate': { value: '75', abnormal: false },
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
          name: 'Heart Rate',
          fullName: 'Heart Rate (bpm)',
          units: 'bpm',
          hiNormal: 100,
          lowNormal: 60,
          attributes: {},
        },
      ],
    };

    mockGetVitalFlowSheetData.mockResolvedValue(newData);

    rerender(<VitalFlowSheet {...newProps} />);

    await waitFor(() => {
      expect(mockGetVitalFlowSheetData).toHaveBeenCalledWith(
        'test-patient-uuid',
        newProps.config.latestCount,
        newProps.config.obsConcepts,
        newProps.config.groupBy,
      );
    });

    // Check that the table shows the expected data for new parameters
    expect(screen.getByText('Vital Sign')).toBeInTheDocument();
    expect(screen.getByText('Temperature (C)')).toBeInTheDocument();
    expect(screen.getByText('Heart Rate (bpm)')).toBeInTheDocument();

    // Check for the new vital sign values
    expect(screen.getByText('36.9')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('handles API errors gracefully with proper error display', async () => {
    const networkError = new Error('Failed to fetch vital signs');
    mockGetVitalFlowSheetData.mockRejectedValue(networkError);

    render(<VitalFlowSheet {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByTestId('vital-flow-sheet-table-error'),
      ).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to fetch vital signs')).toBeInTheDocument();
    expect(mockGetFormattedError).toHaveBeenCalledWith(networkError);
  });

  it('maintains proper loading sequence from loading to data display', async () => {
    let resolvePromise: (value: VitalFlowSheetData) => void;
    const servicePromise = new Promise<VitalFlowSheetData>((resolve) => {
      resolvePromise = resolve;
    });
    mockGetVitalFlowSheetData.mockReturnValue(servicePromise);

    render(<VitalFlowSheet {...defaultProps} />);

    // Initially should show loading
    expect(
      screen.getByTestId('vital-flow-sheet-table-skeleton'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('vital-flow-sheet-table'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('vital-flow-sheet-table-empty'),
    ).not.toBeInTheDocument();

    // Resolve with data
    resolvePromise!(mockVitalFlowSheetData);

    await waitFor(() => {
      expect(screen.getByTestId('vital-flow-sheet-table')).toBeInTheDocument();
    });

    expect(
      screen.queryByTestId('vital-flow-sheet-table-skeleton'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('vital-flow-sheet-table-empty'),
    ).not.toBeInTheDocument();
  });

  it('shows empty state when patient UUID is null', async () => {
    // Mock null patient UUID - hook will not fetch data
    mockUsePatientUUID.mockReturnValue(null);

    render(<VitalFlowSheet {...defaultProps} />);

    // Should show empty state since no data will be fetched
    await waitFor(() => {
      expect(
        screen.getByTestId('vital-flow-sheet-table-empty'),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText('No vital signs data available'),
    ).toBeInTheDocument();
    expect(mockGetVitalFlowSheetData).not.toHaveBeenCalled();
  });
});
