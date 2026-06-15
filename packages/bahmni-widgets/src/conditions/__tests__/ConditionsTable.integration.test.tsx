import {
  getConditionPage,
  useSubscribeConsultationSaved,
  resetEncounterSession,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Condition } from 'fhir/r4';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import { useNotification } from '../../notification';
import { useHasPrivilege } from '../../userPrivileges/useHasPrivilege';
import ConditionsTable from '../ConditionsTable';

jest.mock('../../notification');
jest.mock('../../userPrivileges/useHasPrivilege');
jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(() => 'test-patient-uuid'),
}));
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: () => ({ t: (key: string) => key }),
  getConditionPage: jest.fn(),
  useSubscribeConsultationSaved: jest.fn(),
}));

const mockedGetConditionPage = getConditionPage as jest.MockedFunction<
  typeof getConditionPage
>;

const mockAddNotification = jest.fn();

const wrapPage = (conditions: Condition[], total?: number) => ({
  conditions,
  total: total ?? conditions.length,
});

const activeCondition: Condition = {
  resourceType: 'Condition',
  id: 'condition-active-diabetes',
  clinicalStatus: {
    coding: [
      {
        system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
        code: 'active',
        display: 'Active',
      },
    ],
  },
  code: {
    coding: [
      {
        system: 'http://snomed.info/sct',
        code: '73211009',
        display: 'Diabetes mellitus',
      },
    ],
    text: 'Diabetes mellitus',
  },
  subject: { reference: 'Patient/test-patient', type: 'Patient' },
  onsetDateTime: '2023-01-15T10:30:00.000+00:00',
  recordedDate: '2023-01-15T10:30:00.000+00:00',
  recorder: { reference: 'Practitioner/dr-smith', display: 'Dr. Smith' },
};

const inactiveCondition: Condition = {
  resourceType: 'Condition',
  id: 'condition-inactive-hypertension',
  clinicalStatus: {
    coding: [
      {
        system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
        code: 'inactive',
        display: 'Inactive',
      },
    ],
  },
  code: {
    coding: [
      {
        system: 'http://snomed.info/sct',
        code: '73211008',
        display: 'High blood pressure',
      },
    ],
    text: 'High blood pressure',
  },
  subject: { reference: 'Patient/test-patient', type: 'Patient' },
  recordedDate: '2022-06-10T08:15:00.000+00:00',
  recorder: { reference: 'Practitioner/dr-johnson', display: 'Dr. Johnson' },
};

describe('ConditionsTable Integration', () => {
  let queryClient: QueryClient;

  const renderComponent = (props = {}) =>
    render(
      <QueryClientProvider client={queryClient}>
        <ConditionsTable {...props} />
      </QueryClientProvider>,
    );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
        },
      },
    });
    jest.clearAllMocks();
    resetEncounterSession();
    // Restore default mock implementations that clearAllMocks doesn't reset
    (usePatientUUID as jest.Mock).mockReturnValue('test-patient-uuid');
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });
    // Default to no privilege — keeps Edit button hidden in integration tests
    (useHasPrivilege as jest.Mock).mockReturnValue(false);
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('renders Active and Inactive tab labels', async () => {
    mockedGetConditionPage.mockResolvedValueOnce(wrapPage([activeCondition]));
    renderComponent();
    // Tab labels are i18n keys when no translations are loaded
    expect(screen.getByText('CONDITION_LIST_ACTIVE_TAB')).toBeInTheDocument();
    expect(screen.getByText('CONDITION_LIST_INACTIVE_TAB')).toBeInTheDocument();
  });

  it('should show conditions table when patient has active conditions', async () => {
    mockedGetConditionPage.mockResolvedValueOnce(wrapPage([activeCondition]));
    renderComponent();
    expect(screen.getByTestId('condition-table-active')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Diabetes mellitus')).toBeInTheDocument();
    });
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
  });

  it('calls service with active clinical-status on initial load', async () => {
    mockedGetConditionPage.mockResolvedValueOnce(wrapPage([activeCondition]));
    renderComponent();
    await waitFor(() => {
      expect(mockedGetConditionPage).toHaveBeenCalledWith(
        'test-patient-uuid',
        5,
        1,
        'active',
      );
    });
  });

  it('calls service with inactive clinical-status when switching to Inactive tab', async () => {
    const user = userEvent.setup();

    // Active tab loads first
    mockedGetConditionPage.mockResolvedValueOnce(wrapPage([activeCondition]));
    // Inactive tab loads when clicked
    mockedGetConditionPage.mockResolvedValueOnce(wrapPage([inactiveCondition]));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Diabetes mellitus')).toBeInTheDocument();
    });

    const inactiveTab = screen.getByText('CONDITION_LIST_INACTIVE_TAB');
    await user.click(inactiveTab);

    await waitFor(() => {
      expect(screen.getByText('High blood pressure')).toBeInTheDocument();
    });

    expect(mockedGetConditionPage).toHaveBeenCalledWith(
      'test-patient-uuid',
      5,
      1,
      'inactive',
    );
  });

  it('shows empty state for active tab when no active conditions exist', async () => {
    mockedGetConditionPage.mockResolvedValueOnce(wrapPage([]));
    renderComponent();
    await waitFor(() => {
      expect(
        screen.getByTestId('conditions-table-active-empty'),
      ).toBeInTheDocument();
    });
    // Empty state message should be specific to active tab
    expect(
      screen.getByText('CONDITION_LIST_NO_ACTIVE_CONDITIONS'),
    ).toBeInTheDocument();
  });

  it('shows empty state for inactive tab when no inactive conditions exist', async () => {
    const user = userEvent.setup();

    mockedGetConditionPage.mockResolvedValueOnce(wrapPage([activeCondition]));
    mockedGetConditionPage.mockResolvedValueOnce(wrapPage([]));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Diabetes mellitus')).toBeInTheDocument();
    });

    const inactiveTab = screen.getByText('CONDITION_LIST_INACTIVE_TAB');
    await user.click(inactiveTab);

    await waitFor(() => {
      expect(
        screen.getByText('CONDITION_LIST_NO_INACTIVE_CONDITIONS'),
      ).toBeInTheDocument();
    });
  });

  it('should show error state when an error occurs on active tab', async () => {
    const errorMessage = 'Failed to fetch conditions from server';
    mockedGetConditionPage.mockRejectedValueOnce(new Error(errorMessage));
    renderComponent();
    expect(screen.getByTestId('condition-table-active')).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.getByTestId('conditions-table-active-error'),
      ).toBeInTheDocument();
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'ERROR_DEFAULT_TITLE',
        message: 'Failed to fetch conditions from server',
      });
    });
  });

  it('does not call the API when patientUUID is null', async () => {
    // Override just for this test — beforeEach restores it to 'test-patient-uuid'
    (usePatientUUID as jest.Mock).mockReturnValue(null);
    // Do NOT set up a mock response — if the API were called, it would fail with no mock available.

    renderComponent();

    await act(async () => {});

    expect(mockedGetConditionPage).not.toHaveBeenCalled();
  });

  it('navigates to page 2 via offset-based fetch on Active tab', async () => {
    const user = userEvent.setup();

    mockedGetConditionPage.mockResolvedValueOnce(
      wrapPage([activeCondition], 4),
    );
    mockedGetConditionPage.mockResolvedValueOnce(
      wrapPage([inactiveCondition], 4),
    );

    renderComponent({ config: { pageSize: 2 } });

    await waitFor(() => {
      expect(screen.getByText('Diabetes mellitus')).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole('button', { name: /next page/i })[0]);

    await waitFor(() => {
      expect(screen.getByText('High blood pressure')).toBeInTheDocument();
    });

    expect(mockedGetConditionPage).toHaveBeenLastCalledWith(
      'test-patient-uuid',
      2,
      2,
      'active',
    );
    expect(screen.queryByText('Diabetes mellitus')).not.toBeInTheDocument();
  });

  it('navigates back to page 1 when previous button is clicked on Active tab', async () => {
    const user = userEvent.setup();

    mockedGetConditionPage.mockResolvedValueOnce(
      wrapPage([activeCondition], 4),
    );
    mockedGetConditionPage.mockResolvedValueOnce(
      wrapPage([inactiveCondition], 4),
    );
    mockedGetConditionPage.mockResolvedValueOnce(
      wrapPage([activeCondition], 4),
    );

    renderComponent({ config: { pageSize: 2 } });

    await waitFor(() => {
      expect(screen.getByText('Diabetes mellitus')).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole('button', { name: /next page/i })[0]);
    await waitFor(() => {
      expect(screen.getByText('High blood pressure')).toBeInTheDocument();
    });

    await user.click(
      screen.getAllByRole('button', { name: /previous page/i })[0],
    );
    await waitFor(() => {
      expect(screen.getByText('Diabetes mellitus')).toBeInTheDocument();
    });

    expect(mockedGetConditionPage).toHaveBeenLastCalledWith(
      'test-patient-uuid',
      2,
      1,
      'active',
    );
  });

  it('re-fetches from page 1 when page size is changed', async () => {
    const user = userEvent.setup();

    mockedGetConditionPage.mockResolvedValueOnce(
      wrapPage([activeCondition], 4),
    );
    mockedGetConditionPage.mockResolvedValueOnce(
      wrapPage([activeCondition, inactiveCondition], 4),
    );

    renderComponent({ config: { pageSize: 2 } });

    await waitFor(() => {
      expect(screen.getByText('Diabetes mellitus')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox', {
      name: /items per page/i,
    });
    await user.selectOptions(selects[0], '5');

    await waitFor(() => {
      expect(mockedGetConditionPage).toHaveBeenCalledTimes(2);
    });

    expect(mockedGetConditionPage).toHaveBeenLastCalledWith(
      'test-patient-uuid',
      5,
      1,
      'active',
    );
  });

  it('shows pagination footer but disables next when server total is fewer than or equal to pageSize', async () => {
    mockedGetConditionPage.mockResolvedValueOnce(
      wrapPage([activeCondition], 1),
    );

    renderComponent({ config: { pageSize: 10 } });

    await waitFor(() => {
      expect(screen.getByText('Diabetes mellitus')).toBeInTheDocument();
    });

    expect(
      screen.getAllByRole('button', { name: /next page/i })[0],
    ).toBeDisabled();
  });

  it('shows pagination when server total exceeds pageSize', async () => {
    mockedGetConditionPage.mockResolvedValueOnce(
      wrapPage([activeCondition], 5),
    );

    renderComponent({ config: { pageSize: 2 } });

    await waitFor(() => {
      expect(screen.getByText('Diabetes mellitus')).toBeInTheDocument();
    });

    expect(
      screen.getAllByRole('button', { name: /next page/i })[0],
    ).toBeInTheDocument();
  });

  it('does not fire inactive query on initial mount (lazy loading)', async () => {
    mockedGetConditionPage.mockResolvedValueOnce(wrapPage([activeCondition]));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Diabetes mellitus')).toBeInTheDocument();
    });

    // Only the active query should have fired
    expect(mockedGetConditionPage).toHaveBeenCalledTimes(1);
    expect(mockedGetConditionPage).toHaveBeenCalledWith(
      'test-patient-uuid',
      5,
      1,
      'active',
    );
  });
});
