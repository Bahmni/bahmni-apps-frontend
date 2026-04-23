import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import AppointmentsTable from '../AppointmentsTable';
import PastAppointments from '../components/PastAppointments';
import UpcomingAppointments from '../components/UpcomingAppointments';

expect.extend(toHaveNoViolations);

jest.mock('../../hooks/usePatientUUID');
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: jest.fn(() => ({
    t: (key: string) => key,
  })),
  formatDateTime: jest.fn(() => ({ formattedResult: '10:30 AM' })),
}));
jest.mock('../components/UpcomingAppointments');
jest.mock('../components/PastAppointments');

const mockUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;
const mockUpcomingAppointments = UpcomingAppointments as jest.MockedFunction<
  typeof UpcomingAppointments
>;
const mockPastAppointments = PastAppointments as jest.MockedFunction<
  typeof PastAppointments
>;

describe('AppointmentsTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePatientUUID.mockReturnValue('patient-uuid-123');
    mockUpcomingAppointments.mockImplementation(() => (
      <div data-testid="upcoming-appointments">Upcoming</div>
    ));
    mockPastAppointments.mockImplementation(() => (
      <div data-testid="past-appointments">Past</div>
    ));

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
  });

  describe('Rendering', () => {
    it('should render tabs', () => {
      render(<AppointmentsTable config={{}} episodeOfCareUuids={[]} />);

      expect(screen.getByTestId('appointments-table')).toBeInTheDocument();
      expect(screen.getByText('APPOINTMENTS_TAB_UPCOMING')).toBeInTheDocument();
      expect(screen.getByText('APPOINTMENTS_TAB_PAST')).toBeInTheDocument();
    });

    it('should render upcoming appointments component on mount', () => {
      render(<AppointmentsTable config={{}} episodeOfCareUuids={[]} />);

      expect(screen.getByTestId('upcoming-appointments')).toBeInTheDocument();
    });

    it('should show error message when patient UUID is not available', () => {
      mockUsePatientUUID.mockReturnValue(null);

      render(<AppointmentsTable config={{}} episodeOfCareUuids={[]} />);

      expect(
        screen.getByTestId('appointments-table-error'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('APPOINTMENTS_ERROR_FETCHING'),
      ).toBeInTheDocument();
    });
  });

  describe('Tab Switching', () => {
    it('should switch between tabs when clicked', async () => {
      const user = userEvent.setup();
      render(<AppointmentsTable config={{}} episodeOfCareUuids={[]} />);

      const pastTab = screen.getByText('APPOINTMENTS_TAB_PAST');
      await user.click(pastTab);

      expect(mockPastAppointments).toHaveBeenCalled();
    });
  });

  describe('Props Handling', () => {
    it('should render child components with patient UUID', () => {
      const patientUUID = 'test-patient-123';
      mockUsePatientUUID.mockReturnValue(patientUUID);

      render(<AppointmentsTable config={{}} episodeOfCareUuids={[]} />);

      expect(mockUpcomingAppointments).toHaveBeenCalled();
      expect(screen.getByTestId('upcoming-appointments')).toBeInTheDocument();
    });

    it('should pass pageSize from config to UpcomingAppointments and PastAppointments', () => {
      render(
        <AppointmentsTable config={{ pageSize: 10 }} episodeOfCareUuids={[]} />,
      );

      expect(mockUpcomingAppointments).toHaveBeenCalledWith(
        expect.objectContaining({ pageSize: 10 }),
        undefined,
      );
      expect(mockPastAppointments).toHaveBeenCalledWith(
        expect.objectContaining({ pageSize: 10 }),
        undefined,
      );
    });

    it('should use default pageSize of 5 when config is absent', () => {
      render(<AppointmentsTable config={{}} episodeOfCareUuids={[]} />);

      expect(mockUpcomingAppointments).toHaveBeenCalledWith(
        expect.objectContaining({ pageSize: 5 }),
        undefined,
      );
      expect(mockPastAppointments).toHaveBeenCalledWith(
        expect.objectContaining({ pageSize: 5 }),
        undefined,
      );
    });

    it('should not pass numberOfPastAppointments to PastAppointments', () => {
      render(
        <AppointmentsTable
          config={{ numberOfPastAppointments: 5 }}
          episodeOfCareUuids={[]}
        />,
      );

      expect(mockPastAppointments).toHaveBeenCalledWith(
        expect.not.objectContaining({
          numberOfPastAppointments: expect.anything(),
        }),
        undefined,
      );
    });

    it('should accept custom fields config', () => {
      const customFields = ['appointmentNumber', 'status'];
      render(
        <AppointmentsTable
          config={{ fields: customFields }}
          episodeOfCareUuids={[]}
        />,
      );

      expect(screen.getByTestId('appointments-table')).toBeInTheDocument();
    });
  });

  describe('renderCell', () => {
    let renderCellFunction: (row: any, key: string) => React.ReactNode;

    const mockRow = {
      uuid: 'test-uuid',
      id: 'test-id',
      appointmentDate: '2025-02-15T10:30:00Z',
      appointmentStartTime: '2025-02-15T10:30:00Z',
      appointmentEndTime: '2025-02-15T11:00:00Z',
      appointmentNumber: 'APT-123',
      service: 'Consultation',
      reason: 'Follow-up',
      status: 'booked',
      provider: 'Dr. Smith',
    };

    beforeEach(() => {
      render(<AppointmentsTable config={{}} episodeOfCareUuids={[]} />);
      const upcomingCalls = mockUpcomingAppointments.mock.calls;
      if (upcomingCalls.length > 0) {
        renderCellFunction = upcomingCalls[0][0].renderCell;
      }
    });

    it.each([
      ['appointmentSlot', '10:30 AM - 10:30 AM'],
      ['appointmentDate', '10:30 AM'],
      ['appointmentNumber', 'APT-123'],
    ])('should return "%s" as "%s"', (field, expected) => {
      const result = renderCellFunction(mockRow, field);
      expect(result).toBe(expected);
    });

    it('should return service as React element with correct value', () => {
      const result: any = renderCellFunction(mockRow, 'service');
      expect(result.props.children).toBe('Consultation');
    });

    it('should return null for unknown field', () => {
      const result = renderCellFunction(mockRow, 'unknownField');
      expect(result).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <AppointmentsTable config={{}} episodeOfCareUuids={[]} />,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations when showing error', async () => {
      mockUsePatientUUID.mockReturnValue(null);
      const { container } = render(
        <AppointmentsTable config={{}} episodeOfCareUuids={[]} />,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
