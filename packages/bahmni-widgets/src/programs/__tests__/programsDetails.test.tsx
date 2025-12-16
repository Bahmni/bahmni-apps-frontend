import { getPatientPrograms } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import { useNotification } from '../../notification';
import ProgramsDetails from '../programsDetails';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/services', () => ({
  getPatientPrograms: jest.fn(),
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  formatDate: jest.fn((date: string) => ({
    formattedResult: date ? `formatted-${date}` : '',
  })),
  DATE_FORMAT: 'DD MMM YYYY',
}));

jest.mock('../../hooks/usePatientUUID');
jest.mock('../../notification');

const mockedGetPatientPrograms = getPatientPrograms as jest.MockedFunction<
  typeof getPatientPrograms
>;
const mockedUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;
const mockedUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
>;

const mockAddNotification = jest.fn();

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'QueryClientWrapper';
  return Wrapper;
};

const mockProgramEnrollment = {
  uuid: 'program-uuid-1',
  display: 'HIV Program Enrollment',
  patient: {
    uuid: 'patient-uuid',
    display: 'John Doe',
  },
  program: {
    uuid: 'program-type-uuid',
    name: 'HIV Program',
    display: 'HIV Program',
  },
  dateEnrolled: '2023-01-15T10:00:00.000Z',
  dateCompleted: null,
  dateEnded: null,
  outcome: {
    uuid: 'outcome-uuid',
    display: 'Active Treatment',
  },
  states: [
    {
      uuid: 'state-uuid',
      startDate: '2023-01-15T10:00:00.000Z',
      endDate: null,
      state: {
        uuid: 'state-concept-uuid',
        display: 'Active Treatment',
        concept: {
          uuid: 'concept-uuid',
          display: 'Active Treatment',
        },
      },
    },
  ],
  attributes: [
    {
      uuid: 'attr-uuid',
      display: 'Reference Number',
      attributeType: {
        uuid: 'attr-type-uuid',
        display: 'Reference',
        description: 'Reference Number',
        retired: false,
        format: 'string',
      },
      value: 'REF-12345',
    },
  ],
  location: {
    uuid: 'location-uuid',
    display: 'Main Hospital',
  },
};

const mockCompletedProgram = {
  ...mockProgramEnrollment,
  uuid: 'program-uuid-2',
  dateCompleted: '2023-12-31T10:00:00.000Z',
  dateEnded: '2023-12-31T10:00:00.000Z',
  outcome: {
    uuid: 'outcome-uuid-2',
    display: 'Cured',
  },
};

describe('ProgramsDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNotification.mockReturnValue({
      addNotification: mockAddNotification,
      notifications: [],
      removeNotification: jest.fn(),
      clearAllNotifications: jest.fn(),
    });
  });

  describe('Component States', () => {
    const defaultConfig = {
      fields: [
        'programName',
        'referenceNumber',
        'destination',
        'startDate',
        'endDate',
        'outcome',
        'status',
      ],
    };

    it('should render loading state when data is being fetched', () => {
      mockedUsePatientUUID.mockReturnValue('patient-uuid');
      mockedGetPatientPrograms.mockImplementation(() => new Promise(() => {}));

      render(<ProgramsDetails config={defaultConfig} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByTestId('sortable-table-skeleton')).toBeInTheDocument();
    });

    it('should render empty state when no programs exist', async () => {
      mockedUsePatientUUID.mockReturnValue('patient-uuid');
      mockedGetPatientPrograms.mockResolvedValue({
        activePrograms: [],
        endedPrograms: [],
      });

      render(<ProgramsDetails config={defaultConfig} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTestId('sortable-table-empty')).toBeInTheDocument();
        expect(screen.getByText('PROGRAMS_NO_DATA')).toBeInTheDocument();
      });
    });

    it('should not fetch programs when patientUUID is null', () => {
      mockedUsePatientUUID.mockReturnValue(null);

      render(<ProgramsDetails config={defaultConfig} />, {
        wrapper: createWrapper(),
      });

      expect(mockedGetPatientPrograms).not.toHaveBeenCalled();
    });

    it('should display error notification when query fails', async () => {
      mockedUsePatientUUID.mockReturnValue('patient-uuid');
      const errorMessage = 'Failed to fetch programs';
      mockedGetPatientPrograms.mockRejectedValue(new Error(errorMessage));

      render(<ProgramsDetails config={defaultConfig} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith({
          title: 'ERROR_DEFAULT_TITLE',
          message: errorMessage,
          type: 'error',
        });
      });
    });
  });

  describe('Data Display', () => {
    const defaultConfig = {
      fields: [
        'programName',
        'referenceNumber',
        'destination',
        'startDate',
        'endDate',
        'outcome',
        'status',
      ],
    };

    it('should render table with correct headers', async () => {
      mockedUsePatientUUID.mockReturnValue('patient-uuid');
      mockedGetPatientPrograms.mockResolvedValue({
        activePrograms: [mockProgramEnrollment],
        endedPrograms: [],
      });

      render(<ProgramsDetails config={defaultConfig} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByRole('table')).toHaveAttribute(
          'aria-label',
          'PROGRAMS_TABLE_ARIA_LABEL',
        );
        expect(
          screen.getByText('PROGRAMS_EPISODE_OF_CARE'),
        ).toBeInTheDocument();
        expect(
          screen.getByText('PROGRAMS_REFERENCE_NUMBER'),
        ).toBeInTheDocument();
        expect(screen.getByText('PROGRAMS_DESTINATION')).toBeInTheDocument();
        expect(screen.getByText('PROGRAMS_START_DATE')).toBeInTheDocument();
        expect(screen.getByText('PROGRAMS_END_DATE')).toBeInTheDocument();
        expect(screen.getByText('PROGRAMS_OUTCOME')).toBeInTheDocument();
        expect(screen.getByText('PROGRAMS_STATUS')).toBeInTheDocument();
      });
    });

    it('should display program information correctly', async () => {
      mockedUsePatientUUID.mockReturnValue('patient-uuid');
      mockedGetPatientPrograms.mockResolvedValue({
        activePrograms: [mockProgramEnrollment],
        endedPrograms: [],
      });

      render(<ProgramsDetails config={defaultConfig} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('HIV Program')).toBeInTheDocument();
        expect(screen.getByText('REF-12345')).toBeInTheDocument();
        expect(screen.getByText('Main Hospital')).toBeInTheDocument();
        const activeTreatmentElements = screen.getAllByText(
          (content, element) => {
            return element?.textContent === 'Active Treatment';
          },
        );
        expect(activeTreatmentElements.length).toBeGreaterThan(0);
        expect(
          screen.getByText('PROGRAMS_STATUS_IN_PROGRESS'),
        ).toBeInTheDocument();
      });
    });

    it('should display both active and ended programs', async () => {
      mockedUsePatientUUID.mockReturnValue('patient-uuid');
      mockedGetPatientPrograms.mockResolvedValue({
        activePrograms: [mockProgramEnrollment],
        endedPrograms: [mockCompletedProgram],
      });

      render(<ProgramsDetails config={defaultConfig} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        // 1 header row + 2 data rows
        expect(rows).toHaveLength(3);
      });
    });

    it('should only display columns specified in config', async () => {
      mockedUsePatientUUID.mockReturnValue('patient-uuid');
      mockedGetPatientPrograms.mockResolvedValue({
        activePrograms: [mockProgramEnrollment],
        endedPrograms: [],
      });

      const limitedConfig = {
        fields: ['programName', 'referenceNumber', 'status'],
      };

      render(<ProgramsDetails config={limitedConfig} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(
          screen.getByText('PROGRAMS_EPISODE_OF_CARE'),
        ).toBeInTheDocument();
        expect(
          screen.getByText('PROGRAMS_REFERENCE_NUMBER'),
        ).toBeInTheDocument();
        expect(screen.getByText('PROGRAMS_STATUS')).toBeInTheDocument();
        expect(
          screen.queryByText('PROGRAMS_DESTINATION'),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByText('PROGRAMS_START_DATE'),
        ).not.toBeInTheDocument();
        expect(screen.queryByText('PROGRAMS_END_DATE')).not.toBeInTheDocument();
        expect(screen.queryByText('PROGRAMS_OUTCOME')).not.toBeInTheDocument();
      });
    });

    it('should render empty table when no columns are configured', async () => {
      mockedUsePatientUUID.mockReturnValue('patient-uuid');
      mockedGetPatientPrograms.mockResolvedValue({
        activePrograms: [mockProgramEnrollment],
        endedPrograms: [],
      });

      const emptyConfig = {
        fields: [],
      };

      render(<ProgramsDetails config={emptyConfig} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        const headers = screen.queryAllByRole('columnheader');
        expect(headers).toHaveLength(0);
      });
    });
  });

  describe('Cell Rendering', () => {
    const defaultConfig = {
      fields: [
        'programName',
        'referenceNumber',
        'destination',
        'startDate',
        'endDate',
        'outcome',
        'status',
      ],
    };

    it('should render all cell types with populated data correctly', async () => {
      mockedUsePatientUUID.mockReturnValue('patient-uuid');
      mockedGetPatientPrograms.mockResolvedValue({
        activePrograms: [mockProgramEnrollment],
        endedPrograms: [],
      });

      render(<ProgramsDetails config={defaultConfig} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('HIV Program')).toBeInTheDocument();
        expect(screen.getByText('REF-12345')).toBeInTheDocument();
        expect(screen.getByText('Main Hospital')).toBeInTheDocument();
        expect(
          screen.getByText('formatted-2023-01-15T10:00:00.000Z'),
        ).toBeInTheDocument();
        expect(screen.getByText('Active Treatment')).toBeInTheDocument();
        expect(
          screen.getByTestId('program-status-program-uuid-1'),
        ).toBeInTheDocument();
        const rows = screen.getAllByRole('row');
        expect(rows).toHaveLength(2);
      });
    });

    it('should render completed program with end date', async () => {
      mockedUsePatientUUID.mockReturnValue('patient-uuid');
      mockedGetPatientPrograms.mockResolvedValue({
        activePrograms: [],
        endedPrograms: [mockCompletedProgram],
      });

      render(<ProgramsDetails config={defaultConfig} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(
          screen.getByText('formatted-2023-12-31T10:00:00.000Z'),
        ).toBeInTheDocument();
        expect(
          screen.getByTestId('program-status-program-uuid-2'),
        ).toBeInTheDocument();
      });
    });

    it('should render ellipsis for null/missing values', async () => {
      const programWithMissingData = {
        ...mockProgramEnrollment,
        location: null,
        outcome: null,
        states: [],
        dateEnded: null,
      };

      mockedUsePatientUUID.mockReturnValue('patient-uuid');
      mockedGetPatientPrograms.mockResolvedValue({
        activePrograms: [programWithMissingData],
        endedPrograms: [],
      });

      render(<ProgramsDetails config={defaultConfig} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        const ellipses = screen.getAllByText('…');
        // Should have ellipsis for: destination, end date, and outcome
        expect(ellipses.length).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('Query Integration', () => {
    const defaultConfig = {
      fields: [
        'programName',
        'referenceNumber',
        'destination',
        'startDate',
        'endDate',
        'outcome',
        'status',
      ],
    };

    it('should use correct query key with patient UUID', async () => {
      const patientUUID = 'test-patient-uuid';
      mockedUsePatientUUID.mockReturnValue(patientUUID);
      mockedGetPatientPrograms.mockResolvedValue({
        activePrograms: [],
        endedPrograms: [],
      });

      render(<ProgramsDetails config={defaultConfig} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockedGetPatientPrograms).toHaveBeenCalledWith(patientUUID);
      });
    });

    it('should update programs when data changes', async () => {
      mockedUsePatientUUID.mockReturnValue('patient-uuid');
      mockedGetPatientPrograms.mockResolvedValue({
        activePrograms: [mockProgramEnrollment],
        endedPrograms: [],
      });

      const { rerender } = render(<ProgramsDetails config={defaultConfig} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('HIV Program')).toBeInTheDocument();
      });

      mockedGetPatientPrograms.mockResolvedValue({
        activePrograms: [mockProgramEnrollment, mockCompletedProgram],
        endedPrograms: [],
      });

      rerender(<ProgramsDetails config={defaultConfig} />);

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        expect(rows.length).toBeGreaterThan(1);
      });
    });
  });

  describe('Accessibility', () => {
    const defaultConfig = {
      fields: [
        'programName',
        'referenceNumber',
        'destination',
        'startDate',
        'endDate',
        'outcome',
        'status',
      ],
    };

    it('should pass accessibility tests with data', async () => {
      mockedUsePatientUUID.mockReturnValue('patient-uuid');
      mockedGetPatientPrograms.mockResolvedValue({
        activePrograms: [mockProgramEnrollment],
        endedPrograms: [],
      });

      const { container } = render(<ProgramsDetails config={defaultConfig} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('HIV Program')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should pass accessibility tests in empty state', async () => {
      mockedUsePatientUUID.mockReturnValue('patient-uuid');
      mockedGetPatientPrograms.mockResolvedValue({
        activePrograms: [],
        endedPrograms: [],
      });

      const { container } = render(<ProgramsDetails config={defaultConfig} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('PROGRAMS_NO_DATA')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
