import { render, screen, waitFor } from '@testing-library/react';
import {
  getPatientDiagnoses,
  getFormattedError,
  useTranslation,
  Diagnosis,
} from 'bahmni-services';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import DiagnosesTable from '../DiagnosesTable';

jest.mock('bahmni-services', () => ({
  ...jest.requireActual('bahmni-services'),
  getPatientDiagnoses: jest.fn(),
  getFormattedError: jest.fn(),
  useTranslation: jest.fn(),
}));
jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

jest.mock('../../hooks/usePatientUUID');

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

describe('DiagnosesTable Integration', () => {
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
        };
        return translations[key] || key;
      },
    });

    mockUsePatientUUID.mockReturnValue('patient-123');
    mockGetFormattedError.mockImplementation((error) => ({
      title: 'Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }));
  });

  it('renders diagnoses from service through complete data flow', async () => {
    mockGetPatientDiagnoses.mockResolvedValue(mockDiagnoses);

    render(<DiagnosesTable />);

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

    render(<DiagnosesTable />);

    await waitFor(() => {
      expect(screen.getByTestId('sortable-table-error')).toBeInTheDocument();
      expect(screen.getByText(/Network timeout/)).toBeInTheDocument();
    });

    expect(mockGetFormattedError).toHaveBeenCalledWith(serviceError);
  });

  it('handles empty service response through complete flow', async () => {
    mockGetPatientDiagnoses.mockResolvedValue([]);

    render(<DiagnosesTable />);

    await waitFor(() => {
      expect(screen.getByTestId('sortable-table-empty')).toBeInTheDocument();
      expect(screen.getByText('No diagnoses recorded')).toBeInTheDocument();
    });
  });

  it('handles missing patient UUID through service integration', async () => {
    mockUsePatientUUID.mockReturnValue('');

    render(<DiagnosesTable />);

    await waitFor(() => {
      expect(screen.getByTestId('sortable-table-error')).toBeInTheDocument();
      expect(screen.getByText('Invalid patient UUID')).toBeInTheDocument();
    });

    expect(mockGetPatientDiagnoses).not.toHaveBeenCalled();
  });

  it('shows loading state during service call', async () => {
    let resolvePromise: (value: Diagnosis[]) => void;
    const servicePromise = new Promise<Diagnosis[]>((resolve) => {
      resolvePromise = resolve;
    });
    mockGetPatientDiagnoses.mockReturnValue(servicePromise);

    render(<DiagnosesTable />);

    expect(screen.getByTestId('sortable-table-skeleton')).toBeInTheDocument();

    resolvePromise!(mockDiagnoses);
    await waitFor(() => {
      expect(screen.getByText('Hypertension')).toBeInTheDocument();
    });
  });
});
