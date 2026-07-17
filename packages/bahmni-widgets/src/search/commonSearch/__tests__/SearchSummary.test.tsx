import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import SearchSummary from '../SearchSummary';
import {
  mockActiveSearchState,
  mockDateRangeRow,
  mockDateScalarRow,
  mockLookupRow,
  mockNumericFromOnlyRow,
  mockNumericRangeRow,
  mockNumericScalarRow,
  mockOptionsRow,
  mockTextRow,
} from './__mocks__/searchSummaryMocks';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  formatDateTime: jest.fn((iso: string) => ({
    formattedResult:
      iso === '2025-10-24T00:00:00.000Z' ? '24/10/2025' : '03/06/2026',
  })),
}));

describe('SearchSummary', () => {
  const onModifySearch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the context label', () => {
    render(
      <SearchSummary
        activeSearchState={mockActiveSearchState}
        onModifySearch={onModifySearch}
      />,
    );
    expect(
      screen.getByTestId('search-summary-context-label-test-id'),
    ).toHaveTextContent('APPOINTMENT_SEARCH:');
  });

  it.each([
    {
      label: 'text criterion',
      row: mockTextRow,
      expected: 'APPOINTMENT_NUMBER: AP000H7',
    },
    {
      label: 'options criterion',
      row: mockOptionsRow,
      expected: 'APPOINTMENT_SERVICE: US Health',
    },
    {
      label: 'lookup criterion',
      row: mockLookupRow,
      expected: 'PATIENT_ID: P001',
    },
    {
      label: 'numeric scalar criterion',
      row: mockNumericScalarRow,
      expected: 'AGE_SCALAR: 42',
    },
  ])('renders green tag for $label', ({ row, expected }) => {
    render(
      <SearchSummary
        activeSearchState={{ ...mockActiveSearchState, rows: [row] }}
        onModifySearch={onModifySearch}
      />,
    );
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it('renders green tag for numeric range criterion', () => {
    render(
      <SearchSummary
        activeSearchState={{
          ...mockActiveSearchState,
          rows: [mockNumericRangeRow],
        }}
        onModifySearch={onModifySearch}
      />,
    );
    expect(
      screen.getByText('PATIENT_AGE: COMMON_SEARCH_CRITERIA_TAG_RANGE'),
    ).toBeInTheDocument();
  });

  it('renders green tag showing only from value for numeric range criterion with no to value', () => {
    render(
      <SearchSummary
        activeSearchState={{
          ...mockActiveSearchState,
          rows: [mockNumericFromOnlyRow],
        }}
        onModifySearch={onModifySearch}
      />,
    );
    expect(screen.getByText('PATIENT_AGE: 20')).toBeInTheDocument();
  });

  it('renders green tag for date scalar criterion', () => {
    render(
      <SearchSummary
        activeSearchState={{
          ...mockActiveSearchState,
          rows: [mockDateScalarRow],
        }}
        onModifySearch={onModifySearch}
      />,
    );
    expect(
      screen.getByText('APPOINTMENT_DATE: 24/10/2025'),
    ).toBeInTheDocument();
  });

  it('renders green tag for date range criterion', () => {
    render(
      <SearchSummary
        activeSearchState={{
          ...mockActiveSearchState,
          rows: [mockDateRangeRow],
        }}
        onModifySearch={onModifySearch}
      />,
    );
    expect(
      screen.getByText('DATE_RANGE: COMMON_SEARCH_CRITERIA_TAG_RANGE'),
    ).toBeInTheDocument();
  });

  it('renders Modify Search button with Edit icon', () => {
    render(
      <SearchSummary
        activeSearchState={mockActiveSearchState}
        onModifySearch={onModifySearch}
      />,
    );
    expect(
      screen.getByRole('button', {
        name: /COMMON_SEARCH_MODIFY_SEARCH_BUTTON/i,
      }),
    ).toBeInTheDocument();
  });

  it('calls onModifySearch when Modify Search button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <SearchSummary
        activeSearchState={mockActiveSearchState}
        onModifySearch={onModifySearch}
      />,
    );
    await user.click(
      screen.getByRole('button', {
        name: /COMMON_SEARCH_MODIFY_SEARCH_BUTTON/i,
      }),
    );
    expect(onModifySearch).toHaveBeenCalledTimes(1);
  });

  describe('Snapshot', () => {
    it('matches snapshot', () => {
      const { container } = render(
        <SearchSummary
          activeSearchState={mockActiveSearchState}
          onModifySearch={onModifySearch}
        />,
      );
      expect(container).toMatchSnapshot();
    });
  });

  describe('Accessibility', () => {
    it('has no a11y violations', async () => {
      const { container } = render(
        <SearchSummary
          activeSearchState={mockActiveSearchState}
          onModifySearch={onModifySearch}
        />,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
