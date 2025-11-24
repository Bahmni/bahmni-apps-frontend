import {
  Diagnosis,
  formatDate,
  sortByDate,
  DATE_FORMAT,
  useTranslation,
} from '@bahmni/services';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import DiagnosesTable from '../DiagnosesTable';
import { useDiagnoses } from '../useDiagnoses';

expect.extend(toHaveNoViolations);

jest.mock('../useDiagnoses');
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: jest.fn(),
  formatDate: jest.fn(),
  sortByDate: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

const mockUseDiagnoses = useDiagnoses as jest.MockedFunction<
  typeof useDiagnoses
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
  beforeEach(() => {
    jest.clearAllMocks();

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
        };
        return translations[key] || key;
      },
    });

    mockFormatDate.mockReturnValue({ formattedResult: '15/01/2024' });
    mockSortByDate.mockImplementation((data) => data);
  });

  it('renders loading state', () => {
    mockUseDiagnoses.mockReturnValue({
      diagnoses: [],
      loading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<DiagnosesTable />);
    expect(screen.getByTestId('sortable-table-skeleton')).toBeInTheDocument();
  });

  it('renders error state', () => {
    mockUseDiagnoses.mockReturnValue({
      diagnoses: [],
      loading: false,
      error: new Error('Network error'),
      refetch: jest.fn(),
    });

    render(<DiagnosesTable />);
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    mockUseDiagnoses.mockReturnValue({
      diagnoses: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<DiagnosesTable />);
    expect(screen.getByText('No diagnoses recorded')).toBeInTheDocument();
  });

  it('sorts diagnoses by date', () => {
    mockUseDiagnoses.mockReturnValue({
      diagnoses: mockDiagnoses,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<DiagnosesTable />);
    expect(mockSortByDate).toHaveBeenCalledWith(mockDiagnoses, 'recordedDate');
  });

  it('renders diagnosis display cell with confirmed certainty', () => {
    mockUseDiagnoses.mockReturnValue({
      diagnoses: [mockDiagnoses[0]],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<DiagnosesTable />);
    expect(screen.getByText('Hypertension')).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
  });

  it('renders diagnosis display cell with provisional certainty', () => {
    mockUseDiagnoses.mockReturnValue({
      diagnoses: [mockDiagnoses[1]],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<DiagnosesTable />);
    expect(screen.getByText('Diabetes Type 2')).toBeInTheDocument();
    expect(screen.getByText('Provisional')).toBeInTheDocument();
  });

  it('renders formatted recorded date', () => {
    mockUseDiagnoses.mockReturnValue({
      diagnoses: [mockDiagnoses[0]],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<DiagnosesTable />);
    expect(mockFormatDate).toHaveBeenCalledWith(
      '2024-01-15T10:30:00Z',
      mockUseTranslation().t,
      DATE_FORMAT,
    );
    expect(screen.getByText('15/01/2024')).toBeInTheDocument();
  });

  it('renders recorder name when available', () => {
    mockUseDiagnoses.mockReturnValue({
      diagnoses: [mockDiagnoses[0]],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<DiagnosesTable />);
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
  });

  it('renders "Not available" when recorder is empty', () => {
    mockUseDiagnoses.mockReturnValue({
      diagnoses: [mockDiagnoses[2]],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<DiagnosesTable />);
    expect(screen.getByText('Not available')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    mockUseDiagnoses.mockReturnValue({
      diagnoses: mockDiagnoses,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { container } = render(<DiagnosesTable />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
