import '@testing-library/jest-dom';
import {
  getVitalFlowSheetData,
  getFormattedError,
  VitalFlowSheetData,
  DEFAULT_DATE_FORMAT_STORAGE_KEY,
} from '@bahmni/services';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import VitalFlowSheet from '../VitalFlowSheet';

// Mock the service directly for integration testing
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getVitalFlowSheetData: jest.fn(),
  getFormattedError: jest.fn(),
}));

jest.mock('../../notification', () => ({
  useNotification: () => ({
    addNotification: jest.fn(),
  }),
}));

const mockGetVitalFlowSheetData = getVitalFlowSheetData as jest.MockedFunction<
  typeof getVitalFlowSheetData
>;
const mockGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;

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

  const renderVitalFlowSheet = (
    props = defaultProps,
    patientUuid = 'test-patient-uuid',
  ) =>
    render(
      <MemoryRouter initialEntries={[`/patient/${patientUuid}`]}>
        <Routes>
          <Route
            path="/patient/:patientUuid"
            element={<VitalFlowSheet {...props} />}
          />
        </Routes>
      </MemoryRouter>,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem(DEFAULT_DATE_FORMAT_STORAGE_KEY, 'dd/MM/yyyy');

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

    renderVitalFlowSheet();

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
    expect(screen.getByText('VITAL_SIGN')).toBeInTheDocument();
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

    renderVitalFlowSheet();

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

    renderVitalFlowSheet();

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

    renderVitalFlowSheet();

    await waitFor(() => {
      expect(
        screen.getByTestId('vital-flow-sheet-table-empty'),
      ).toBeInTheDocument();
    });

    expect(screen.getByText('NO_VITAL_SIGNS_DATA')).toBeInTheDocument();
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

    renderVitalFlowSheet();

    await waitFor(() => {
      expect(
        screen.getByTestId('vital-flow-sheet-table-empty'),
      ).toBeInTheDocument();
    });

    expect(screen.getByText('NO_VITAL_SIGNS_DATA')).toBeInTheDocument();
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

    renderVitalFlowSheet();

    await waitFor(() => {
      expect(
        screen.getByTestId('vital-flow-sheet-table-empty'),
      ).toBeInTheDocument();
    });

    expect(screen.getByText('NO_VITAL_SIGNS_DATA')).toBeInTheDocument();
    expect(
      screen.queryByTestId('vital-flow-sheet-table'),
    ).not.toBeInTheDocument();
  });

  it('shows empty state when patient UUID is not provided', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<VitalFlowSheet {...defaultProps} />} />
        </Routes>
      </MemoryRouter>,
    );

    // Should show empty state since no data will be fetched
    await waitFor(() => {
      expect(
        screen.getByTestId('vital-flow-sheet-table-empty'),
      ).toBeInTheDocument();
    });

    expect(screen.getByText('NO_VITAL_SIGNS_DATA')).toBeInTheDocument();
    expect(mockGetVitalFlowSheetData).not.toHaveBeenCalled();
  });

  it('responds to patient UUID changes', async () => {
    mockGetVitalFlowSheetData.mockResolvedValue(mockVitalFlowSheetData);

    const { unmount } = renderVitalFlowSheet();

    await waitFor(() => {
      expect(screen.getByTestId('vital-flow-sheet-table')).toBeInTheDocument();
    });

    unmount();

    // Simulate patient change - render component for a different patient
    let resolvePromise: (value: VitalFlowSheetData) => void;
    const servicePromise = new Promise<VitalFlowSheetData>((resolve) => {
      resolvePromise = resolve;
    });
    mockGetVitalFlowSheetData.mockReturnValue(servicePromise);

    renderVitalFlowSheet(defaultProps, 'different-patient-uuid');

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

    const { rerender } = renderVitalFlowSheet();

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

    rerender(
      <MemoryRouter initialEntries={['/patient/test-patient-uuid']}>
        <Routes>
          <Route
            path="/patient/:patientUuid"
            element={<VitalFlowSheet {...newProps} />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockGetVitalFlowSheetData).toHaveBeenCalledWith(
        'test-patient-uuid',
        newProps.config.latestCount,
        newProps.config.obsConcepts,
        newProps.config.groupBy,
      );
    });

    // Check that the table shows the expected data for new parameters
    expect(screen.getByText('VITAL_SIGN')).toBeInTheDocument();
    expect(screen.getByText('Temperature (C)')).toBeInTheDocument();
    expect(screen.getByText('Heart Rate (bpm)')).toBeInTheDocument();

    // Check for the new vital sign values
    expect(screen.getByText('36.9')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('handles API errors gracefully with proper error display', async () => {
    const networkError = new Error('Failed to fetch vital signs');
    mockGetVitalFlowSheetData.mockRejectedValue(networkError);

    renderVitalFlowSheet();

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

    renderVitalFlowSheet();

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
});
