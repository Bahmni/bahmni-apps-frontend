import { submitFhirExport, getFhirExportTasks } from '@bahmni/services';
import { useNotification, useUserPrivilege } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  AdminLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// Uses the real DatePicker (flatpickr) to cover manual clearing of a date.
describe('FhirExport date inputs (real DatePicker)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: jest.fn(),
    });
    (useUserPrivilege as jest.Mock).mockReturnValue({
      userPrivileges: [{ name: 'Export Patient Data' }],
      isLoading: false,
      error: null,
    });
    (getFhirExportTasks as jest.Mock).mockResolvedValue([]);
    (submitFhirExport as jest.Mock).mockResolvedValue(undefined);
  });

  it('blocks submission after a date is cleared by typing and leaving the field', async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <FhirExport />
      </QueryClientProvider>,
    );
    const start = screen.getByTestId('fhir-export-start-date-input');
    const end = screen.getByTestId('fhir-export-end-date-input');

    await user.type(start, '01/04/2024');
    await user.type(end, '30/04/2024');
    await user.clear(start);
    await user.tab();
    await user.clear(end);
    await user.tab();

    await user.click(screen.getByTestId('fhir-export-button-test-id'));

    await waitFor(() =>
      expect(
        screen.getByText('Please select a start date.'),
      ).toBeInTheDocument(),
    );
    expect(submitFhirExport).not.toHaveBeenCalled();
  });
});
