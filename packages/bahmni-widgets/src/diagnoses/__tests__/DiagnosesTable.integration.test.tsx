import {
  getPatientDiagnoses,
  getFormattedError,
  useTranslation,
  useSubscribeConsultationSaved,
  Diagnosis,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import { useNotification } from '../../notification';
import DiagnosesTable from '../DiagnosesTable';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getPatientDiagnoses: jest.fn(),
  getFormattedError: jest.fn(),
  useTranslation: jest.fn(),
  useSubscribeConsultationSaved: jest.fn(),
}));

jest.mock('../../hooks/usePatientUUID');
jest.mock('../../notification');

const mockGetPatientDiagnoses = getPatientDiagnoses as jest.MockedFunction<
  typeof getPatientDiagnoses
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
const mockuseSubscribeConsultationSaved =
  useSubscribeConsultationSaved as jest.MockedFunction<
    typeof useSubscribeConsultationSaved
  >;
const mockUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
>;

const mockDiagnoses: Diagnosis[] = [
  {
    id: '1',
    display: 'Hypertension',
    certainty: {
      code: 'confirmed',
      display: 'CERTAINITY_CONFIRMED',
      system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
    },
    recordedDate: '2024-03-15T10:30:00+00:00',
    recorder: 'Dr. Smith',
  },
  {
    id: '2',
    display: 'Type 2 Diabetes',
    certainty: {
      code: 'provisional',
      display: 'CERTAINITY_PROVISIONAL',
      system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
    },
    recordedDate: '2024-01-20T14:15:00+00:00',
    recorder: 'Dr. Johnson',
  },
];

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>,
  );
};

describe('DiagnosesTable Integration', () => {
  const mockAddNotification = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseTranslation.mockReturnValue({
      t: (key: string) => {
        const translations: Record<string, string> = {
          DIAGNOSES_DISPLAY_CONTROL_HEADING: 'Diagnoses',
          DIAGNOSIS_LIST_DIAGNOSIS: 'Diagnosis',
          DIAGNOSIS_RECORDED_DATE: 'Date Recorded',
          DIAGNOSIS_LIST_RECORDED_BY: 'Recorded By',
          CERTAINITY_CONFIRMED: 'Confirmed',
          CERTAINITY_PROVISIONAL: 'Provisional',
          DIAGNOSIS_TABLE_NOT_AVAILABLE: 'Not available',
          NO_DIAGNOSES: 'No diagnoses recorded',
          ERROR_INVALID_PATIENT_UUID: 'Invalid patient UUID',
          ERROR_DEFAULT_TITLE: 'Error',
        };
        return translations[key] || key;
      },
    } as any);

    mockUsePatientUUID.mockReturnValue('patient-123');
    mockUseNotification.mockReturnValue({
      addNotification: mockAddNotification,
      notifications: [],
      removeNotification: jest.fn(),
      clearAllNotifications: jest.fn(),
    } as any);
    mockGetFormattedError.mockImplementation((error) => ({
      title: 'Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }));
    mockuseSubscribeConsultationSaved.mockImplementation(() => {});
  });

  it('renders diagnoses from service through complete data flow', async () => {
    mockGetPatientDiagnoses.mockResolvedValue(mockDiagnoses);

    renderWithQueryClient(<DiagnosesTable />);

    await waitFor(() => {
      expect(screen.getByText('Hypertension')).toBeInTheDocument();
      expect(screen.getByText('Type 2 Diabetes')).toBeInTheDocument();
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('Dr. Johnson')).toBeInTheDocument();
      expect(screen.getByText('Confirmed')).toBeInTheDocument();
      expect(screen.getByText('Provisional')).toBeInTheDocument();
    });

    expect(mockGetPatientDiagnoses).toHaveBeenCalledWith('patient-123');
  });

  it('propagates service errors through hook to component UI', async () => {
    const serviceError = new Error('Network timeout');
    mockGetPatientDiagnoses.mockRejectedValue(serviceError);

    renderWithQueryClient(<DiagnosesTable />);

    await waitFor(() => {
      expect(screen.getByTestId('diagnoses-table-error')).toBeInTheDocument();
      expect(screen.getByText(/Network timeout/)).toBeInTheDocument();
    });

    expect(mockAddNotification).toHaveBeenCalledWith({
      title: 'Error',
      message: 'Network timeout',
      type: 'error',
    });
  });

  it('handles empty service response through complete flow', async () => {
    mockGetPatientDiagnoses.mockResolvedValue([]);

    renderWithQueryClient(<DiagnosesTable />);

    await waitFor(() => {
      expect(screen.getByTestId('diagnoses-table-empty')).toBeInTheDocument();
      expect(screen.getByText('No diagnoses recorded')).toBeInTheDocument();
    });
  });

  it('handles missing patient UUID - query is disabled', async () => {
    mockUsePatientUUID.mockReturnValue('');

    renderWithQueryClient(<DiagnosesTable />);

    await waitFor(() => {
      expect(screen.getByTestId('diagnoses-table-empty')).toBeInTheDocument();
    });

    expect(mockGetPatientDiagnoses).not.toHaveBeenCalled();
  });

  it('shows loading state during service call', async () => {
    let resolvePromise: (value: Diagnosis[]) => void;
    const servicePromise = new Promise<Diagnosis[]>((resolve) => {
      resolvePromise = resolve;
    });
    mockGetPatientDiagnoses.mockReturnValue(servicePromise);

    renderWithQueryClient(<DiagnosesTable />);

    expect(screen.getByTestId('diagnoses-table-skeleton')).toBeInTheDocument();

    resolvePromise!(mockDiagnoses);
    await waitFor(() => {
      expect(screen.getByText('Hypertension')).toBeInTheDocument();
    });
  });

  it('registers consultation saved event listener', async () => {
    mockGetPatientDiagnoses.mockResolvedValue(mockDiagnoses);

    renderWithQueryClient(<DiagnosesTable />);

    await waitFor(() => {
      expect(screen.getByText('Hypertension')).toBeInTheDocument();
    });

    expect(mockuseSubscribeConsultationSaved).toHaveBeenCalled();
  });

  it('refetches data when consultation saved event is triggered', async () => {
    let eventCallback: any;
    mockuseSubscribeConsultationSaved.mockImplementation((callback) => {
      eventCallback = callback;
    });

    mockGetPatientDiagnoses.mockResolvedValue(mockDiagnoses);

    renderWithQueryClient(<DiagnosesTable />);

    await waitFor(() => {
      expect(screen.getByText('Hypertension')).toBeInTheDocument();
    });

    // Initially called once
    expect(mockGetPatientDiagnoses).toHaveBeenCalledTimes(1);

    // Trigger consultation saved event
    const updatedDiagnoses: Diagnosis[] = [
      ...mockDiagnoses,
      {
        id: '3',
        display: 'Asthma',
        certainty: {
          code: 'confirmed',
          display: 'CERTAINITY_CONFIRMED',
          system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
        },
        recordedDate: '2024-03-16T10:30:00+00:00',
        recorder: 'Dr. Wilson',
      },
    ];
    mockGetPatientDiagnoses.mockResolvedValue(updatedDiagnoses);

    eventCallback({
      patientUUID: 'patient-123',
      updatedResources: { conditions: true, allergies: false },
    });

    // Should refetch and display new diagnosis
    await waitFor(() => {
      expect(mockGetPatientDiagnoses).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Asthma')).toBeInTheDocument();
    });
  });
});
