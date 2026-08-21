import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import SearchSummary from '../../components/SearchSummary';
import {
  mockActiveSearchState,
  mockDateRangeRow,
  mockDateScalarRow,
  mockLookupRow,
  mockLookupRowWithLabel,
  mockNumericFromOnlyRow,
  mockNumericRangeRow,
  mockNumericScalarRow,
  mockOptionsRow,
  mockOptionsWithTranslationRow,
  mockTextRow,
} from '../__mocks__/searchSummaryMocks';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  formatDateTime: jest.fn((iso: string) => ({
    formattedResult:
      iso === '2025-10-24T00:00:00.000Z' ? '24/10/2025' : '03/06/2026',
  })),
}));

describe('SearchSummary', () => {
  it('renders the context label', () => {
    render(<SearchSummary currentSearchState={mockActiveSearchState} />);
    expect(
      screen.getByTestId('search-summary-context-label-test-id'),
    ).toHaveTextContent('COMMON_SEARCH_SELECTED_CRITERIA_LABEL');
  });

  it.each([
    {
      label: 'text criterion',
      row: mockTextRow,
      expected: 'APPOINTMENT_NUMBER: AP000H7',
    },
    {
      label:
        'options criterion with no matching option (fallback to raw value)',
      row: mockOptionsRow,
      expected: 'APPOINTMENT_SERVICE: US Health',
    },
    {
      label: 'lookup criterion with no resolved label (fallback to raw value)',
      row: mockLookupRow,
      expected: 'PATIENT_ID: P001',
    },
    {
      label: 'lookup criterion with a resolved label',
      row: mockLookupRowWithLabel,
      expected: 'PATIENT_ID: John Doe',
    },
    {
      label: 'numeric scalar criterion',
      row: mockNumericScalarRow,
      expected: 'AGE_SCALAR: 42',
    },
    {
      label: 'options criterion with matching option',
      row: mockOptionsWithTranslationRow,
      expected: 'PATIENT_GENDER: GENDER_MALE',
    },
  ])('renders green tag for $label', ({ row, expected }) => {
    render(
      <SearchSummary
        currentSearchState={{ ...mockActiveSearchState, rows: [row] }}
      />,
    );
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it('renders green tag for numeric range criterion', () => {
    render(
      <SearchSummary
        currentSearchState={{
          ...mockActiveSearchState,
          rows: [mockNumericRangeRow],
        }}
      />,
    );
    expect(
      screen.getByText('PATIENT_AGE: COMMON_SEARCH_CRITERIA_TAG_RANGE'),
    ).toBeInTheDocument();
  });

  it('renders green tag showing only from value for numeric range criterion with no to value', () => {
    render(
      <SearchSummary
        currentSearchState={{
          ...mockActiveSearchState,
          rows: [mockNumericFromOnlyRow],
        }}
      />,
    );
    expect(screen.getByText('PATIENT_AGE: 20')).toBeInTheDocument();
  });

  it('renders green tag for date scalar criterion', () => {
    render(
      <SearchSummary
        currentSearchState={{
          ...mockActiveSearchState,
          rows: [mockDateScalarRow],
        }}
      />,
    );
    expect(
      screen.getByText('APPOINTMENT_DATE: 24/10/2025'),
    ).toBeInTheDocument();
  });

  it('renders green tag for date range criterion', () => {
    render(
      <SearchSummary
        currentSearchState={{
          ...mockActiveSearchState,
          rows: [mockDateRangeRow],
        }}
      />,
    );
    expect(
      screen.getByText('DATE_RANGE: COMMON_SEARCH_CRITERIA_TAG_RANGE'),
    ).toBeInTheDocument();
  });

  describe('Snapshot', () => {
    it('matches snapshot', () => {
      const { container } = render(
        <SearchSummary currentSearchState={mockActiveSearchState} />,
      );
      expect(container).toMatchSnapshot();
    });
  });

  describe('Accessibility', () => {
    it('has no a11y violations', async () => {
      const { container } = render(
        <SearchSummary currentSearchState={mockActiveSearchState} />,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
