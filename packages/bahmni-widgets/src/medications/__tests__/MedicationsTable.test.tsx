import {
  ConsultationSavedEventPayload,
  formatDateTime,
  groupByDate,
  MedicationRequest,
  useSubscribeConsultationSaved,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import { useNotification } from '../../notification';
import { useUserPrivilege } from '../../userPrivileges/useUserPrivilege';
import MedicationsTable from '../MedicationsTable';
import {
  formatMedicationRequest,
  sortMedicationsByDateDistance,
  sortMedicationsByPriority,
  sortMedicationsByStatus,
} from '../utils';
import {
  mockMedications,
  mockMedicationWithDoseForm,
  mockMedicationWithoutDoseForm,
  mockMedicationCapsule,
  mockMixedDoseFormMedications,
  mockStatMedication,
} from './__mocks__/medicationMocks';

expect.extend(toHaveNoViolations);

jest.mock('../../hooks/usePatientUUID');
jest.mock('../../notification');
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  formatDateTime: jest.fn(),
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

jest.mock('../../userPrivileges/useUserPrivilege');

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;
const mockUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
>;
const mockFormatDateTime = formatDateTime as jest.MockedFunction<
  typeof formatDateTime
>;
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
const mockUseUserPrivilege = useUserPrivilege as jest.MockedFunction<
  typeof useUserPrivilege
>;
const mockUseSubscribeConsultationSaved =
  useSubscribeConsultationSaved as jest.MockedFunction<
    typeof useSubscribeConsultationSaved
  >;

describe('MedicationsTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUsePatientUUID.mockReturnValue('patient-uuid-123');

    mockUseNotification.mockReturnValue({
      addNotification: jest.fn(),
    } as any);

    mockFormatDateTime.mockReturnValue({ formattedResult: '15/01/2024' });

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
        priority: med.priority,
        asNeeded: med.asNeeded,
        isImmediate: med.isImmediate,
        doseForm: med.doseForm,
      }),
    );

    mockSortMedicationsByStatus.mockImplementation((meds: any[]) => meds);
    mockSortMedicationsByPriority.mockImplementation((meds: any[]) => meds);
    mockSortMedicationsByDateDistance.mockImplementation((meds: any[]) => meds);
    mockGroupByDate.mockReturnValue([]);
    mockUseUserPrivilege.mockReturnValue({ userPrivileges: [] } as any);
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
    expect(screen.getByText('MEDICATIONS_ERROR_FETCHING')).toBeInTheDocument();
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
    expect(screen.getByText('NO_ACTIVE_MEDICATIONS')).toBeInTheDocument();
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
    expect(screen.getByText('MEDICATIONS_STATUS_ACTIVE')).toBeInTheDocument();
  });

  it('displays PRN tag for as-needed medications', () => {
    const prnMedication = { ...mockMedications[0], asNeeded: true };

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

  it('displays STAT tag for STAT medications', () => {
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

    const activeTab = screen.getByRole('tab', {
      name: 'MEDICATIONS_TAB_ACTIVE_SCHEDULED',
    });
    const allTab = screen.getByRole('tab', { name: 'MEDICATIONS_TAB_ALL' });

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

    expect(screen.getByText('NO_ACTIVE_MEDICATIONS')).toBeInTheDocument();

    const allTab = screen.getByRole('tab', { name: 'MEDICATIONS_TAB_ALL' });
    await userEvent.click(allTab);

    await waitFor(() => {
      expect(screen.getByText('NO_MEDICATION_HISTORY')).toBeInTheDocument();
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
      { date: '2024-01-15', items: [formattedMeds[0], formattedMeds[1]] },
      { date: '2024-01-10', items: [formattedMeds[2]] },
    ];

    mockGroupByDate.mockReturnValue(medicationsByDate);

    mockUseQuery.mockReturnValue({
      data: mockMedications,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MedicationsTable />);

    const allTab = screen.getByRole('tab', { name: 'MEDICATIONS_TAB_ALL' });
    await userEvent.click(allTab);

    expect(mockGroupByDate).toHaveBeenCalled();
    expect(mockSortMedicationsByPriority).toHaveBeenCalled();
    expect(mockSortMedicationsByStatus).toHaveBeenCalled();
  });

  it('calls API with updated query key when code changes', () => {
    mockUseQuery.mockReturnValue({
      data: mockMedications,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
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

    rerender(<MedicationsTable />);

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['medications', 'patient-uuid-123', [], undefined],
      }),
    );
  });

  it.each([
    { label: 'config is not provided', config: undefined },
    { label: 'actions is undefined', config: {} },
    { label: 'actions is an empty array', config: { actions: [] } },
  ])('hides the actions column when $label', ({ config }) => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    render(<MedicationsTable config={config} />);

    expect(
      screen.queryByText('MEDICATIONS_WIDGET_COL_ACTIONS'),
    ).not.toBeInTheDocument();
  });

  describe('Medication doseForm display', () => {
    it.each([
      {
        label: 'Tablet',
        medication: mockMedicationWithDoseForm,
        expectedQuantityText: 'Tablet | 10 Tablets',
      },
      {
        label: 'Capsule',
        medication: mockMedicationCapsule,
        expectedQuantityText: 'Capsule | 1 Capsule',
      },
    ])(
      'displays $label doseForm with quantity when doseForm is provided',
      ({ medication, expectedQuantityText }) => {
        mockUseQuery.mockReturnValue({
          data: [medication],
          isLoading: false,
          isError: false,
          error: null,
          refetch: jest.fn(),
        } as any);

        render(<MedicationsTable />);
        expect(screen.getByText(medication.name)).toBeInTheDocument();
        expect(screen.getByText(expectedQuantityText)).toBeInTheDocument();
      },
    );

    it('displays only quantity when doseForm is not provided', () => {
      mockUseQuery.mockReturnValue({
        data: [mockMedicationWithoutDoseForm],
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      render(<MedicationsTable />);
      expect(screen.getByText('Aspirin 100mg')).toBeInTheDocument();
      expect(screen.getByText('14 tablets')).toBeInTheDocument();
    });

    it('should pass includeRelated=true to getPatientMedications', () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      render(
        <MedicationsTable
          config={{ code: [] }}
          episodeOfCareUuids={[]}
          encounterUuids={[]}
        />,
      );

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: expect.arrayContaining(['medications']),
        }),
      );
    });

    it('handles multiple medications with varying doseForm presence', () => {
      mockUseQuery.mockReturnValue({
        data: mockMixedDoseFormMedications,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      render(<MedicationsTable />);
      expect(screen.getByText('Tablet | 2 Tablet')).toBeInTheDocument();
      expect(screen.getByText('1 bottle')).toBeInTheDocument();
    });

    it('renders STAT tag when medication has stat priority', () => {
      mockUseQuery.mockReturnValue({
        data: [mockStatMedication],
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      render(<MedicationsTable />);
      expect(screen.getByText('STAT')).toBeInTheDocument();
      expect(screen.getByText('IV Injection | 1 vial')).toBeInTheDocument();
    });
  });

  describe('Edit button encounter gating', () => {
    const editConfig = {
      actions: [
        {
          label: 'Edit',
          type: 'edit',
          encounterType: 'Consultation',
          requiredPrivilege: ['Edit Orders'],
        },
      ],
    };

    const setupWithActiveMeds = () => {
      mockUseUserPrivilege.mockReturnValue({
        userPrivileges: [{ name: 'Edit Orders' }],
      } as any);

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
          fhirResource: {
            resourceType: 'MedicationRequest',
            id: med.id,
            encounter: { reference: 'Encounter/enc-uuid-123' },
          },
        }),
      );

      mockUseQuery.mockReturnValue({
        data: [mockMedications[0]],
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
      } as any);
    };

    it('shows enabled edit button when encounter session allows editing', () => {
      setupWithActiveMeds();

      render(
        <MedicationsTable
          config={editConfig}
          canEditOrCreate
          activeEncounterUuid="enc-uuid-123"
        />,
      );

      const editButton = screen.getByTestId('medication-action-edit-1');
      expect(editButton).toBeInTheDocument();
      expect(editButton).not.toBeDisabled();
    });

    it('shows disabled edit button when encounter session does not allow editing', () => {
      setupWithActiveMeds();

      render(
        <MedicationsTable
          config={editConfig}
          canEditOrCreate={false}
          activeEncounterUuid={null}
        />,
      );

      const editButton = screen.getByTestId('medication-action-edit-1');
      expect(editButton).toBeInTheDocument();
      expect(editButton).toBeDisabled();
    });

    it('shows disabled edit button when encounter UUID does not match medication encounter', () => {
      setupWithActiveMeds();

      render(
        <MedicationsTable
          config={editConfig}
          canEditOrCreate
          activeEncounterUuid="different-encounter-uuid"
        />,
      );

      const editButton = screen.getByTestId('medication-action-edit-1');
      expect(editButton).toBeInTheDocument();
      expect(editButton).toBeDisabled();
    });
  });

  describe('Consultation saved event subscription', () => {
    it.each([
      {
        description: 'same patient with medications updated',
        payload: {
          patientUUID: 'patient-uuid-123',
          updatedResources: { medications: true },
        } as unknown as ConsultationSavedEventPayload,
        expectedCallCount: 1,
      },
      {
        description: 'same patient with immunizationHistory updated',
        payload: {
          patientUUID: 'patient-uuid-123',
          updatedResources: { immunizationHistory: true },
        } as unknown as ConsultationSavedEventPayload,
        expectedCallCount: 1,
      },
      {
        description:
          'same patient with both medications and immunizationHistory updated',
        payload: {
          patientUUID: 'patient-uuid-123',
          updatedResources: { medications: true, immunizationHistory: true },
        } as unknown as ConsultationSavedEventPayload,
        expectedCallCount: 1,
      },
      {
        description:
          'same patient with neither medications nor immunizationHistory updated',
        payload: {
          patientUUID: 'patient-uuid-123',
          updatedResources: {
            medications: false,
            immunizationHistory: false,
          },
        } as unknown as ConsultationSavedEventPayload,
        expectedCallCount: 0,
      },
      {
        description: 'different patient with medications updated',
        payload: {
          patientUUID: 'other-uuid',
          updatedResources: { medications: true },
        } as unknown as ConsultationSavedEventPayload,
        expectedCallCount: 0,
      },
      {
        description: 'different patient with immunizationHistory updated',
        payload: {
          patientUUID: 'other-uuid',
          updatedResources: { immunizationHistory: true },
        } as unknown as ConsultationSavedEventPayload,
        expectedCallCount: 0,
      },
    ])(
      'ConsultationSaved — $description: refetch called $expectedCallCount time(s)',
      ({ payload, expectedCallCount }) => {
        const refetch = jest.fn();
        mockUseQuery.mockReturnValue({
          data: [],
          isLoading: false,
          isError: false,
          error: null,
          refetch,
        } as any);
        mockUseSubscribeConsultationSaved.mockImplementation(
          (callback: (payload: ConsultationSavedEventPayload) => void) => {
            callback(payload);
          },
        );

        render(<MedicationsTable />);

        expect(refetch).toHaveBeenCalledTimes(expectedCallCount);
      },
    );
  });
});
