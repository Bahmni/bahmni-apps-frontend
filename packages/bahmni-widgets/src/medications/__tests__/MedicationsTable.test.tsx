import {
  formatDate,
  groupByDate,
  MedicationRequest,
  MedicationStatus,
  useTranslation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import { useNotification } from '../../notification';
import MedicationsTable from '../MedicationsTable';
import {
  formatMedicationRequest,
  sortMedicationsByDateDistance,
  sortMedicationsByPriority,
  sortMedicationsByStatus,
} from '../utils';

expect.extend(toHaveNoViolations);

jest.mock('../../hooks/usePatientUUID');
jest.mock('../../notification');
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: jest.fn(),
  formatDate: jest.fn(),
  groupByDate: jest.fn(),
  useSubscribeConsultationSaved: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('../utils', () => ({
  formatMedicationRequest: jest.fn(),
  sortMedicationsByStatus: jest.fn(),
  sortMedicationsByPriority: jest.fn(),
  sortMedicationsByDateDistance: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;
const mockUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
>;
const mockUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;

const mockFormatDate = formatDate as jest.MockedFunction<typeof formatDate>;
const mockFormatMedicationRequest =
  formatMedicationRequest as jest.MockedFunction<
    typeof formatMedicationRequest
  >;
const mockSortMedicationsByStatus =
  sortMedicationsByStatus as jest.MockedFunction<
    typeof sortMedicationsByStatus
  >;
const mockSortMedicationsByPriority =
  sortMedicationsByPriority as jest.MockedFunction<
    typeof sortMedicationsByPriority
  >;
const mockSortMedicationsByDateDistance =
  sortMedicationsByDateDistance as jest.MockedFunction<
    typeof sortMedicationsByDateDistance
  >;
const mockGroupByDate = groupByDate as jest.MockedFunction<typeof groupByDate>;

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

    // Mock usePatientUUID
    mockUsePatientUUID.mockReturnValue('patient-uuid-123');

    // Mock useNotification
    mockUseNotification.mockReturnValue({
      addNotification: jest.fn(),
    } as any);

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
      i18n: {} as any,
      ready: true,
    } as any);

    mockFormatDate.mockReturnValue({ formattedResult: '15/01/2024' });

    mockFormatMedicationRequest.mockImplementation(
      (med: MedicationRequest) => ({
        id: med.id,
        name: med.name,
        dosage: `${med.dose?.value} ${med.dose?.unit}`,
        dosageUnit: med.dose?.unit ?? '',
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
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      error: new Error('Network error'),
      refetch: jest.fn(),
    } as any);

    render(<MedicationsTable />);
    expect(screen.getByText('Error fetching medications')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MedicationsTable />);
    expect(screen.getByText('No active medications')).toBeInTheDocument();
  });

  it('renders medications with correct content', () => {
    mockUseQuery.mockReturnValue({
      data: [mockMedications[0]],
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    } as any);

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

    mockUseQuery.mockReturnValue({
      data: [prnMedication],
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MedicationsTable />);
    expect(screen.getByText('PRN')).toBeInTheDocument();
  });

  it('displays STAT tag for immediate medications', () => {
    mockUseQuery.mockReturnValue({
      data: [mockMedications[1]],
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MedicationsTable />);
    expect(screen.getByText('STAT')).toBeInTheDocument();
  });

  it('renders empty orderedBy field', () => {
    const medicationWithEmptyOrderedBy = {
      ...mockMedications[0],
      orderedBy: '',
    };

    mockUseQuery.mockReturnValue({
      data: [medicationWithEmptyOrderedBy],
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MedicationsTable />);
    expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument();
  });

  it('displays formatted dates', () => {
    mockUseQuery.mockReturnValue({
      data: [mockMedications[0]],
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MedicationsTable />);
    const dateElements = screen.getAllByText('15/01/2024');
    expect(dateElements).toHaveLength(2);
  });

  it('switches between tabs correctly', async () => {
    mockUseQuery.mockReturnValue({
      data: mockMedications,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    } as any);

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
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MedicationsTable />);

    expect(screen.getByText('No active medications')).toBeInTheDocument();

    const allTab = screen.getByRole('tab', { name: 'All' });
    await userEvent.click(allTab);

    await waitFor(() => {
      expect(screen.getByText('No medication history')).toBeInTheDocument();
    });
  });

  it('has no accessibility violations', async () => {
    mockUseQuery.mockReturnValue({
      data: mockMedications,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    const { container } = render(<MedicationsTable />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('processes and groups medications by date correctly', async () => {
    // Use formatted medications instead of raw ones
    const formattedMeds = mockMedications.map((med) => ({
      id: med.id,
      name: med.name,
      dosage: `${med.dose?.value} ${med.dose?.unit}`,
      dosageUnit: med.dose?.unit ?? '',
      quantity: `${med.quantity.value} ${med.quantity.unit}`,
      instruction: med.instructions,
      startDate: med.startDate,
      orderDate: med.orderDate,
      orderedBy: med.orderedBy,
      status: med.status,
      asNeeded: med.asNeeded,
      isImmediate: med.isImmediate,
    }));

    const medicationsByDate = [
      {
        date: '2024-01-15',
        items: [formattedMeds[0], formattedMeds[1]],
      },
      {
        date: '2024-01-10',
        items: [formattedMeds[2]],
      },
    ];

    mockGroupByDate.mockReturnValue(medicationsByDate);
    mockFormatDate.mockImplementation((date: any, t: any, format: any) => {
      if (format === 'FULL_MONTH_DATE_FORMAT') {
        return { formattedResult: 'January 15, 2024' };
      }
      return { formattedResult: '15/01/2024' };
    });

    mockUseQuery.mockReturnValue({
      data: mockMedications,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MedicationsTable />);

    const allTab = screen.getByRole('tab', { name: 'All' });
    await userEvent.click(allTab);

    expect(mockGroupByDate).toHaveBeenCalled();
    expect(mockSortMedicationsByPriority).toHaveBeenCalled();
    expect(mockSortMedicationsByStatus).toHaveBeenCalled();
  });

  it('calls API with updated query key when code changes', () => {
    const mockRefetch = jest.fn();

    mockUseQuery.mockReturnValue({
      data: mockMedications,
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    const { rerender } = render(
      <MedicationsTable config={{ code: ['medication-code-1'] }} />,
    );

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [
          'medications',
          'patient-uuid-123',
          ['medication-code-1'],
          undefined,
        ],
      }),
    );

    mockUseQuery.mockClear();

    // Re-render with updated code for medications (medications do not have any specific code)
    rerender(<MedicationsTable />);

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['medications', 'patient-uuid-123', [], undefined],
      }),
    );
  });
});
