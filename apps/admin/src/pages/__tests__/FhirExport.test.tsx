import { FhirExportTask, submitFhirExport } from '@bahmni/services';
import { useNotification, useUserPrivilege } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useFhirExportTasks } from '../../hooks/useFhirExportTasks';
import { FhirExport } from '../FhirExport';

expect.extend(toHaveNoViolations);

jest.mock('../../components/AdminLayout', () => ({
  AdminLayout: ({
    children,
    breadcrumbLabel,
  }: {
    children: React.ReactNode;
    breadcrumbLabel: string;
  }) => (
    <div data-testid="admin-layout-test-id">
      <span data-testid="current-page-crumb">{breadcrumbLabel}</span>
      {children}
    </div>
  ),
}));

jest.mock('../../hooks/useFhirExportTasks', () => ({
  ...jest.requireActual('../../hooks/useFhirExportTasks'),
  useFhirExportTasks: jest.fn(),
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  submitFhirExport: jest.fn(),
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useNotification: jest.fn(),
  useUserPrivilege: jest.fn(),
}));

// The real DatePicker wraps flatpickr, which isn't practical to drive through
// jsdom. Stub it down to buttons that invoke the same `onChange(dates)`
// callback contract so the page's wiring can be verified.
jest.mock('@bahmni/design-system', () => {
  const actual = jest.requireActual('@bahmni/design-system');
  return {
    ...actual,
    DatePicker: ({
      onChange,
      children,
    }: {
      onChange: (dates: Date[]) => void;
      children: React.ReactElement<{ id: string }>;
    }) => (
      <div>
        <button
          type="button"
          data-testid={`clear-${children.props.id}`}
          onClick={() => onChange([])}
        >
          clear
        </button>
        <button
          type="button"
          data-testid={`set-${children.props.id}`}
          onClick={() => onChange([new Date(2024, 4, 20)])}
        >
          set
        </button>
        {children}
      </div>
    ),
  };
});

const mockUseFhirExportTasks = useFhirExportTasks as jest.Mock;
const mockSubmit = submitFhirExport as jest.Mock;
const mockUseUserPrivilege = useUserPrivilege as jest.Mock;
const mockAddNotification = jest.fn();
let user: ReturnType<typeof userEvent.setup>;

const privileges = (...names: string[]) => ({
  userPrivileges: names.map((name, i) => ({ uuid: `p-${i}`, name })),
});

const task = (overrides: Partial<FhirExportTask> = {}): FhirExportTask => ({
  id: 'task-1',
  status: 'requested',
  userName: 'superman',
  anonymised: true,
  ...overrides,
});

const tasksState = (tasks: FhirExportTask[], extra = {}) => ({
  data: tasks,
  isLoading: false,
  isError: false,
  isFetching: false,
  refetch: jest.fn(),
  ...extra,
});

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
  const { container } = render(
    <QueryClientProvider client={queryClient}>
      <FhirExport />
    </QueryClientProvider>,
  );
  return { invalidate, container };
};

const clickExport = () =>
  user.click(screen.getByTestId('fhir-export-button-test-id'));

const anonymiseInput = () =>
  screen
    .getByTestId('fhir-export-anonymise-test-id')
    .closest('input') as HTMLInputElement;

describe('FhirExport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    user = userEvent.setup();
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });
    mockUseUserPrivilege.mockReturnValue(
      privileges('Export Patient Data', 'Export Non Anonymised Patient Data'),
    );
    mockUseFhirExportTasks.mockReturnValue(tasksState([]));
    mockSubmit.mockResolvedValue({
      status: 'ACCEPTED',
      taskId: 'new',
      link: '/Task/new',
    });
  });

  describe('page load', () => {
    it('renders the date pickers, export button and tasks table in the admin layout', async () => {
      mockUseFhirExportTasks.mockReturnValue(tasksState([task()]));

      renderPage();

      expect(screen.getByTestId('admin-layout-test-id')).toContainElement(
        screen.getByTestId('admin-fhir-export-page-test-id'),
      );
      expect(screen.getByTestId('current-page-crumb')).toHaveTextContent(
        'BREADCRUMB_FHIR_EXPORT',
      );
      expect(
        screen.getByTestId('fhir-export-start-date-input'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('fhir-export-end-date-input'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('fhir-export-button-test-id')).toBeEnabled();
      expect(
        screen.getByTestId('fhir-export-status-task-1-test-id'),
      ).toHaveTextContent('ADMIN_FHIR_EXPORT_STATUS_REQUESTED');
    });

    it('shows the empty state when there are no tasks', async () => {
      renderPage();

      expect(
        screen.getByText('ADMIN_FHIR_EXPORT_NO_TASKS'),
      ).toBeInTheDocument();
    });

    it('shows an error message when the tasks cannot be loaded', async () => {
      mockUseFhirExportTasks.mockReturnValue(tasksState([], { isError: true }));

      renderPage();

      expect(
        screen.getByText('ADMIN_FHIR_EXPORT_FETCH_ERROR'),
      ).toBeInTheDocument();
    });

    it('refreshes the table on demand', async () => {
      const refetch = jest.fn();
      mockUseFhirExportTasks.mockReturnValue(tasksState([], { refetch }));

      renderPage();
      await user.click(
        screen.getByTestId('fhir-export-refresh-button-test-id'),
      );

      expect(refetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('anonymisation', () => {
    it('locks the checkbox ON when the user lacks the non-anonymised privilege', async () => {
      mockUseUserPrivilege.mockReturnValue(privileges('Export Patient Data'));

      renderPage();

      expect(anonymiseInput()).toBeChecked();
      expect(anonymiseInput()).toBeDisabled();
      expect(
        screen.getByText('ADMIN_FHIR_EXPORT_ANONYMISE_LOCKED_HELPER'),
      ).toBeInTheDocument();
    });

    it('lets a user with the non-anonymised privilege toggle the checkbox', async () => {
      renderPage();

      expect(anonymiseInput()).toBeEnabled();
      expect(anonymiseInput()).toBeChecked();

      await user.click(anonymiseInput());

      expect(anonymiseInput()).not.toBeChecked();
    });
  });

  describe('privileges', () => {
    it('blocks the form and does not load tasks without any export privilege', async () => {
      mockUseUserPrivilege.mockReturnValue(privileges('app:admin'));

      renderPage();

      expect(mockUseFhirExportTasks).toHaveBeenCalledWith(false);
      expect(screen.getByTestId('fhir-export-button-test-id')).toBeDisabled();
      expect(
        screen.getByTestId('fhir-export-warning-test-id'),
      ).toHaveTextContent('ADMIN_FHIR_EXPORT_NO_PRIVILEGE');
    });

    it('allows a user holding only the plain export privilege to export', async () => {
      mockUseUserPrivilege.mockReturnValue(privileges('Export Patient Data'));

      renderPage();

      expect(mockUseFhirExportTasks).toHaveBeenCalledWith(true);
      expect(screen.getByTestId('fhir-export-button-test-id')).toBeEnabled();
    });
  });

  describe('submitting an export', () => {
    it('POSTs the default 30 day range, notifies and refreshes the table', async () => {
      const { invalidate } = renderPage();

      await clickExport();

      await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(1));
      const request = mockSubmit.mock.calls[0][0];
      expect(request.anonymise).toBe(true);
      expect(request.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(request.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(request.startDate < request.endDate).toBe(true);
      await waitFor(() =>
        expect(mockAddNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'success',
            title: 'ADMIN_FHIR_EXPORT_SUBMITTED_TITLE',
          }),
        ),
      );
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: ['fhirExportTasks'],
      });
    });

    it('sends the selected dates formatted as yyyy-MM-dd', async () => {
      renderPage();

      await user.click(screen.getByTestId('set-fhir-export-start-date'));
      await user.click(screen.getByTestId('set-fhir-export-end-date'));
      await clickExport();

      await waitFor(() =>
        expect(mockSubmit).toHaveBeenCalledWith({
          startDate: '2024-05-20',
          endDate: '2024-05-20',
          anonymise: true,
        }),
      );
    });

    it('sends anonymise=false when the privileged user unticks the checkbox', async () => {
      renderPage();

      await user.click(anonymiseInput());
      await clickExport();

      await waitFor(() =>
        expect(mockSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ anonymise: false }),
        ),
      );
    });

    it('always sends anonymise=true for a user without the non-anonymised privilege', async () => {
      mockUseUserPrivilege.mockReturnValue(privileges('Export Patient Data'));
      renderPage();

      await clickExport();

      await waitFor(() =>
        expect(mockSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ anonymise: true }),
        ),
      );
    });

    it('shows an error notification when the export request fails', async () => {
      mockSubmit.mockRejectedValue(new Error('Server error'));
      renderPage();

      await clickExport();

      await waitFor(() =>
        expect(mockAddNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            title: 'ADMIN_FHIR_EXPORT_ERROR_TITLE',
            message: 'Server error',
          }),
        ),
      );
    });
  });

  describe('date validation', () => {
    it('blocks submission and flags both date fields when no dates are set', async () => {
      renderPage();

      await user.click(screen.getByTestId('clear-fhir-export-start-date'));
      await user.click(screen.getByTestId('clear-fhir-export-end-date'));
      await clickExport();

      expect(mockSubmit).not.toHaveBeenCalled();
      expect(
        screen.getAllByText('ADMIN_FHIR_EXPORT_DATE_REQUIRED'),
      ).toHaveLength(2);
    });

    it('does not show required errors before the first submit attempt', async () => {
      renderPage();

      await user.click(screen.getByTestId('clear-fhir-export-start-date'));

      expect(
        screen.queryByText('ADMIN_FHIR_EXPORT_DATE_REQUIRED'),
      ).not.toBeInTheDocument();
    });

    it('blocks submission when the end date is before the start date', async () => {
      renderPage();

      // Picking 2024-05-20 as the end date puts it before the default start (today - 30d)
      await user.click(screen.getByTestId('set-fhir-export-end-date'));
      await clickExport();

      expect(
        screen.getByText('ADMIN_FHIR_EXPORT_DATE_RANGE_INVALID'),
      ).toBeInTheDocument();
      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });

  describe('task statuses', () => {
    it.each([
      ['accepted', 'ADMIN_FHIR_EXPORT_STATUS_ACCEPTED'],
      ['completed', 'ADMIN_FHIR_EXPORT_STATUS_COMPLETED'],
      ['failed', 'ADMIN_FHIR_EXPORT_STATUS_FAILED'],
      ['rejected', 'ADMIN_FHIR_EXPORT_STATUS_FAILED'],
    ])('renders a %s task as %s', async (status, label) => {
      mockUseFhirExportTasks.mockReturnValue(tasksState([task({ status })]));

      renderPage();

      expect(
        screen.getByTestId('fhir-export-status-task-1-test-id'),
      ).toHaveTextContent(label);
    });

    it('shows the error message of a failed task', async () => {
      mockUseFhirExportTasks.mockReturnValue(
        tasksState([task({ status: 'failed', errorMessage: 'Disk full' })]),
      );

      renderPage();

      expect(screen.getByText('Disk full')).toBeInTheDocument();
    });

    it('offers a download link only for completed tasks', async () => {
      mockUseFhirExportTasks.mockReturnValue(
        tasksState([
          task({
            id: 'done',
            status: 'completed',
            downloadUrl: 'http://host/export?file=done',
          }),
          task({ id: 'running', status: 'accepted' }),
        ]),
      );

      renderPage();

      expect(
        screen.getByTestId('fhir-export-download-done-test-id'),
      ).toHaveAttribute('href', 'http://host/export?file=done');
      expect(
        screen.queryByTestId('fhir-export-download-running-test-id'),
      ).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has no accessibility violations for a user who can export', async () => {
      mockUseFhirExportTasks.mockReturnValue(
        tasksState([
          task({
            id: 'done',
            status: 'completed',
            downloadUrl: 'http://host/export?file=done',
          }),
          task({ id: 'bad', status: 'failed', errorMessage: 'Disk full' }),
        ]),
      );
      const { container } = renderPage();

      expect(await axe(container)).toHaveNoViolations();
    });

    it('has no accessibility violations when the user lacks the privilege', async () => {
      mockUseUserPrivilege.mockReturnValue(privileges('app:admin'));
      const { container } = renderPage();

      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
