import { generateUUID, useTranslation } from '@bahmni/services';
import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import jsonata from 'jsonata';
import ResultsTable from '../ResultsTable';
import {
  mockInvalidExpressionFields,
  mockResultFields,
  mockResultFieldsWithTransform,
  mockResultFieldsWithUnknownTransform,
  mockResults,
  mockResultWithoutId,
} from './__mocks__/resultsTableMocks';

jest.mock('jsonata');
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  generateUUID: jest.fn(),
  useTranslation: jest.fn(),
}));
expect.extend(toHaveNoViolations);

const mockJsonata = jsonata as jest.Mock;
const mockGenerateUUID = generateUUID as jest.Mock;
const mockUseTranslation = useTranslation as jest.Mock;

const renderTable = (
  overrides: Partial<{
    resultFields: typeof mockResultFields;
    results: unknown[];
  }> = {},
) =>
  render(
    <ResultsTable
      resultFields={mockResultFields}
      results={mockResults}
      {...overrides}
    />,
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
    it('uses the i18n translation when available before falling back to Intl', async () => {
      mockUseTranslation.mockReturnValue({
        t: (key: string) =>
          key === 'COUNTRY_CODE_US' ? 'United States (translated)' : key,
      });
      mockJsonata.mockReturnValue({
        evaluate: jest.fn().mockResolvedValue('US'),
      });
      renderTable({
        resultFields: mockResultFieldsWithTransform,
        results: [{ id: '1', country: 'US' }],
      });
      await waitFor(() => {
        expect(
          screen.getByText('United States (translated)'),
        ).toBeInTheDocument();
      });
    });

    it('falls back to Intl when i18n returns the key unchanged', async () => {
      mockJsonata.mockReturnValue({
        evaluate: jest.fn().mockResolvedValue('us'),
      });
      renderTable({
        resultFields: mockResultFieldsWithTransform,
        results: [{ id: '1', country: 'us' }],
      });
      await waitFor(() => {
        expect(screen.getByText('United States')).toBeInTheDocument();
      });
    });

    it('falls back to the raw value when the transform key is not registered', async () => {
      mockJsonata.mockReturnValue({
        evaluate: jest.fn().mockResolvedValue('us'),
      });
      renderTable({
        resultFields: mockResultFieldsWithUnknownTransform,
        results: [{ id: '1', country: 'us' }],
      });
      await waitFor(() => {
        expect(screen.getByText('us')).toBeInTheDocument();
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
});
