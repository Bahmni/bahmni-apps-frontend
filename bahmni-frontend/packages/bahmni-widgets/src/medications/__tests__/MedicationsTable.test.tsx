import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  formatDate,
  MedicationRequest,
  MedicationStatus,
} from '@bahmni-frontend/bahmni-services';
import { useMedicationRequest } from '../useMedicationRequest';
import MedicationsTable from '../MedicationsTable';
import '@testing-library/jest-dom';

expect.extend(toHaveNoViolations);

jest.mock('../useMedicationRequest');
jest.mock('@bahmni-frontend/bahmni-services', () => ({
  ...jest.requireActual('@bahmni-frontend/bahmni-services'),
  useTranslation: jest.fn(),
  formatDate: jest.fn(),
  formatMedicationRequest: jest.fn(),
  groupByDate: jest.fn(),
  sortMedicationsByStatus: jest.fn(),
  sortMedicationsByPriority: jest.fn(),
  sortMedicationsByDateDistance: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

const mockUseMedicationRequest = useMedicationRequest as jest.MockedFunction<
  typeof useMedicationRequest
>;
const mockUseTranslation = require('@bahmni-frontend/bahmni-services')
  .useTranslation as jest.MockedFunction<any>;
const mockFormatDate = formatDate as jest.MockedFunction<typeof formatDate>;
const mockFormatMedicationRequest = require('@bahmni-frontend/bahmni-services')
  .formatMedicationRequest as jest.MockedFunction<any>;
const mockSortMedicationsByStatus = require('@bahmni-frontend/bahmni-services')
  .sortMedicationsByStatus as jest.MockedFunction<any>;
const mockSortMedicationsByPriority =
  require('@bahmni-frontend/bahmni-services')
    .sortMedicationsByPriority as jest.MockedFunction<any>;
const mockSortMedicationsByDateDistance =
  require('@bahmni-frontend/bahmni-services')
    .sortMedicationsByDateDistance as jest.MockedFunction<any>;
const mockGroupByDate = require('@bahmni-frontend/bahmni-services')
  .groupByDate as jest.MockedFunction<any>;

const mockMedications: MedicationRequest[] = [
  {
    id: '1',
    name: 'Paracetamol 500mg',
    dose: { value: 500, unit: 'mg' },
    quantity: { value: 30, unit: 'tablets' },
    startDate: '2024-01-15T10:00:00Z',
    orderDate: '2024-01-15T09:00:00Z',
    orderedBy: 'Dr. Smith',
    status: MedicationStatus.Active,
    isImmediate: false,
    asNeeded: false,
    priority: 'routine',
    instructions: 'Take with food',
  },
  {
    id: '2',
    name: 'Aspirin 100mg',
    dose: { value: 100, unit: 'mg' },
    quantity: { value: 14, unit: 'tablets' },
    startDate: '2024-01-10T08:00:00Z',
    orderDate: '2024-01-10T07:30:00Z',
    orderedBy: 'Dr. Johnson',
    status: MedicationStatus.OnHold,
    isImmediate: true,
    asNeeded: false,
    priority: 'stat',
    instructions: 'After meals',
  },
  {
    id: '3',
    name: 'Ibuprofen 200mg',
    dose: { value: 200, unit: 'mg' },
    quantity: { value: 20, unit: 'tablets' },
    startDate: '2024-01-08T14:00:00Z',
    orderDate: '2024-01-08T13:45:00Z',
    orderedBy: '',
    status: MedicationStatus.Completed,
    isImmediate: false,
    asNeeded: true,
    priority: 'routine',
    instructions: 'As needed for pain',
  },
];

describe('MedicationsTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    Object.defineProperty(globalThis, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    mockUseTranslation.mockReturnValue({
      t: ((key: string) => {
        const translations: Record<string, string> = {
          MEDICATIONS_MEDICINE_NAME: 'Medicine',
          MEDICATIONS_DOSAGE: 'Dosage',
          MEDICATIONS_INSTRUCTIONS: 'Instructions',
          MEDICATIONS_START_DATE: 'Start Date',
          MEDICATIONS_ORDERED_BY: 'Ordered By',
          MEDICATIONS_ORDERED_ON: 'Ordered On',
          MEDICATIONS_STATUS: 'Status',
          MEDICATIONS_TAB_ACTIVE_SCHEDULED: 'Active & Scheduled',
          MEDICATIONS_TAB_ALL: 'All',
          MEDICATIONS_TABLE_ARIA_LABEL: 'Medications table',
          MEDICATIONS_TAB_LIST_ARIA_LABEL: 'Medication view options',
          MEDICATIONS_DISPLAY_CONTROL_HEADING: 'Medications',
          NO_ACTIVE_MEDICATIONS: 'No active medications',
          NO_MEDICATION_HISTORY: 'No medication history',
          MEDICATIONS_ERROR_FETCHING: 'Error fetching medications',
          MEDICATIONS_STATUS_ACTIVE: 'Active',
          MEDICATIONS_STATUS_SCHEDULED: 'Scheduled',
          MEDICATIONS_STATUS_CANCELLED: 'Cancelled',
          MEDICATIONS_STATUS_COMPLETED: 'Completed',
          MEDICATIONS_STATUS_STOPPED: 'Stopped',
          MEDICATIONS_STATUS_UNKNOWN: 'Unknown',
          MEDICATIONS_TABLE_NOT_AVAILABLE: 'Not available',
        };
        return translations[key] || key;
      }) as any,
    });

    mockFormatDate.mockReturnValue({ formattedResult: '15/01/2024' });

    mockFormatMedicationRequest.mockImplementation(
      (med: MedicationRequest) => ({
        id: med.id,
        name: med.name,
        dosage: `${med.dose?.value} ${med.dose?.unit}`,
        dosageUnit: med.dose?.unit || '',
        quantity: `${med.quantity.value} ${med.quantity.unit}`,
        instruction: med.instructions,
        startDate: med.startDate,
        orderDate: med.orderDate,
        orderedBy: med.orderedBy,
        status: med.status,
        asNeeded: med.asNeeded,
        isImmediate: med.isImmediate,
      }),
    );

    mockSortMedicationsByStatus.mockImplementation((meds: any[]) => meds);
    mockSortMedicationsByPriority.mockImplementation((meds: any[]) => meds);
    mockSortMedicationsByDateDistance.mockImplementation((meds: any[]) => meds);
    mockGroupByDate.mockReturnValue([]);
  });

  it('renders error state', () => {
    mockUseMedicationRequest.mockReturnValue({
      medications: [],
      loading: false,
      error: new Error('Network error'),
      refetch: jest.fn(),
    });

    render(<MedicationsTable />);
    expect(screen.getByText('Error fetching medications')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    mockUseMedicationRequest.mockReturnValue({
      medications: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<MedicationsTable />);
    expect(screen.getByText('No active medications')).toBeInTheDocument();
  });

  it('renders medications with correct content', () => {
    mockUseMedicationRequest.mockReturnValue({
      medications: [mockMedications[0]],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<MedicationsTable />);
    expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument();
    expect(screen.getByText('30 tablets')).toBeInTheDocument();
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('displays PRN tag for as-needed medications', () => {
    const prnMedication = {
      ...mockMedications[0],
      asNeeded: true,
    };

    mockUseMedicationRequest.mockReturnValue({
      medications: [prnMedication],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<MedicationsTable />);
    expect(screen.getByText('PRN')).toBeInTheDocument();
  });

  it('displays STAT tag for immediate medications', () => {
    mockUseMedicationRequest.mockReturnValue({
      medications: [mockMedications[1]],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<MedicationsTable />);
    expect(screen.getByText('STAT')).toBeInTheDocument();
  });

  it('renders empty orderedBy field', () => {
    const medicationWithEmptyOrderedBy = {
      ...mockMedications[0],
      orderedBy: '',
    };

    mockUseMedicationRequest.mockReturnValue({
      medications: [medicationWithEmptyOrderedBy],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<MedicationsTable />);
    expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument();
  });

  it('displays formatted dates', () => {
    mockUseMedicationRequest.mockReturnValue({
      medications: [mockMedications[0]],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<MedicationsTable />);
    const dateElements = screen.getAllByText('15/01/2024');
    expect(dateElements).toHaveLength(2);
  });

  it('switches between tabs correctly', async () => {
    mockUseMedicationRequest.mockReturnValue({
      medications: mockMedications,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<MedicationsTable />);

    const activeTab = screen.getByRole('tab', { name: 'Active & Scheduled' });
    const allTab = screen.getByRole('tab', { name: 'All' });

    expect(activeTab).toHaveAttribute('aria-selected', 'true');
    expect(allTab).toHaveAttribute('aria-selected', 'false');

    await userEvent.click(allTab);

    expect(activeTab).toHaveAttribute('aria-selected', 'false');
    expect(allTab).toHaveAttribute('aria-selected', 'true');
  });

  it('shows different empty messages per tab', async () => {
    mockUseMedicationRequest.mockReturnValue({
      medications: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<MedicationsTable />);

    expect(screen.getByText('No active medications')).toBeInTheDocument();

    const allTab = screen.getByRole('tab', { name: 'All' });
    await userEvent.click(allTab);

    await waitFor(() => {
      expect(screen.getByText('No medication history')).toBeInTheDocument();
    });
  });

  it('has no accessibility violations', async () => {
    mockUseMedicationRequest.mockReturnValue({
      medications: mockMedications,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { container } = render(<MedicationsTable />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('processes and groups medications by date correctly', async () => {
    const medicationsByDate = [
      {
        date: '2024-01-15',
        medications: [mockMedications[0], mockMedications[1]],
      },
      {
        date: '2024-01-10',
        medications: [mockMedications[2]],
      },
    ];

    mockGroupByDate.mockReturnValue(medicationsByDate);
    mockFormatDate.mockImplementation((date, format) => {
      if (format === 'FULL_MONTH_DATE_FORMAT') {
        return { formattedResult: 'January 15, 2024' };
      }
      return { formattedResult: '15/01/2024' };
    });

    mockUseMedicationRequest.mockReturnValue({
      medications: mockMedications,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<MedicationsTable />);

    const allTab = screen.getByRole('tab', { name: 'All' });
    await userEvent.click(allTab);

    expect(mockGroupByDate).toHaveBeenCalled();
    expect(mockSortMedicationsByPriority).toHaveBeenCalled();
    expect(mockSortMedicationsByStatus).toHaveBeenCalled();
  });
});
