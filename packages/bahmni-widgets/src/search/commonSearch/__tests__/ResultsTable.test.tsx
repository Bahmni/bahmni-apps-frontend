import { generateUUID, useTranslation } from '@bahmni/services';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import jsonata from 'jsonata';
import { UserPrivilegeProvider } from '../../../userPrivileges/UserPrivilegeProvider';
import { ResultFieldConfig, SortOrder, ActionConfig } from '../models';
import ResultsTable from '../ResultsTable';
import {
  mockActions,
  mockActionsWithInvalidExpression,
  mockInvalidExpressionFields,
  mockResultFields,
  mockResultFieldsWithSortOrder,
  mockResultFieldsWithAction,
  mockResultFieldsWithTransform,
  mockResultFieldsWithUnknownTransform,
  mockResults,
  mockResultWithoutId,
} from './__mocks__/resultsTableMocks';

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

const renderTable = (
  overrides: Partial<{
    resultFields: ResultFieldConfig[];
    results: unknown[];
    actions?: ActionConfig[];
  }> = {},
) =>
  render(
    <UserPrivilegeProvider>
      <ResultsTable
        resultFields={mockResultFields}
        results={mockResults}
        {...overrides}
      />
    </UserPrivilegeProvider>,
  );

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

  it('shows expression error notification when a field has an invalid expression', () => {
    mockJsonata.mockImplementationOnce(() => {
      throw new Error('Parse error');
    });
    renderTable({ resultFields: mockInvalidExpressionFields });
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
    renderTable();
    await waitFor(() => {
      expect(
        screen.getByTestId('common-search-results-table-error'),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText('COMMON_SEARCH_EVALUATION_ERROR'),
    ).toBeInTheDocument();
  });

  it('shows empty state message when results is an empty array', () => {
    renderTable({ results: [] });
    expect(screen.getByText('COMMON_SEARCH_NO_RESULTS')).toBeInTheDocument();
  });

  it('renders the DataTable when results are non-empty', async () => {
    renderTable();
    await waitFor(() => {
      expect(
        screen.getByTestId('common-search-results-table'),
      ).toBeInTheDocument();
    });
  });

  describe('Row id resolution', () => {
    it('uses item.id as row id when id is present', async () => {
      renderTable();
      await waitFor(() => {
        expect(
          screen.getByTestId('common-search-results-table'),
        ).toBeInTheDocument();
      });
      expect(mockGenerateUUID).toHaveBeenCalledTimes(2);
    });

    it('generates a UUID as row id when item has no id', async () => {
      renderTable({ results: [mockResultWithoutId] });
      await waitFor(() => {
        expect(
          screen.getByTestId('common-search-results-table'),
        ).toBeInTheDocument();
      });
      expect(mockGenerateUUID).toHaveBeenCalledTimes(3);
    });
  });

  describe('Snapshot', () => {
    it('matches snapshot for empty state', () => {
      const { container } = renderTable({ results: [] });
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for evaluation error state', async () => {
      mockJsonata.mockReturnValue({
        evaluate: jest.fn().mockRejectedValue(new Error('Runtime error')),
      });
      const { container } = renderTable();
      await waitFor(() => {
        expect(
          screen.getByTestId('common-search-results-table-error'),
        ).toBeInTheDocument();
      });
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with data', async () => {
      const { container } = renderTable();
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
      const { container } = renderTable({ results: [] });
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
      renderTable({
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
      renderTable({
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
      renderTable({
        resultFields: mockResultFieldsWithTransform,
        results: [{ id: '1', country: '' }],
      });
      await waitFor(() => {
        expect(screen.getByText('-')).toBeInTheDocument();
      });
    });
  });

  describe('Sort and filter config wiring', () => {
    it('applies sortOrder from config as the initial row order', async () => {
      mockJsonata.mockImplementation((expression: string) => ({
        evaluate: async (item: Record<string, unknown>) => item[expression],
      }));

      renderTable({
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

    it('defaults sortOrder to ascending for a sortable field when omitted', async () => {
      mockJsonata.mockImplementation((expression: string) => ({
        evaluate: async (item: Record<string, unknown>) => item[expression],
      }));

      const resultFieldsWithOmittedSortOrder: ResultFieldConfig[] = [
        {
          translationKey: 'PATIENT_NAME',
          expression: 'name',
          enableSort: true,
        },
      ];

      renderTable({
        resultFields: resultFieldsWithOmittedSortOrder,
        results: [
          { id: '1', name: 'Charlie' },
          { id: '2', name: 'Alice' },
          { id: '3', name: 'Bob' },
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

      renderTable({
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

      renderTable({ resultFields: resultFieldsWithFilter });
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
    it('shows expression error when action navigationURL has invalid JSONata expression', () => {
      mockJsonata.mockImplementation((expr: string) => {
        if (expr === '$$$invalid') {
          throw new Error('Parse error');
        }
        return { evaluate: jest.fn().mockResolvedValue('evaluated-value') };
      });

      renderTable({
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

      renderTable({
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

      renderTable({
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

      renderTable({
        resultFields: mockResultFieldsWithAction,
        actions: mockActions,
      });

      await waitFor(() => {
        expect(screen.queryByTestId('link-1-uuid-0')).not.toBeInTheDocument();
      });
    });
  });
});
