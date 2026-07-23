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
import { render, screen, within, act, waitFor } from '@testing-library/react';
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

/**
 * Default query result for any tab. Used by most tests.
 * When useQuery is mocked globally it returns the same result for both
 * Active and Inactive tab queries.
 */
const defaultQueryResult = {
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
    // Default useQuery mock
    (useQuery as jest.Mock).mockReturnValue(defaultQueryResult);
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

  it('should render Active and Inactive tabs', () => {
    renderTable();
    // Tab labels are i18n keys (no locale loaded in unit tests)
    expect(screen.getByText('CONDITION_LIST_ACTIVE_TAB')).toBeInTheDocument();
    expect(screen.getByText('CONDITION_LIST_INACTIVE_TAB')).toBeInTheDocument();
  });

  it('should show loading state on active tab when data is loading', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: null,
      error: null,
      isError: null,
      isLoading: true,
    });
    renderTable();
    expect(screen.getByTestId('condition-table-active')).toBeInTheDocument();
    expect(
      screen.getByTestId('conditions-table-active-skeleton'),
    ).toBeInTheDocument();
  });

  it('should show error state on active tab when an error occurs', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: null,
      error: new Error('An unexpected error occured'),
      isError: true,
      isLoading: false,
    });
    renderTable();
    expect(screen.getByTestId('condition-table-active')).toBeInTheDocument();
    expect(
      screen.getByTestId('conditions-table-active-error'),
    ).toBeInTheDocument();
    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'error',
      title: 'ERROR_DEFAULT_TITLE',
      message: 'An unexpected error occured',
    });
  });

  it('should show empty state for active tab when there are no active conditions', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: { conditions: [], total: 0 },
      error: null,
      isError: false,
      isLoading: false,
    });
    renderTable();
    expect(screen.getByTestId('condition-table-active')).toBeInTheDocument();
    expect(
      screen.getByTestId('conditions-table-active-empty'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('CONDITION_LIST_NO_ACTIVE_CONDITIONS'),
    ).toBeInTheDocument();
  });

  it('should show conditions table when patient has active conditions', () => {
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
        ],
        total: 1,
      },
      error: null,
      isError: false,
      isLoading: false,
    });
    renderTable();
    const activePanel = screen.getByTestId('condition-table-active');
    expect(activePanel).toBeInTheDocument();
    // Scope queries to the active panel to avoid picking up the hidden inactive panel
    expect(
      within(activePanel).getByText('Diabetes mellitus'),
    ).toBeInTheDocument();
    const activeStatusTag = within(activePanel).getByTestId(
      'condition-status-73211009',
    );
    expect(activeStatusTag).toHaveTextContent('CONDITION_LIST_ACTIVE');
    expect(
      within(activePanel).getByText('CONDITION_ONSET_SINCE_FORMAT'),
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
      // Both tabs show pagination; get the first visible one
      expect(
        screen.getAllByRole('button', { name: /next page/i })[0],
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
      const nextButtons = screen.getAllByRole('button', {
        name: /next page/i,
      });
      expect(nextButtons[0]).toBeDisabled();
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
      // Scope to the active panel to avoid hidden inactive panel duplicates
      const activePanel = screen.getByTestId('condition-table-active');
      expect(within(activePanel).getByText('Condition 1')).toBeInTheDocument();
      expect(within(activePanel).getByText('Condition 2')).toBeInTheDocument();
      expect(
        within(activePanel).queryByText('Condition 3'),
      ).not.toBeInTheDocument();
    });
  });

  it('does not render an edit button (button lives in DashboardSection header)', () => {
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
          ],
          total: 1,
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
      (useQuery as jest.Mock).mockReturnValue(defaultQueryResult);

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
      (useQuery as jest.Mock).mockReturnValue({
        data: { conditions, total: conditions.length },
        error: null,
        isError: false,
        isLoading: false,
      });
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
      const activeEncounterObj = {
        resourceType: 'Encounter' as const,
        id: 'enc-1',
        status: 'in-progress' as const,
      };
      (useHasPrivilege as jest.Mock).mockReturnValue(true);
      (useQuery as jest.Mock).mockReturnValue({
        data: { conditions: [conditionWithRaw], total: 1 },
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn().mockResolvedValue(undefined),
      });
      (markConditionAsInactive as jest.Mock).mockResolvedValueOnce(
        rawFhirResource,
      );

      renderTable({
        config: actionsConfig,
        activeEncounter: activeEncounterObj,
        activeEncounterMatched: true,
      });

      // Open the modal
      await user.click(
        screen.getByTestId(`condition-mark-inactive-${conditionWithRaw.code}`),
      );

      // Click confirm (primary button in the modal)
      const confirmButton = screen.getByRole('button', { name: /YES/i });
      await user.click(confirmButton);

      expect(markConditionAsInactive).toHaveBeenCalledWith(
        rawFhirResource,
        activeEncounterObj,
        true,
      );
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
      (useQuery as jest.Mock).mockReturnValue({
        data: { conditions: [conditionWithRaw], total: 1 },
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn().mockResolvedValue(undefined),
      });
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
