import {
  getConditionPage,
  useSubscribeConsultationSaved,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Condition } from 'fhir/r4';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import { useNotification } from '../../notification';
import ConditionsTable from '../ConditionsTable';

jest.mock('../../notification');
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
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should show conditions table when patient has conditions marked', async () => {
    mockedGetConditionPage.mockResolvedValueOnce(wrapPage([activeCondition]));
    renderComponent();
    expect(screen.getByTestId('condition-table')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Diabetes mellitus')).toBeInTheDocument();
    });
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(mockedGetConditionPage).toHaveBeenCalledTimes(1);
  });

  it('should show error state when an error occurs', async () => {
    const errorMessage = 'Failed to fetch conditions from server';
    mockedGetConditionPage.mockRejectedValueOnce(new Error(errorMessage));
    renderComponent();
    expect(screen.getByTestId('condition-table')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('conditions-table-error')).toBeInTheDocument();
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'ERROR_DEFAULT_TITLE',
        message: 'Failed to fetch conditions from server',
      });
    });
  });

  it('shows empty state when patient has no conditions', async () => {
    mockedGetConditionPage.mockResolvedValueOnce(wrapPage([]));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByTestId('conditions-table-empty')).toBeInTheDocument();
    });
  });

  it('calls service with page=1 on initial load', async () => {
    mockedGetConditionPage.mockResolvedValueOnce(wrapPage([activeCondition]));
    renderComponent();
    await waitFor(() => {
      expect(mockedGetConditionPage).toHaveBeenCalledWith(
        'test-patient-uuid',
        5,
        1,
      );
    });
  });

  it('navigates to page 2 via offset-based fetch', async () => {
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

    await user.click(screen.getByRole('button', { name: /next page/i }));

    await waitFor(() => {
      expect(screen.getByText('High blood pressure')).toBeInTheDocument();
    });

    expect(mockedGetConditionPage).toHaveBeenLastCalledWith(
      'test-patient-uuid',
      2,
      2,
    );
    expect(screen.queryByText('Diabetes mellitus')).not.toBeInTheDocument();
  });

  it('navigates back to page 1 when previous button is clicked', async () => {
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

    await user.click(screen.getByRole('button', { name: /next page/i }));
    await waitFor(() => {
      expect(screen.getByText('High blood pressure')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /previous page/i }));
    await waitFor(() => {
      expect(screen.getByText('Diabetes mellitus')).toBeInTheDocument();
    });

    expect(mockedGetConditionPage).toHaveBeenLastCalledWith(
      'test-patient-uuid',
      2,
      1,
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

    const select = screen.getByRole('combobox', { name: /items per page/i });
    await user.selectOptions(select, '5');

    await waitFor(() => {
      expect(mockedGetConditionPage).toHaveBeenCalledTimes(2);
    });

    expect(mockedGetConditionPage).toHaveBeenLastCalledWith(
      'test-patient-uuid',
      5,
      1,
    );
  });

  it('shows pagination footer but disables next when server total is fewer than or equal to pageSize', async () => {
    mockedGetConditionPage.mockResolvedValueOnce(
      wrapPage([activeCondition, inactiveCondition], 2),
    );

    renderComponent({ config: { pageSize: 10 } });

    await waitFor(() => {
      expect(screen.getByText('Diabetes mellitus')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled();
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
      screen.getByRole('button', { name: /next page/i }),
    ).toBeInTheDocument();
  });

  it('does not call the API when patientUUID is null', async () => {
    (usePatientUUID as jest.Mock).mockReturnValue(null);
    mockedGetConditionPage.mockResolvedValueOnce(wrapPage([]));

    renderComponent();

    await act(async () => {});

    expect(mockedGetConditionPage).not.toHaveBeenCalled();
  });
});
