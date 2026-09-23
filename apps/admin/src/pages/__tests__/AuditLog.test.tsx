import { fireEvent, render, screen, within } from '@testing-library/react';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import { AuditLog } from '../AuditLog';

jest.mock('../../components/AdminLayout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="admin-layout-test-id">{children}</div>
  ),
}));

jest.mock('../../hooks/useAuditLogs');

// The real DatePicker wraps flatpickr, which isn't practical to drive through
// jsdom. Stub it down to a button that invokes the same `onChange(dates)`
// callback contract so we can verify the page's wiring to `setFilters`.
jest.mock('@bahmni/design-system', () => {
  const actual = jest.requireActual('@bahmni/design-system');
  return {
    ...actual,
    DatePicker: ({
      onChange,
      children,
    }: {
      onChange: (dates: Date[]) => void;
      children: React.ReactNode;
    }) => (
      <div>
        <button
          type="button"
          data-testid="audit-log-start-date-picker-mock"
          onClick={() => onChange([new Date('2024-02-02T00:00:00.000Z')])}
        >
          trigger
        </button>
        {children}
      </div>
    ),
  };
});

const mockUseAuditLogs = useAuditLogs as jest.MockedFunction<
  typeof useAuditLogs
>;

const baseHookState = {
  filters: {
    startDate: new Date('2024-01-01T00:00:00.000Z'),
    startTime: '',
    username: '',
    patientId: '',
  },
  setFilters: jest.fn(),
  logs: [],
  isLoading: false,
  isFetching: false,
  isError: false,
  emptyMessageKey: null as string | null,
  firstIndex: 0,
  lastIndex: 0,
  next: jest.fn(),
  prev: jest.fn(),
  runReport: jest.fn(),
  reset: jest.fn(),
};

describe('AuditLog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuditLogs.mockReturnValue(baseHookState);
  });

  it('renders inside the admin layout with the title and filters', () => {
    render(<AuditLog />);

    const layout = screen.getByTestId('admin-layout-test-id');
    const page = screen.getByTestId('admin-audit-log-page-test-id');
    expect(layout).toContainElement(page);
    expect(screen.getByText('Audit Log')).toBeInTheDocument();
    expect(screen.getByTestId('audit-log-username-input')).toBeInTheDocument();
    expect(
      screen.getByTestId('audit-log-patient-id-input'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('audit-log-apply-button')).toBeInTheDocument();
    expect(screen.getByTestId('audit-log-reset-button')).toBeInTheDocument();
  });

  it('renders the table columns matching the legacy screen', () => {
    render(<AuditLog />);

    const table = screen.getByTestId('audit-log-table');
    [
      'Event ID',
      'Created At',
      'Event Type',
      'Username',
      'Patient ID',
      'Message',
      'Module',
    ].forEach((header) => {
      expect(
        within(table).getByRole('columnheader', { name: header }),
      ).toBeInTheDocument();
    });
  });

  it('renders audit log rows with translated message and formatted date', () => {
    mockUseAuditLogs.mockReturnValue({
      ...baseHookState,
      logs: [
        {
          id: '1',
          auditLogId: 1,
          dateCreated: '2024-01-01T10:00:00.000Z',
          eventType: 'OPEN_VISIT',
          userId: 'superman',
          patientId: 'PID-1',
          message: 'Opened a visit',
          module: 'MODULE_LABEL_REGISTRATION_KEY',
        },
      ],
    });

    render(<AuditLog />);

    const table = screen.getByTestId('audit-log-table');
    expect(within(table).getByText('OPEN_VISIT')).toBeInTheDocument();
    expect(within(table).getByText('superman')).toBeInTheDocument();
    expect(within(table).getByText('PID-1')).toBeInTheDocument();
    expect(within(table).getByText('Opened a visit')).toBeInTheDocument();
    expect(
      within(table).getByText('MODULE_LABEL_REGISTRATION_KEY'),
    ).toBeInTheDocument();
  });

  it('interpolates `{{}}` tokens left in an already-translated message using row/messageParams context', () => {
    mockUseAuditLogs.mockReturnValue({
      ...baseHookState,
      logs: [
        {
          id: '2',
          auditLogId: 2,
          dateCreated: '2024-01-01T10:00:00.000Z',
          eventType: 'USER_LOGIN_SUCCESS',
          userId: 'superman',
          patientId: '',
          message: 'User {{userId}} logged in.',
          module: 'MODULE_LABEL_LOGIN_KEY',
        },
        {
          id: '3',
          auditLogId: 3,
          dateCreated: '2024-01-01T10:05:00.000Z',
          eventType: 'STOP_MEDICATION',
          userId: 'superman',
          patientId: 'PID-2',
          message: 'Stopped {{drugName}}',
          messageParams: { drugName: 'Paracetamol' },
          module: 'MODULE_LABEL_CLINICAL_KEY',
        },
      ],
    });

    render(<AuditLog />);

    const table = screen.getByTestId('audit-log-table');
    expect(
      within(table).getByText('User superman logged in.'),
    ).toBeInTheDocument();
    expect(within(table).getByText('Stopped Paracetamol')).toBeInTheDocument();
  });

  it('updates filters when the date/time/username/patient ID inputs change', () => {
    render(<AuditLog />);

    fireEvent.click(screen.getByTestId('audit-log-start-date-picker-mock'));
    expect(baseHookState.setFilters).toHaveBeenCalled();
    const dateUpdater = baseHookState.setFilters.mock.calls[0][0];
    expect(
      dateUpdater({
        startDate: null,
        startTime: '',
        username: '',
        patientId: '',
      }).startDate,
    ).toEqual(new Date('2024-02-02T00:00:00.000Z'));

    fireEvent.change(screen.getByTestId('audit-log-start-time-input'), {
      target: { value: '10:30' },
    });
    expect(baseHookState.setFilters).toHaveBeenCalled();

    fireEvent.change(screen.getByTestId('audit-log-username-input'), {
      target: { value: 'superman' },
    });
    fireEvent.change(screen.getByTestId('audit-log-patient-id-input'), {
      target: { value: 'PID-1' },
    });

    expect(baseHookState.setFilters.mock.calls.length).toBeGreaterThanOrEqual(
      3,
    );

    // Exercise the setFilters updater functions passed by the page and
    // confirm each field is set correctly by at least one call.
    const updaters = baseHookState.setFilters.mock.calls.map((call) => call[0]);
    const prevState = {
      startDate: null,
      startTime: '',
      username: '',
      patientId: '',
    };
    const results = updaters.map((updater) => updater(prevState));
    expect(results).toContainEqual({ ...prevState, startTime: '10:30' });
    expect(results).toContainEqual({ ...prevState, username: 'superman' });
    expect(results).toContainEqual({ ...prevState, patientId: 'PID-1' });
  });

  it('calls runReport when the Apply button is clicked', () => {
    render(<AuditLog />);

    fireEvent.click(screen.getByTestId('audit-log-apply-button'));

    expect(baseHookState.runReport).toHaveBeenCalledTimes(1);
  });

  it('calls reset when the Reset button is clicked', () => {
    render(<AuditLog />);

    fireEvent.click(screen.getByTestId('audit-log-reset-button'));

    expect(baseHookState.reset).toHaveBeenCalledTimes(1);
  });

  it('disables Apply, Reset, and cursor pagination buttons while fetching', () => {
    mockUseAuditLogs.mockReturnValue({
      ...baseHookState,
      isFetching: true,
    });

    render(<AuditLog />);

    expect(screen.getByTestId('audit-log-apply-button')).toBeDisabled();
    expect(screen.getByTestId('audit-log-reset-button')).toBeDisabled();
    expect(screen.getByTestId('audit-log-table-next-set')).toBeDisabled();
    expect(screen.getByTestId('audit-log-table-previous-set')).toBeDisabled();
  });

  it('leaves the filter inputs enabled while fetching', () => {
    mockUseAuditLogs.mockReturnValue({
      ...baseHookState,
      isFetching: true,
    });

    render(<AuditLog />);

    expect(screen.getByTestId('audit-log-username-input')).toBeEnabled();
    expect(screen.getByTestId('audit-log-patient-id-input')).toBeEnabled();
    expect(screen.getByTestId('audit-log-start-time-input')).toBeEnabled();
  });

  it('calls next/prev via the table cursor pagination controls', () => {
    render(<AuditLog />);

    fireEvent.click(screen.getByTestId('audit-log-table-next-set'));
    expect(baseHookState.next).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('audit-log-table-previous-set'));
    expect(baseHookState.prev).toHaveBeenCalledTimes(1);
  });

  it('shows the contextual empty state message from the hook', () => {
    mockUseAuditLogs.mockReturnValue({
      ...baseHookState,
      emptyMessageKey: 'NO_EVENTS_FOUND',
    });

    render(<AuditLog />);

    expect(screen.getByText('No events found')).toBeInTheDocument();
  });

  it('shows the loading state while fetching', () => {
    mockUseAuditLogs.mockReturnValue({
      ...baseHookState,
      isLoading: true,
    });

    render(<AuditLog />);

    expect(screen.getByTestId('audit-log-table-skeleton')).toBeInTheDocument();
  });
});
