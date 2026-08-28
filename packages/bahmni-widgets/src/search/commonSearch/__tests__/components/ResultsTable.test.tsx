import { generateUUID, useTranslation } from '@bahmni/services';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import jsonata from 'jsonata';
import { UserPrivilegeProvider } from '../../../../userPrivileges/UserPrivilegeProvider';
import ResultsTable from '../../components/ResultsTable';
import { ResultFieldConfig, SortOrder, ActionConfig } from '../../models';
import {
  mockActions,
  mockActionsWithInvalidExpression,
  mockInvalidExpressionFields,
  mockResultFields,
  mockResultFieldsWithSortOrder,
  mockResultFieldsWithAction,
  mockResultFieldsWithTransform,
  mockResultFieldsWithUnknownTransform,
  mockResultFieldsWithAgeTransform,
  mockResultFieldsWithDateTransform,
  mockResultFieldsWithFilter,
  mockResults,
  mockResultWithoutId,
} from '../__mocks__/resultsTableMocks';

jest.mock('jsonata');

const mockGetCurrentUserPrivileges = jest.fn();
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  generateUUID: jest.fn(),
  useTranslation: jest.fn(),
  getCurrentUserPrivileges: () => mockGetCurrentUserPrivileges(),
}));
expect.extend(toHaveNoViolations);

const mockJsonata = jsonata as jest.Mock;
const mockGenerateUUID = generateUUID as jest.Mock;
const mockUseTranslation = useTranslation as jest.Mock;

const cursorPagination = {
  batchSize: 6,
  pageSize: 2,
  currentSet: 0,
  searchId: 'search-1',
  hasNextSet: true,
  hasPreviousSet: false,
  onSetChange: jest.fn(),
};

const renderTable = async (
  overrides: Partial<{
    resultFields: ResultFieldConfig[];
    results: unknown[];
    actions?: ActionConfig[];
    totalCount?: number;
    cursorPagination?: typeof cursorPagination;
  }> = {},
) => {
  const result = render(
    <UserPrivilegeProvider>
      <ResultsTable
        resultFields={mockResultFields}
        results={mockResults}
        {...overrides}
      />
    </UserPrivilegeProvider>,
  );
  await act(async () => {});
  return result;
};

describe('ResultsTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    let count = 0;
    mockGenerateUUID.mockImplementation(() => `uuid-${count++}`);
    mockUseTranslation.mockReturnValue({ t: (key: string) => key });
    mockJsonata.mockReturnValue({
      evaluate: jest.fn().mockResolvedValue('evaluated-value'),
    });
    mockGetCurrentUserPrivileges.mockResolvedValue([]);
  });

  it('shows expression error notification when a field has an invalid expression', async () => {
    mockJsonata.mockImplementationOnce(() => {
      throw new Error('Parse error');
    });
    await renderTable({ resultFields: mockInvalidExpressionFields });
    expect(
      screen.getByTestId('common-search-results-table-error'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('COMMON_SEARCH_INVALID_EXPRESSION'),
    ).toBeInTheDocument();
  });

  it('shows evaluation error when a valid expression throws at runtime', async () => {
    mockJsonata.mockReturnValue({
      evaluate: jest.fn().mockRejectedValue(new Error('Runtime error')),
    });
    await renderTable();
    await waitFor(() => {
      expect(
        screen.getByTestId('common-search-results-table-error'),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText('COMMON_SEARCH_EVALUATION_ERROR'),
    ).toBeInTheDocument();
  });

  it('shows empty state message when results is an empty array', async () => {
    await renderTable({ results: [] });
    expect(screen.getByText('COMMON_SEARCH_NO_RESULTS')).toBeInTheDocument();
  });

  it('renders the DataTable when results are non-empty', async () => {
    await renderTable();
    await waitFor(() => {
      expect(
        screen.getByTestId('common-search-results-table'),
      ).toBeInTheDocument();
    });
  });

  describe('Row id resolution', () => {
    it('uses item.id as row id when id is present', async () => {
      await renderTable();
      await waitFor(() => {
        expect(
          screen.getByTestId('common-search-results-table'),
        ).toBeInTheDocument();
      });
      expect(mockGenerateUUID).toHaveBeenCalledTimes(2);
    });

    it('generates a UUID as row id when item has no id', async () => {
      await renderTable({ results: [mockResultWithoutId] });
      await waitFor(() => {
        expect(
          screen.getByTestId('common-search-results-table'),
        ).toBeInTheDocument();
      });
      expect(mockGenerateUUID).toHaveBeenCalledTimes(3);
    });
  });

  describe('Snapshot', () => {
    it('matches snapshot for empty state', async () => {
      const { container } = await renderTable({ results: [] });
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for evaluation error state', async () => {
      mockJsonata.mockReturnValue({
        evaluate: jest.fn().mockRejectedValue(new Error('Runtime error')),
      });
      const { container } = await renderTable();
      await waitFor(() => {
        expect(
          screen.getByTestId('common-search-results-table-error'),
        ).toBeInTheDocument();
      });
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with data', async () => {
      const { container } = await renderTable();
      await waitFor(() => {
        expect(
          screen.getByTestId('common-search-results-table'),
        ).toBeInTheDocument();
      });
      expect(container).toMatchSnapshot();
    });
  });

  describe('Accessibility', () => {
    it('has no a11y violations for empty state', async () => {
      const { container } = await renderTable({ results: [] });
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe('Result field transforms', () => {
    it('falls back to the raw value when the transform key is not registered', async () => {
      mockJsonata.mockReturnValue({
        evaluate: jest
          .fn()
          .mockResolvedValue('UNREGISTERED_TRANSFORM_RAW_VALUE'),
      });
      await renderTable({
        resultFields: mockResultFieldsWithUnknownTransform,
        results: [{ id: '1', country: 'UNREGISTERED_TRANSFORM_RAW_VALUE' }],
      });
      await waitFor(() => {
        expect(
          screen.getByText('UNREGISTERED_TRANSFORM_RAW_VALUE'),
        ).toBeInTheDocument();
      });
    });

    it('shows "-" when the evaluated value is null', async () => {
      mockJsonata.mockReturnValue({
        evaluate: jest.fn().mockResolvedValue(null),
      });
      await renderTable({
        resultFields: mockResultFieldsWithTransform,
        results: [{ id: '1', country: null }],
      });
      await waitFor(() => {
        expect(screen.getByText('-')).toBeInTheDocument();
      });
      expect(screen.queryByText('United States')).not.toBeInTheDocument();
    });

    it('shows "-" when the evaluated value is an empty string', async () => {
      mockJsonata.mockReturnValue({
        evaluate: jest.fn().mockResolvedValue(''),
      });
      await renderTable({
        resultFields: mockResultFieldsWithTransform,
        results: [{ id: '1', country: '' }],
      });
      await waitFor(() => {
        expect(screen.getByText('-')).toBeInTheDocument();
      });
    });

    it('sorts formatAge columns by the raw birthDate while displaying the formatted age', async () => {
      mockJsonata.mockImplementation((expression: string) => ({
        evaluate: async (item: Record<string, unknown>) => item[expression],
      }));

      renderTable({
        resultFields: mockResultFieldsWithAgeTransform,
        results: [
          { id: '1', birthDate: '2010-01-01' },
          { id: '2', birthDate: '1980-01-01' },
        ],
      });

      await waitFor(() => {
        expect(screen.getAllByTestId(/^table-row-/)).toHaveLength(2);
      });

      const rows = screen.getAllByTestId(/^table-row-/);
      expect(rows[0]).toHaveTextContent('YEARS');
      expect(rows[1]).toHaveTextContent('YEARS');
      expect(screen.queryByText('1980-01-01')).not.toBeInTheDocument();
      expect(screen.queryByText('2010-01-01')).not.toBeInTheDocument();
      expect(rows[0].textContent).toMatch(/^\d+YEARS/);
      expect(rows[1].textContent).toMatch(/^\d+YEARS/);
      const [olderAge] = rows[0].textContent!.match(/^\d+/)!;
      const [youngerAge] = rows[1].textContent!.match(/^\d+/)!;
      expect(Number(olderAge)).toBeGreaterThan(Number(youngerAge));
    });

    it('sorts formatDate columns by the raw date while displaying the formatted date', async () => {
      mockJsonata.mockImplementation((expression: string) => ({
        evaluate: async (item: Record<string, unknown>) => item[expression],
      }));

      renderTable({
        resultFields: mockResultFieldsWithDateTransform,
        results: [
          { id: '1', registrationDate: '2024-03-28' },
          { id: '2', registrationDate: '2020-01-15' },
        ],
      });

      await waitFor(() => {
        expect(screen.getAllByTestId(/^table-row-/)).toHaveLength(2);
      });

      const rows = screen.getAllByTestId(/^table-row-/);
      expect(rows[0]).toHaveTextContent('2020');
      expect(rows[1]).toHaveTextContent('2024');
      expect(screen.queryByText('2024-03-28')).not.toBeInTheDocument();
      expect(screen.queryByText('2020-01-15')).not.toBeInTheDocument();
    });
  });

  describe('Sort and filter config wiring', () => {
    it('applies sortOrder from config as the initial row order', async () => {
      mockJsonata.mockImplementation((expression: string) => ({
        evaluate: async (item: Record<string, unknown>) => item[expression],
      }));

      await renderTable({
        resultFields: mockResultFieldsWithSortOrder,
        results: [
          { id: '1', name: 'Charlie', age: 30 },
          { id: '2', name: 'Alice', age: 25 },
          { id: '3', name: 'Bob', age: 40 },
        ],
      });

      await waitFor(() => {
        expect(screen.getAllByTestId(/^table-row-/)).toHaveLength(3);
      });

      const rows = screen.getAllByTestId(/^table-row-/);
      expect(rows[0]).toHaveTextContent('Alice');
      expect(rows[1]).toHaveTextContent('Bob');
      expect(rows[2]).toHaveTextContent('Charlie');
    });

    it('uses declaration order as the tiebreak when multiple columns declare sortOrder', async () => {
      mockJsonata.mockImplementation((expression: string) => ({
        evaluate: async (item: Record<string, unknown>) => item[expression],
      }));

      const resultFieldsWithTwoSortColumns: ResultFieldConfig[] = [
        {
          translationKey: 'PATIENT_NAME',
          expression: 'name',
          enableSort: true,
          sortOrder: SortOrder.Ascending,
        },
        {
          translationKey: 'PATIENT_AGE',
          expression: 'age',
          enableSort: true,
          sortOrder: SortOrder.Ascending,
        },
      ];

      await renderTable({
        resultFields: resultFieldsWithTwoSortColumns,
        results: [
          { id: '1', name: 'Bob', age: 40 },
          { id: '2', name: 'Alice', age: 25 },
          { id: '3', name: 'Bob', age: 20 },
        ],
      });

      await waitFor(() => {
        expect(screen.getAllByTestId(/^table-row-/)).toHaveLength(3);
      });

      const rows = screen.getAllByTestId(/^table-row-/);
      expect(rows[0]).toHaveTextContent('Alice');
      expect(rows[1]).toHaveTextContent('Bob');
      expect(rows[1]).toHaveTextContent('20');
      expect(rows[2]).toHaveTextContent('Bob');
      expect(rows[2]).toHaveTextContent('40');
    });

    it('shows the empty state message when a column filter matches nothing', async () => {
      const user = userEvent.setup();
      const resultFieldsWithFilter: ResultFieldConfig[] = [
        {
          translationKey: 'PATIENT_NAME',
          expression: 'name',
          filterType: 'text',
        },
      ];

      await renderTable({ resultFields: resultFieldsWithFilter });
      await waitFor(() => {
        expect(
          screen.getByTestId('common-search-results-table'),
        ).toBeInTheDocument();
      });

      await user.click(
        screen.getByTestId('common-search-results-table-filter-toggle'),
      );
      const input = screen.getByPlaceholderText('Filter PATIENT_NAME');
      await user.type(input, 'Nonexistent');

      expect(screen.getByText('COMMON_SEARCH_NO_RESULTS')).toBeInTheDocument();
    });
  });

  describe('Navigate action and link rendering', () => {
    it('shows expression error when action navigationURL has invalid JSONata expression', async () => {
      mockJsonata.mockImplementation((expr: string) => {
        if (expr === '$$$invalid') {
          throw new Error('Parse error');
        }
        return { evaluate: jest.fn().mockResolvedValue('evaluated-value') };
      });

      await renderTable({
        resultFields: mockResultFieldsWithAction,
        actions: mockActionsWithInvalidExpression,
      });

      expect(
        screen.getByTestId('common-search-results-table-error'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('COMMON_SEARCH_INVALID_EXPRESSION'),
      ).toBeInTheDocument();
    });

    it('renders cell as link when field has action and href is resolved', async () => {
      mockGetCurrentUserPrivileges.mockResolvedValue([
        { name: 'View Patients', retired: false },
      ]);
      mockJsonata.mockReturnValue({
        evaluate: jest.fn().mockResolvedValue('John Doe'),
      });

      await renderTable({
        resultFields: mockResultFieldsWithAction,
        actions: mockActions,
      });

      await waitFor(() => {
        const link = screen.getByTestId('link-1-uuid-0');
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/patient/John%20Doe');
      });
    });

    it('renders cell as plain text when action key does not exist in actions array', async () => {
      mockJsonata.mockReturnValue({
        evaluate: jest.fn().mockResolvedValue('evaluated-value'),
      });

      const fieldWithNonExistentAction: ResultFieldConfig[] = [
        {
          translationKey: 'PATIENT_NAME',
          expression: 'name',
          action: 'nonExistentAction',
        },
      ];

      await renderTable({
        resultFields: fieldWithNonExistentAction,
        actions: mockActions,
      });

      await waitFor(() => {
        expect(screen.queryByTestId('link-1-uuid-0')).not.toBeInTheDocument();
      });
    });

    it('renders cell as plain text when href resolution returns null', async () => {
      mockJsonata.mockReturnValue({
        evaluate: jest
          .fn()
          .mockResolvedValueOnce('evaluated-value')
          .mockResolvedValue(null),
      });

      await renderTable({
        resultFields: mockResultFieldsWithAction,
        actions: mockActions,
      });

      await waitFor(() => {
        expect(screen.queryByTestId('link-1-uuid-0')).not.toBeInTheDocument();
      });
    });
  });

  describe('pagination', () => {
    it('should render the set pagination footer when cursor pagination config is provided', async () => {
      await renderTable({ cursorPagination });

      expect(
        screen.getByTestId('common-search-results-table-set-pagination'),
      ).toBeInTheDocument();
    });

    it('should not render a pagination footer when cursor pagination config is not provided', async () => {
      await renderTable();

      expect(
        screen.queryByTestId('common-search-results-table-set-pagination'),
      ).not.toBeInTheDocument();
    });

    const pageLabels = () =>
      screen
        .getAllByTestId(/^common-search-results-table-page-\d+$/)
        .map((button) => button.textContent);

    it('should number pages from 1 on the first set', async () => {
      await renderTable({ cursorPagination });

      expect(pageLabels()).toEqual(['1']);
    });

    it('should continue page numbering across sets', async () => {
      await renderTable({
        cursorPagination: {
          ...cursorPagination,
          currentSet: 1,
          hasPreviousSet: true,
        },
      });

      expect(pageLabels()).toEqual(['4']);
    });

    it('should fetch the next batch when the next-set button is clicked', async () => {
      const onSetChange = jest.fn();
      await renderTable({
        cursorPagination: { ...cursorPagination, onSetChange },
      });

      await userEvent.click(
        screen.getByTestId('common-search-results-table-next-set'),
      );

      expect(onSetChange).toHaveBeenCalledWith('next');
    });

    it('should clear column filters when navigating to another set', async () => {
      await renderTable({
        resultFields: mockResultFieldsWithFilter,
        cursorPagination,
      });

      await userEvent.click(
        screen.getByTestId('common-search-results-table-filter-toggle'),
      );
      const filterInput = screen.getByPlaceholderText('Filter PATIENT_NAME');
      await userEvent.type(filterInput, 'John');
      expect(filterInput).toHaveValue('John');

      await userEvent.click(
        screen.getByTestId('common-search-results-table-next-set'),
      );

      expect(screen.getByPlaceholderText('Filter PATIENT_NAME')).toHaveValue(
        '',
      );
    });

    it('should render the table title without a count when the total count is unknown', async () => {
      await renderTable();

      expect(
        screen.getByText('COMMON_SEARCH_RESULTS_TABLE_TITLE'),
      ).toBeInTheDocument();
    });

    it('should render the table title with the total count when one is provided', async () => {
      await renderTable({ totalCount: 300 });

      expect(
        screen.getByText('COMMON_SEARCH_RESULTS_TABLE_TITLE_WITH_COUNT'),
      ).toBeInTheDocument();
    });
  });
});
