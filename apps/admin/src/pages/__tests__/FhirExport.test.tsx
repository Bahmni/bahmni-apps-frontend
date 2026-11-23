import {
  FhirExportTask,
  getFhirExportTasks,
  logAuditEvent,
  submitFhirExport,
} from '@bahmni/services';
import { useNotification, useUserPrivilege } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FhirExport } from '../FhirExport';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getFhirExportTasks: jest.fn(),
  submitFhirExport: jest.fn(),
  logAuditEvent: jest.fn(),
}));

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useNotification: jest.fn(),
  useUserPrivilege: jest.fn(),
}));

jest.mock('../../components/AdminLayout', () => ({
  AdminLayout: ({
    children,
    breadcrumbLabel,
  }: {
    children: React.ReactNode;
    breadcrumbLabel?: string;
  }) => (
    <div data-testid="admin-layout-test-id">
      <span data-testid="current-page-crumb">{breadcrumbLabel}</span>
      {children}
    </div>
  ),
}));

// The real DatePicker wraps flatpickr, which isn't practical to drive through
// jsdom. Each stub exposes a button that calls the same `onChange(dates)`
// contract; the picked date comes from the button's `data-date` attribute.
jest.mock('@bahmni/design-system', () => {
  const actual = jest.requireActual('@bahmni/design-system');
  return {
    ...actual,
    DatePicker: ({
      onChange,
      children,
    }: {
      onChange: (dates: Date[]) => void;
      children: React.ReactElement;
    }) => (
      <div>
        <button
          type="button"
          data-testid={`pick-${children.props.id}`}
          onClick={(event) => {
            const value = (event.target as HTMLElement).getAttribute(
              'data-date',
            );
            onChange(value ? [new Date(value)] : []);
          }}
        >
          pick
        </button>
        {children}
      </div>
    ),
  };
});

const mockAddNotification = jest.fn();
const mockGetTasks = getFhirExportTasks as jest.Mock;
const mockSubmit = submitFhirExport as jest.Mock;
const mockLogAudit = logAuditEvent as jest.Mock;

const EXPORT_PRIVILEGE = { name: 'Export Patient Data' };
const PLAIN_PRIVILEGE = { name: 'Export Non Anonymised Patient Data' };

const buildTask = (
  overrides: Partial<FhirExportTask> = {},
): FhirExportTask => ({
  id: 'task-1',
  userName: 'superman',
  triggeredDate: '2024-05-01T10:00:00.000Z',
  startDate: '2024-04-01',
  endDate: '2024-04-30',
  anonymised: true,
  status: 'completed',
  downloadUrl: 'http://files/export.zip',
  ...overrides,
});

const setPrivileges = (...privileges: { name: string }[]) =>
  (useUserPrivilege as jest.Mock).mockReturnValue({
    userPrivileges: privileges,
    isLoading: false,
    error: null,
  });

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <FhirExport />
    </QueryClientProvider>,
  );
};

const pick = (inputId: string, date: string) => {
  const button = screen.getByTestId(`pick-${inputId}`);
  button.setAttribute('data-date', date);
  fireEvent.click(button);
};

const submit = () =>
  fireEvent.click(screen.getByTestId('fhir-export-button-test-id'));

describe('FhirExport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });
    setPrivileges(EXPORT_PRIVILEGE);
    mockGetTasks.mockResolvedValue([]);
    mockSubmit.mockResolvedValue(undefined);
    mockLogAudit.mockResolvedValue({ logged: true });
  });

  it('renders the form and the export requests table in the admin layout', async () => {
    renderPage();

    expect(screen.getByTestId('admin-layout-test-id')).toContainElement(
      screen.getByTestId('admin-fhir-export-page-test-id'),
    );
    expect(screen.getByTestId('current-page-crumb')).toHaveTextContent(
      'FHIR Export',
    );
    expect(screen.getByText('Patient Data Bulk FHIR Export')).toBeVisible();
    expect(screen.getByTestId('fhir-export-button-test-id')).toBeEnabled();
    expect(
      await screen.findByText('No export requests found'),
    ).toBeInTheDocument();
  });

  it('lists the export requests with a download link only when available', async () => {
    mockGetTasks.mockResolvedValue([
      buildTask(),
      buildTask({
        id: 'task-2',
        userName: 'batman',
        status: 'in-progress',
        downloadUrl: undefined,
        anonymised: false,
      }),
    ]);

    renderPage();

    expect(await screen.findByText('superman')).toBeInTheDocument();
    expect(screen.getByText('batman')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('In progress')).toBeInTheDocument();
    const links = screen.getAllByRole('link', { name: 'Download' });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', 'http://files/export.zip');
  });

  it('shows the failure reason of a failed export', async () => {
    mockGetTasks.mockResolvedValue([
      buildTask({
        status: 'failed',
        downloadUrl: undefined,
        statusReason: 'Out of memory',
      }),
    ]);

    renderPage();

    expect(await screen.findByText('Failed')).toBeInTheDocument();
    expect(screen.getByTestId('fhir-export-failure-reason')).toHaveTextContent(
      'Out of memory',
    );
  });

  it('shows an error when the export requests cannot be loaded', async () => {
    mockGetTasks.mockRejectedValue(new Error('boom'));

    renderPage();

    expect(
      await screen.findByText('Failed to load export requests'),
    ).toBeInTheDocument();
  });

  describe('privileges', () => {
    it('disables the form and skips loading tasks without an export privilege', () => {
      setPrivileges({ name: 'app:admin' });

      renderPage();

      expect(
        screen.getByTestId('fhir-export-no-privilege-test-id'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('fhir-export-button-test-id')).toBeDisabled();
      expect(mockGetTasks).not.toHaveBeenCalled();
    });

    it('keeps anonymise checked and locked without the plain export privilege', () => {
      renderPage();

      const checkbox = screen.getByRole('checkbox', { name: 'Anonymise' });
      expect(checkbox).toBeChecked();
      expect(checkbox).toBeDisabled();
    });

    it('lets users with the plain export privilege untick anonymise', async () => {
      setPrivileges(PLAIN_PRIVILEGE);
      renderPage();

      const checkbox = screen.getByRole('checkbox', { name: 'Anonymise' });
      expect(checkbox).toBeEnabled();
      fireEvent.click(checkbox);
      pick('fhir-export-start-date', '2024-04-01T00:00:00');
      pick('fhir-export-end-date', '2024-04-30T00:00:00');
      submit();

      await waitFor(() =>
        expect(mockSubmit).toHaveBeenCalledWith({
          startDate: '2024-04-01',
          endDate: '2024-04-30',
          anonymise: false,
        }),
      );
    });
  });

  describe('submitting', () => {
    it('requires both dates before submitting', () => {
      renderPage();

      submit();

      expect(screen.getByText('Please select a start date.')).toBeVisible();
      expect(screen.getByText('Please select an end date.')).toBeVisible();
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('rejects a start date after the end date', () => {
      renderPage();

      pick('fhir-export-start-date', '2024-05-10T00:00:00');
      pick('fhir-export-end-date', '2024-05-01T00:00:00');
      submit();

      expect(
        screen.getByText('Start date must not be after the end date.'),
      ).toBeVisible();
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('submits an anonymised export, audits it, notifies and refreshes the list', async () => {
      renderPage();
      await screen.findByText('No export requests found');

      pick('fhir-export-start-date', '2024-04-01T00:00:00');
      pick('fhir-export-end-date', '2024-04-30T00:00:00');
      submit();

      await waitFor(() =>
        expect(mockSubmit).toHaveBeenCalledWith({
          startDate: '2024-04-01',
          endDate: '2024-04-30',
          anonymise: true,
        }),
      );
      await waitFor(() =>
        expect(mockAddNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'success',
            title: 'Export requested',
          }),
        ),
      );
      expect(mockLogAudit).toHaveBeenCalledWith(
        undefined,
        'PATIENT_DATA_BULK_EXPORT',
        {
          startDate: '2024-04-01',
          endDate: '2024-04-30',
          exportMode: 'Anonymized',
        },
        'MODULE_LABEL_EXPORT_KEY',
      );
      await waitFor(() => expect(mockGetTasks).toHaveBeenCalledTimes(2));
    });

    it('still reports success when writing the audit entry fails', async () => {
      mockLogAudit.mockRejectedValue(new Error('audit down'));
      renderPage();

      pick('fhir-export-start-date', '2024-04-01T00:00:00');
      pick('fhir-export-end-date', '2024-04-30T00:00:00');
      submit();

      await waitFor(() =>
        expect(mockAddNotification).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'success' }),
        ),
      );
    });

    it('shows an error notification and no audit entry when the request fails', async () => {
      mockSubmit.mockRejectedValue(new Error('server down'));
      renderPage();

      pick('fhir-export-start-date', '2024-04-01T00:00:00');
      pick('fhir-export-end-date', '2024-04-30T00:00:00');
      submit();

      await waitFor(() =>
        expect(mockAddNotification).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'error', title: 'Export failed' }),
        ),
      );
      expect(mockLogAudit).not.toHaveBeenCalled();
    });
  });
});
