import {
  Diagnosis,
  formatDate,
  sortByDate,
  DATE_FORMAT,
  useTranslation,
  useSubscribeConsultationSaved,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import { useNotification } from '../../notification';
import DiagnosesTable from '../DiagnosesTable';

expect.extend(toHaveNoViolations);

jest.mock('@tanstack/react-query');
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: jest.fn(),
  formatDate: jest.fn(),
  sortByDate: jest.fn(),
  useSubscribeConsultationSaved: jest.fn(),
}));
jest.mock('../../hooks/usePatientUUID');
jest.mock('../../notification');

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockuseSubscribeConsultationSaved =
  useSubscribeConsultationSaved as jest.MockedFunction<
    typeof useSubscribeConsultationSaved
  >;
const mockUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;
const mockUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
>;
const mockFormatDate = formatDate as jest.MockedFunction<typeof formatDate>;
const mockSortByDate = sortByDate as jest.MockedFunction<typeof sortByDate>;
const mockUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;

const mockDiagnoses: Diagnosis[] = [
  {
    id: '1',
    display: 'Hypertension',
    certainty: { code: 'confirmed' },
    recordedDate: '2024-01-15T10:30:00Z',
    recorder: 'Dr. Smith',
  },
  {
    id: '2',
    display: 'Diabetes Type 2',
    certainty: { code: 'provisional' },
    recordedDate: '2024-01-15T11:00:00Z',
    recorder: 'Dr. Johnson',
  },
  {
    id: '3',
    display: 'Asthma',
    certainty: { code: 'confirmed' },
    recordedDate: '2024-01-10T14:20:00Z',
    recorder: '',
  },
];

describe('DiagnosesTable', () => {
  const mockAddNotification = jest.fn();
  const mockRefetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUsePatientUUID.mockReturnValue('patient-123');
    mockUseNotification.mockReturnValue({
      addNotification: mockAddNotification,
      notifications: [],
      removeNotification: jest.fn(),
      clearAllNotifications: jest.fn(),
    } as any);

    mockUseTranslation.mockReturnValue({
      t: (key: string) => {
        const translations: Record<string, string> = {
          DIAGNOSIS_LIST_DIAGNOSIS: 'Diagnosis',
          DIAGNOSIS_RECORDED_DATE: 'Recorded Date',
          DIAGNOSIS_LIST_RECORDED_BY: 'Recorded By',
          DIAGNOSES_DISPLAY_CONTROL_HEADING: 'Diagnoses',
          NO_DIAGNOSES: 'No diagnoses recorded',
          DIAGNOSIS_TABLE_NOT_AVAILABLE: 'Not available',
          CERTAINITY_CONFIRMED: 'Confirmed',
          CERTAINITY_PROVISIONAL: 'Provisional',
          ERROR_DEFAULT_TITLE: 'Error',
        };
        return translations[key] || key;
      },
    } as any);

    mockFormatDate.mockReturnValue({ formattedResult: '15/01/2024' });
    mockSortByDate.mockImplementation((data) => data);
    mockuseSubscribeConsultationSaved.mockImplementation(() => {});
  });

  it('renders loading state', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    render(<DiagnosesTable />);
    expect(screen.getByTestId('diagnoses-table-skeleton')).toBeInTheDocument();
  });

  it('renders error state', () => {
    const mockError = new Error('Network error');
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: mockError,
      refetch: mockRefetch,
    } as any);

    render(<DiagnosesTable />);
    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(mockAddNotification).toHaveBeenCalledWith({
      title: 'Error',
      message: 'Network error',
      type: 'error',
    });
  });

  it('renders empty state', () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    render(<DiagnosesTable />);
    expect(screen.getByText('No diagnoses recorded')).toBeInTheDocument();
  });

  it('sorts diagnoses by date', () => {
    mockUseQuery.mockReturnValue({
      data: mockDiagnoses,
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    render(<DiagnosesTable />);
    expect(mockSortByDate).toHaveBeenCalledWith(mockDiagnoses, 'recordedDate');
  });

  it('renders diagnosis display cell with confirmed certainty', () => {
    mockUseQuery.mockReturnValue({
      data: [mockDiagnoses[0]],
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    render(<DiagnosesTable />);
    expect(screen.getByText('Hypertension')).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
  });

  it('renders diagnosis display cell with provisional certainty', () => {
    mockUseQuery.mockReturnValue({
      data: [mockDiagnoses[1]],
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    render(<DiagnosesTable />);
    expect(screen.getByText('Diabetes Type 2')).toBeInTheDocument();
    expect(screen.getByText('Provisional')).toBeInTheDocument();
  });

  it('renders formatted recorded date', () => {
    mockUseQuery.mockReturnValue({
      data: [mockDiagnoses[0]],
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    render(<DiagnosesTable />);
    expect(mockFormatDate).toHaveBeenCalledWith(
      '2024-01-15T10:30:00Z',
      mockUseTranslation().t,
      DATE_FORMAT,
    );
    expect(screen.getByText('15/01/2024')).toBeInTheDocument();
  });

  it('renders recorder name when available', () => {
    mockUseQuery.mockReturnValue({
      data: [mockDiagnoses[0]],
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    render(<DiagnosesTable />);
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
  });

  it('renders "Not available" when recorder is empty', () => {
    mockUseQuery.mockReturnValue({
      data: [mockDiagnoses[2]],
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    render(<DiagnosesTable />);
    expect(screen.getByText('Not available')).toBeInTheDocument();
  });

  it('registers consultation saved event listener', () => {
    mockUseQuery.mockReturnValue({
      data: mockDiagnoses,
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    render(<DiagnosesTable />);
    expect(mockuseSubscribeConsultationSaved).toHaveBeenCalled();
  });

  it('refetches data when consultation saved event is triggered with conditions update', () => {
    let eventCallback: any;
    mockuseSubscribeConsultationSaved.mockImplementation((callback) => {
      eventCallback = callback;
    });

    mockUseQuery.mockReturnValue({
      data: mockDiagnoses,
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    render(<DiagnosesTable />);

    // Trigger the event
    eventCallback({
      patientUUID: 'patient-123',
      updatedResources: { conditions: true, allergies: false },
    });

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('does not refetch when event is for different patient', () => {
    let eventCallback: any;
    mockuseSubscribeConsultationSaved.mockImplementation((callback) => {
      eventCallback = callback;
    });

    mockUseQuery.mockReturnValue({
      data: mockDiagnoses,
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    render(<DiagnosesTable />);

    // Trigger event for different patient
    eventCallback({
      patientUUID: 'different-patient',
      updatedResources: { conditions: true, allergies: false },
    });

    expect(mockRefetch).not.toHaveBeenCalled();
  });

  it('does not refetch when conditions were not updated', () => {
    let eventCallback: any;
    mockuseSubscribeConsultationSaved.mockImplementation((callback) => {
      eventCallback = callback;
    });

    mockUseQuery.mockReturnValue({
      data: mockDiagnoses,
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    render(<DiagnosesTable />);

    // Trigger event without conditions update
    eventCallback({
      patientUUID: 'patient-123',
      updatedResources: { conditions: false, allergies: true },
    });

    expect(mockRefetch).not.toHaveBeenCalled();
  });

  it('has no accessibility violations', async () => {
    mockUseQuery.mockReturnValue({
      data: mockDiagnoses,
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    const { container } = render(<DiagnosesTable />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
