import {
  resetEncounterSession,
  setEncounterSessionDecision,
  markConditionAsInactive,
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
  markConditionAsInactive: jest.fn(),
}));
jest.mock('../../userPrivileges/useHasPrivilege');

const mockAddNotification = jest.fn();

/** Build a mock useQuery return value for both tabs */
const makeQueryReturn = (activeReturn: object, inactiveReturn: object) =>
  (useQuery as jest.Mock).mockImplementation((opts: { queryKey: unknown[] }) =>
    opts.queryKey[2] === 'active' ? activeReturn : inactiveReturn,
  );

/** Default empty returns for both tabs */
const emptyReturn = {
  data: { conditions: [], total: 0 },
  error: null,
  isError: false,
  isLoading: false,
  refetch: jest.fn().mockResolvedValue(undefined),
};

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
    // Default: both tabs return empty
    makeQueryReturn(emptyReturn, emptyReturn);
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
    makeQueryReturn(
      {
        data: null,
        error: null,
        isError: null,
        isLoading: true,
        refetch: jest.fn(),
      },
      {
        data: null,
        error: null,
        isError: null,
        isLoading: false,
        refetch: jest.fn(),
      },
    );
    renderTable();
    expect(screen.getByTestId('condition-table')).toBeInTheDocument();
    expect(
      screen.getByTestId('conditions-active-table-skeleton'),
    ).toBeInTheDocument();
  });

  it('should show error state when an error occurs', () => {
    makeQueryReturn(
      {
        data: null,
        error: new Error('An unexpected error occured'),
        isError: true,
        isLoading: false,
        refetch: jest.fn(),
      },
      emptyReturn,
    );
    renderTable();
    expect(screen.getByTestId('condition-table')).toBeInTheDocument();
    expect(
      screen.getByTestId('conditions-active-table-error'),
    ).toBeInTheDocument();
    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'error',
      title: 'ERROR_DEFAULT_TITLE',
      message: 'An unexpected error occured',
    });
  });

  it('should show empty state when there is no data', () => {
    makeQueryReturn(emptyReturn, emptyReturn);
    renderTable();
    expect(screen.getByTestId('condition-table')).toBeInTheDocument();
    expect(
      screen.getByTestId('conditions-active-table-empty'),
    ).toBeInTheDocument();
  });

  it('should show conditions table when patient has active conditions', () => {
    makeQueryReturn(
      {
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
          ],
          total: 1,
        },
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn(),
      },
      emptyReturn,
    );
    renderTable();
    expect(screen.getByTestId('condition-table')).toBeInTheDocument();
    expect(screen.getByText('Diabetes mellitus')).toBeInTheDocument();
    const activeStatusTag = screen.getByTestId('condition-status-73211009');
    expect(activeStatusTag).toHaveTextContent('CONDITION_LIST_ACTIVE');
    expect(
      screen.getByText('CONDITION_ONSET_SINCE_FORMAT'),
    ).toBeInTheDocument();
  });

  it('should show inactive conditions in inactive tab', async () => {
    const user = userEvent.setup();
    makeQueryReturn(emptyReturn, {
      data: {
        conditions: [
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
        total: 1,
      },
      error: null,
      isError: false,
      isLoading: false,
      refetch: jest.fn(),
    });
    renderTable();

    // Switch to inactive tab
    const inactiveTab = screen.getByText('CONDITION_TAB_INACTIVE');
    await user.click(inactiveTab);

    expect(screen.getByText('High blood pressure')).toBeInTheDocument();
    const inactiveStatusTag = screen.getByTestId('condition-status-73211008');
    expect(inactiveStatusTag).toHaveTextContent('CONDITION_LIST_INACTIVE');
    expect(
      screen.getByText('CONDITION_TABLE_NOT_AVAILABLE'),
    ).toBeInTheDocument();
  });

  describe('Tab behaviour', () => {
    it('Default tab is Active: active table is visible and active tab is selected', () => {
      makeQueryReturn(
        {
          data: { conditions: [buildCondition(1)], total: 1 },
          error: null,
          isError: false,
          isLoading: false,
          refetch: jest.fn(),
        },
        emptyReturn,
      );
      renderTable();

      // Active table should be rendered
      expect(screen.getByTestId('conditions-active-table')).toBeInTheDocument();
      // Active tab label visible
      expect(screen.getByText('CONDITION_TAB_ACTIVE')).toBeInTheDocument();
    });

    it('Switch to Inactive tab: inactive table data appears', async () => {
      const user = userEvent.setup();
      makeQueryReturn(
        {
          data: { conditions: [buildCondition(1)], total: 1 },
          error: null,
          isError: false,
          isLoading: false,
          refetch: jest.fn(),
        },
        {
          data: {
            conditions: [{ ...buildCondition(2), status: 'inactive' }],
            total: 1,
          },
          error: null,
          isError: false,
          isLoading: false,
          refetch: jest.fn(),
        },
      );
      renderTable();

      const inactiveTab = screen.getByText('CONDITION_TAB_INACTIVE');
      await user.click(inactiveTab);

      expect(
        screen.getByTestId('conditions-inactive-table'),
      ).toBeInTheDocument();
      expect(screen.getByText('Condition 2')).toBeInTheDocument();
    });

    it('Empty inactive state: switching to Inactive tab shows the inactive empty-state message', async () => {
      const user = userEvent.setup();
      makeQueryReturn(emptyReturn, emptyReturn);
      renderTable();

      const inactiveTab = screen.getByText('CONDITION_TAB_INACTIVE');
      await user.click(inactiveTab);

      expect(
        screen.getByTestId('conditions-inactive-table-empty'),
      ).toBeInTheDocument();
      // The empty-state message key for inactive tab
      expect(
        screen.getByText('CONDITION_LIST_NO_INACTIVE_CONDITIONS'),
      ).toBeInTheDocument();
    });

    // Pagination independence: each tab has its own page state (state is internal
    // React state, so we can't directly assert page values via mock). We assert
    // that each tab renders its own SortableDataTable with its own dataTestId.
    it('Each tab renders its own SortableDataTable with independent test IDs', () => {
      makeQueryReturn(
        {
          data: { conditions: [buildCondition(1)], total: 5 },
          error: null,
          isError: false,
          isLoading: false,
          refetch: jest.fn(),
        },
        {
          data: {
            conditions: [{ ...buildCondition(2), status: 'inactive' }],
            total: 3,
          },
          error: null,
          isError: false,
          isLoading: false,
          refetch: jest.fn(),
        },
      );
      renderTable();

      // Both tables are in the DOM (Carbon Tabs renders all panels but only shows the active one visually)
      expect(screen.getByTestId('conditions-active-table')).toBeInTheDocument();
      expect(
        screen.getByTestId('conditions-inactive-table'),
      ).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    const manyConditions = Array.from({ length: 3 }, (_, i) =>
      buildCondition(i + 1),
    );

    it('renders pagination when server total exceeds pageSize', () => {
      makeQueryReturn(
        {
          data: { conditions: manyConditions, total: 5 },
          error: null,
          isError: false,
          isLoading: false,
          refetch: jest.fn(),
        },
        emptyReturn,
      );
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
      makeQueryReturn(
        {
          data: { conditions: manyConditions, total: 3 },
          error: null,
          isError: false,
          isLoading: false,
          refetch: jest.fn(),
        },
        emptyReturn,
      );
      render(
        <QueryClientProvider client={queryClient}>
          <ConditionsTable config={{ pageSize: 10 }} />
        </QueryClientProvider>,
      );
      expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled();
    });

    it('displays the current page of conditions returned by the server', () => {
      makeQueryReturn(
        {
          data: { conditions: manyConditions.slice(0, 2), total: 3 },
          error: null,
          isError: false,
          isLoading: false,
          refetch: jest.fn(),
        },
        emptyReturn,
      );
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
    makeQueryReturn(emptyReturn, emptyReturn);

    renderTable();

    expect(
      screen.queryByTestId('edit-conditions-button'),
    ).not.toBeInTheDocument();
  });

  describe('Accessibility', () => {
    it('passes accessibility tests with data', async () => {
      makeQueryReturn(
        {
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
            ],
            total: 1,
          },
          error: null,
          isError: false,
          isLoading: false,
          refetch: jest.fn(),
        },
        {
          data: {
            conditions: [
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
            total: 1,
          },
          error: null,
          isError: false,
          isLoading: false,
          refetch: jest.fn(),
        },
      );
      const { container } = renderTable();
      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    it('passes accessibility tests with Edit button visible', async () => {
      setupEditEnabled();
      makeQueryReturn(emptyReturn, emptyReturn);

      const { container } = renderTable({ onEditClick: jest.fn() });

      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });

  describe('Actions column — Mark as inactive ghost button and ConfirmationModal', () => {
    const actionsConfig = {
      actions: [
        {
          label: 'Actions',
          type: 'actions',
          requiredPrivilege: ['Edit Conditions'],
        },
      ],
    };

    const activeCondition = buildCondition(1);
    const inactiveCondition = { ...buildCondition(2), status: 'inactive' };

    const setupWithConditions = (
      conditions: ReturnType<typeof buildCondition>[],
    ) => {
      (useHasPrivilege as jest.Mock).mockReturnValue(true);
      makeQueryReturn(
        {
          data: { conditions, total: conditions.length },
          error: null,
          isError: false,
          isLoading: false,
          refetch: jest.fn().mockResolvedValue(undefined),
        },
        emptyReturn,
      );
    };

    it('"Mark as inactive" ghost button renders when showActions is true and condition is active', () => {
      setupWithConditions([activeCondition]);
      renderTable({ config: actionsConfig });

      expect(
        screen.getByTestId(`condition-mark-inactive-${activeCondition.code}`),
      ).toBeInTheDocument();
    });

    it('"Mark as inactive" button is disabled when condition is inactive', () => {
      setupWithConditions([inactiveCondition]);
      renderTable({ config: actionsConfig });

      expect(
        screen.getByTestId(`condition-mark-inactive-${inactiveCondition.code}`),
      ).toBeDisabled();
    });

    it('"Mark as inactive" button is disabled when disableActions is true', () => {
      setupWithConditions([activeCondition]);
      renderTable({ config: actionsConfig, disableActions: true });

      expect(
        screen.getByTestId(`condition-mark-inactive-${activeCondition.code}`),
      ).toBeDisabled();
    });

    it('ConfirmationModal is not visible initially (Carbon modal is in DOM but lacks is-visible class)', () => {
      setupWithConditions([activeCondition]);
      renderTable({ config: actionsConfig });

      // Carbon Modal always renders in DOM; open={false} means it lacks the is-visible class
      const modal = screen.getByTestId('mark-inactive-confirm-modal');
      expect(modal).not.toHaveClass('is-visible');
    });

    it('Clicking "Mark as inactive" button opens the ConfirmationModal', async () => {
      const user = userEvent.setup();
      setupWithConditions([activeCondition]);
      renderTable({ config: actionsConfig });

      // Modal is in DOM but not visible yet
      expect(screen.getByTestId('mark-inactive-confirm-modal')).not.toHaveClass(
        'is-visible',
      );

      await user.click(
        screen.getByTestId(`condition-mark-inactive-${activeCondition.code}`),
      );

      // After click, modal should now be visible
      expect(screen.getByTestId('mark-inactive-confirm-modal')).toHaveClass(
        'is-visible',
      );
    });

    it('markConditionAsInactive is called when user confirms in modal', async () => {
      const user = userEvent.setup();
      const rawFhirResource = {
        resourceType: 'Condition' as const,
        id: 'cond-1',
        clinicalStatus: {
          coding: [{ code: 'active' }],
        },
      };
      const conditionWithRaw = {
        ...activeCondition,
        rawFhirResource,
      };
      (useHasPrivilege as jest.Mock).mockReturnValue(true);
      makeQueryReturn(
        {
          data: { conditions: [conditionWithRaw], total: 1 },
          error: null,
          isError: false,
          isLoading: false,
          refetch: jest.fn().mockResolvedValue(undefined),
        },
        emptyReturn,
      );
      (markConditionAsInactive as jest.Mock).mockResolvedValueOnce(
        rawFhirResource,
      );

      renderTable({ config: actionsConfig });

      // Open the modal
      await user.click(
        screen.getByTestId(`condition-mark-inactive-${conditionWithRaw.code}`),
      );

      // Click confirm (primary button in the modal)
      const confirmButton = screen.getByRole('button', { name: /YES/i });
      await user.click(confirmButton);

      expect(markConditionAsInactive).toHaveBeenCalledWith(rawFhirResource);
    });

    it('Modal closes after confirmation', async () => {
      const user = userEvent.setup();
      const rawFhirResource = {
        resourceType: 'Condition' as const,
        id: 'cond-1',
        clinicalStatus: {
          coding: [{ code: 'active' }],
        },
      };
      const conditionWithRaw = {
        ...activeCondition,
        rawFhirResource,
      };
      (useHasPrivilege as jest.Mock).mockReturnValue(true);
      makeQueryReturn(
        {
          data: { conditions: [conditionWithRaw], total: 1 },
          error: null,
          isError: false,
          isLoading: false,
          refetch: jest.fn().mockResolvedValue(undefined),
        },
        emptyReturn,
      );
      (markConditionAsInactive as jest.Mock).mockResolvedValueOnce(
        rawFhirResource,
      );

      renderTable({ config: actionsConfig });

      // Open modal by clicking button
      await user.click(
        screen.getByTestId(`condition-mark-inactive-${conditionWithRaw.code}`),
      );
      expect(screen.getByTestId('mark-inactive-confirm-modal')).toHaveClass(
        'is-visible',
      );

      // Confirm the action
      const confirmButton = screen.getByRole('button', { name: /YES/i });
      await user.click(confirmButton);

      // After async operation, modal should close (lose is-visible class)
      await act(async () => {});

      expect(screen.getByTestId('mark-inactive-confirm-modal')).not.toHaveClass(
        'is-visible',
      );
    });
  });
});
