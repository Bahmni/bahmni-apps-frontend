import {
  resetEncounterSession,
  setEncounterSessionDecision,
} from '@bahmni/services';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import { useNotification } from '../../notification';
import { useHasPrivilege } from '../../userPrivileges/useHasPrivilege';
import ConditionsTable from '../ConditionsTable';

expect.extend(toHaveNoViolations);

jest.mock('../../notification');
jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(() => 'test-patient-uuid'),
}));
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getConditions: jest.fn(),
}));
jest.mock('../../userPrivileges/useHasPrivilege');

const mockAddNotification = jest.fn();

describe('ConditionsTable', () => {
  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset shared encounter session store
    resetEncounterSession();
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });
    // Default: no privilege
    (useHasPrivilege as jest.Mock).mockReturnValue(false);
  });
  afterEach(() => {
    queryClient.clear();
  });

  const renderTable = (props = {}) =>
    render(
      <QueryClientProvider client={queryClient}>
        <ConditionsTable {...props} />
      </QueryClientProvider>,
    );

  /** Helper: set up store + privilege so the Edit button will be shown */
  const setupEditEnabled = () => {
    setEncounterSessionDecision({
      reasons: ['MATCHED'],
      encounter: {
        resourceType: 'Encounter',
        id: 'enc-1',
        status: 'in-progress',
      } as any,
    });
    (useHasPrivilege as jest.Mock).mockReturnValue(true);
  };

  const buildCondition = (index: number) => ({
    code: `code-${index}`,
    codeDisplay: `Condition ${index}`,
    display: `Condition ${index}`,
    id: `condition-${index}`,
    note: undefined,
    onsetDate: '2023-01-15T10:30:00.000+00:00',
    recordedDate: '2023-01-15T10:30:00.000+00:00',
    recorder: 'Dr. Smith',
    status: 'active',
  });

  it('should show loading state when data is loading', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: null,
      error: null,
      isError: null,
      isLoading: true,
    });
    renderTable();
    expect(screen.getByTestId('condition-table')).toBeInTheDocument();
    expect(screen.getByTestId('conditions-table-skeleton')).toBeInTheDocument();
  });

  it('should show error state when an error occurs', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: null,
      error: new Error('An unexpected error occured'),
      isError: true,
      isLoading: false,
    });
    renderTable();
    expect(screen.getByTestId('condition-table')).toBeInTheDocument();
    expect(screen.getByTestId('conditions-table-error')).toBeInTheDocument();
    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'error',
      title: 'ERROR_DEFAULT_TITLE',
      message: 'An unexpected error occured',
    });
  });

  it('should show empty state when an there is no data', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: { conditions: [], total: 0 },
      error: null,
      isError: false,
      isLoading: false,
    });
    renderTable();
    expect(screen.getByTestId('condition-table')).toBeInTheDocument();
    expect(screen.getByTestId('conditions-table-empty')).toBeInTheDocument();
  });

  it('should show conditions table when an there patient has conditions marked', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: {
        conditions: [
          {
            code: '73211009',
            codeDisplay: 'Diabetes mellitus',
            display: 'Diabetes mellitus',
            id: 'condition-active-diabetes',
            note: [
              'Patient diagnosed with Type 2 diabetes',
              'Requires regular blood sugar monitoring',
            ],
            onsetDate: '2023-01-15T10:30:00.000+00:00',
            recordedDate: '2023-01-15T10:30:00.000+00:00',
            recorder: 'Dr. Smith',
            status: 'active',
          },
          {
            code: '73211008',
            codeDisplay: 'High blood pressure',
            display: 'High blood pressure',
            id: 'condition-inactive-hypertension',
            note: undefined,
            recordedDate: '2022-06-10T08:15:00.000+00:00',
            recorder: 'Dr. Johnson',
            status: 'inactive',
          },
        ],
        total: 2,
      },
      error: null,
      isError: false,
      isLoading: false,
    });
    renderTable();
    expect(screen.getByTestId('condition-table')).toBeInTheDocument();
    expect(screen.getByText('Diabetes mellitus')).toBeInTheDocument();
    const activeStatusTag = screen.getByTestId('condition-status-73211009');
    expect(activeStatusTag).toHaveTextContent('CONDITION_LIST_ACTIVE');
    expect(
      screen.getByText('CONDITION_ONSET_SINCE_FORMAT'),
    ).toBeInTheDocument();
    expect(screen.getByText('High blood pressure')).toBeInTheDocument();
    const inactiveStatusTag = screen.getByTestId('condition-status-73211008');
    expect(inactiveStatusTag).toHaveTextContent('CONDITION_LIST_INACTIVE');
    expect(
      screen.getByText('CONDITION_TABLE_NOT_AVAILABLE'),
    ).toBeInTheDocument();
  });

  describe('Pagination', () => {
    const manyConditions = Array.from({ length: 3 }, (_, i) =>
      buildCondition(i + 1),
    );

    it('renders pagination when server total exceeds pageSize', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: { conditions: manyConditions, total: 5 },
        error: null,
        isError: false,
        isLoading: false,
      });
      render(
        <QueryClientProvider client={queryClient}>
          <ConditionsTable config={{ pageSize: 1 }} />
        </QueryClientProvider>,
      );
      expect(
        screen.getByRole('button', { name: /next page/i }),
      ).toBeInTheDocument();
    });

    it('shows pagination footer but disables next when server total is fewer than or equal to pageSize', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: { conditions: manyConditions, total: 3 },
        error: null,
        isError: false,
        isLoading: false,
      });
      render(
        <QueryClientProvider client={queryClient}>
          <ConditionsTable config={{ pageSize: 10 }} />
        </QueryClientProvider>,
      );
      expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled();
    });

    it('displays the current page of conditions returned by the server', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: { conditions: manyConditions.slice(0, 2), total: 3 },
        error: null,
        isError: false,
        isLoading: false,
      });
      render(
        <QueryClientProvider client={queryClient}>
          <ConditionsTable config={{ pageSize: 2 }} />
        </QueryClientProvider>,
      );
      expect(screen.getByText('Condition 1')).toBeInTheDocument();
      expect(screen.getByText('Condition 2')).toBeInTheDocument();
      expect(screen.queryByText('Condition 3')).not.toBeInTheDocument();
    });
  });

  // ── BAH-4652: Edit button moved to DashboardSection Tile header ─────────────
  // ConditionsTable no longer renders an edit button; it lives in DashboardSection.

  it('does not render an edit button (button lives in DashboardSection header)', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: { conditions: [], total: 0 },
      error: null,
      isError: false,
      isLoading: false,
    });

    renderTable();

    expect(
      screen.queryByTestId('edit-conditions-button'),
    ).not.toBeInTheDocument();
  });

  describe('Accessibility', () => {
    it('passes accessibility tests with data', async () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: {
          conditions: [
            {
              code: '73211009',
              codeDisplay: 'Diabetes mellitus',
              display: 'Diabetes mellitus',
              id: 'condition-active-diabetes',
              note: [
                'Patient diagnosed with Type 2 diabetes',
                'Requires regular blood sugar monitoring',
              ],
              onsetDate: '2023-01-15T10:30:00.000+00:00',
              recordedDate: '2023-01-15T10:30:00.000+00:00',
              recorder: 'Dr. Smith',
              status: 'active',
            },
            {
              code: '73211008',
              codeDisplay: 'High blood pressure',
              display: 'High blood pressure',
              id: 'condition-inactive-hypertension',
              note: undefined,
              recordedDate: '2022-06-10T08:15:00.000+00:00',
              recorder: 'Dr. Johnson',
              status: 'inactive',
            },
          ],
          total: 2,
        },
        error: null,
        isError: false,
        isLoading: false,
      });
      const { container } = renderTable();
      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    it('passes accessibility tests with Edit button visible', async () => {
      setupEditEnabled();
      (useQuery as jest.Mock).mockReturnValue({
        data: { conditions: [], total: 0 },
        error: null,
        isError: false,
        isLoading: false,
      });

      const { container } = renderTable({ onEditClick: jest.fn() });

      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });
});
