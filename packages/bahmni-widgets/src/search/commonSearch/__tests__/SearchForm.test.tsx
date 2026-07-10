import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { v4 as uuidv4 } from 'uuid';
import SearchForm from '../SearchForm';
import { validateRows } from '../utils';
import {
  mockConfig,
  mockContextNoDefaults,
  mockLocation,
  mockLocationNoDisplay,
  mockPatientContext,
  mockPatientContextWithRangeNumeric,
} from './__mocks__/searchFormMocks';

jest.mock('uuid');
expect.extend(toHaveNoViolations);

const mockOnSearch = jest
  .fn()
  .mockImplementation((rows, criteria) =>
    validateRows(
      rows,
      criteria,
      'COMMON_SEARCH_CRITERION_REQUIRED',
      'COMMON_SEARCH_VALUE_REQUIRED',
      'COMMON_SEARCH_RANGE_ORDER_INVALID',
    ),
  );

const renderForm = (config = mockConfig, location = mockLocation) =>
  render(
    <SearchForm config={config} location={location} onSearch={mockOnSearch} />,
  );

describe('SearchForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    let counter = 0;
    (uuidv4 as jest.Mock).mockImplementation(() => `test-uuid-${++counter}`);
  });

  describe('Context selector', () => {
    it('renders a dropdown option for each context in config', () => {
      renderForm();
      fireEvent.click(screen.getByText('PATIENT_SEARCH'));
      expect(screen.getByText('APPOINTMENT_SEARCH')).toBeInTheDocument();
    });

    it('resets rows to the new context defaults when context changes', () => {
      renderForm();
      expect(
        screen.getByTestId('text-criterion-input-test-id'),
      ).toBeInTheDocument();
      fireEvent.click(screen.getByText('PATIENT_SEARCH'));
      fireEvent.click(screen.getByText('APPOINTMENT_SEARCH'));
      expect(
        screen.getAllByTestId('text-criterion-input-test-id'),
      ).toHaveLength(1);
    });
  });

  describe('Initial criteria', () => {
    it.each([
      { label: 'default criterion', config: mockConfig },
      {
        label: 'first criterion when no default set',
        config: [mockContextNoDefaults],
      },
    ])('renders $label on mount', ({ config }) => {
      renderForm(config);
      expect(
        screen.getByTestId('text-criterion-input-test-id'),
      ).toBeInTheDocument();
    });
  });

  describe('Add search criteria button', () => {
    it('adds a row pre-populated with the default criterion when default is not yet active', () => {
      renderForm([mockPatientContext]);
      const removeButtons = screen.getAllByTestId(/remove-criterion/);
      fireEvent.click(removeButtons[0]);

      fireEvent.click(
        screen.getByTestId('common-search-add-criterion-button-test-id'),
      );
      expect(screen.getAllByTestId(/criterion-row-/)).toHaveLength(1);
    });

    it.each([
      { label: 'default already active', config: mockConfig },
      { label: 'no default in context', config: [mockContextNoDefaults] },
    ])('adds a row with no preselect when $label', ({ config }) => {
      renderForm(config);
      fireEvent.click(
        screen.getByTestId('common-search-add-criterion-button-test-id'),
      );
      expect(screen.getAllByTestId(/criterion-row-/)).toHaveLength(2);
    });

    it('hides the Add button when all criteria are active', () => {
      const singleCriterionConfig = [
        {
          ...mockPatientContext,
          criteria: [mockPatientContext.criteria[0]],
        },
      ];
      renderForm(singleCriterionConfig);
      expect(
        screen.queryByTestId('common-search-add-criterion-button-test-id'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Remove criterion', () => {
    it('removes the row when × is clicked', () => {
      renderForm();
      const removeButtons = screen.getAllByTestId(/remove-criterion/);
      expect(removeButtons).toHaveLength(1);
      fireEvent.click(removeButtons[0]);
      expect(screen.queryAllByTestId(/criterion-row-/)).toHaveLength(0);
    });

    it('removes validation error when row is removed', () => {
      renderForm();
      fireEvent.click(
        screen.getByTestId('common-search-search-button-test-id'),
      );
      expect(
        screen.getByText('COMMON_SEARCH_VALUE_REQUIRED'),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByTestId(/remove-criterion/));
      expect(
        screen.queryByText('COMMON_SEARCH_VALUE_REQUIRED'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Criterion change', () => {
    it('switches the input type when a different criterion is selected', () => {
      renderForm();
      fireEvent.click(screen.getByText('PATIENT_GIVEN_NAME'));
      fireEvent.click(screen.getByText('PATIENT_GENDER'));

      expect(
        screen.queryByTestId('text-criterion-input-test-id'),
      ).not.toBeInTheDocument();
      expect(
        screen.getByTestId('options-criterion-input-test-id'),
      ).toBeInTheDocument();
    });

    it('resets the value to null when criterion changes', () => {
      renderForm();
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'Rahul' },
      });

      fireEvent.click(screen.getByText('PATIENT_GIVEN_NAME'));
      fireEvent.click(screen.getByText('PATIENT_AGE'));

      fireEvent.click(
        screen.getByTestId('common-search-search-button-test-id'),
      );
      expect(
        screen.getByText('COMMON_SEARCH_VALUE_REQUIRED'),
      ).toBeInTheDocument();
    });

    it('clears the validation error when criterion changes', () => {
      renderForm();
      fireEvent.click(
        screen.getByTestId('common-search-search-button-test-id'),
      );
      expect(
        screen.getByText('COMMON_SEARCH_VALUE_REQUIRED'),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByText('PATIENT_GIVEN_NAME'));
      fireEvent.click(screen.getByText('PATIENT_GENDER'));

      expect(
        screen.queryByText('COMMON_SEARCH_VALUE_REQUIRED'),
      ).not.toBeInTheDocument();
    });

    it('only updates the targeted row, leaving other rows unchanged', () => {
      renderForm();
      fireEvent.click(
        screen.getByTestId('common-search-add-criterion-button-test-id'),
      );

      fireEvent.click(
        screen.getByText('COMMON_SEARCH_SELECT_SEARCH_CRITERIA_PLACEHOLDER'),
      );
      fireEvent.click(screen.getByText('PATIENT_GENDER'));

      expect(
        screen.getByTestId('text-criterion-input-test-id'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('options-criterion-input-test-id'),
      ).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('shows inline error and disables search button when Search is clicked with empty value', () => {
      renderForm();
      fireEvent.click(
        screen.getByTestId('common-search-search-button-test-id'),
      );
      expect(
        screen.getByText('COMMON_SEARCH_VALUE_REQUIRED'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('common-search-search-button-test-id'),
      ).toBeDisabled();
    });

    it('shows inline error on row with no criterion selected when Search is clicked', () => {
      renderForm();
      fireEvent.click(
        screen.getByTestId('common-search-add-criterion-button-test-id'),
      );
      fireEvent.click(
        screen.getByTestId('common-search-search-button-test-id'),
      );
      expect(
        screen.getByText('COMMON_SEARCH_CRITERION_REQUIRED'),
      ).toBeInTheDocument();
    });

    it('re-enables search after all errors are fixed', () => {
      renderForm();
      fireEvent.click(
        screen.getByTestId('common-search-search-button-test-id'),
      );
      expect(
        screen.getByText('COMMON_SEARCH_VALUE_REQUIRED'),
      ).toBeInTheDocument();

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'Rahul' } });
      expect(
        screen.getByTestId('common-search-search-button-test-id'),
      ).not.toBeDisabled();
    });
  });

  describe('Search button', () => {
    it('is disabled when there are no active criterion rows', () => {
      renderForm();
      fireEvent.click(screen.getByTestId(/remove-criterion/));
      expect(
        screen.getByTestId('common-search-search-button-test-id'),
      ).toBeDisabled();
    });
  });

  describe('Location selector', () => {
    it('renders the location dropdown with the logged-in location name, disabled', () => {
      renderForm();
      const dropdown = screen.getByTestId('location-selector-test-id');
      expect(screen.getByText('Ward A')).toBeInTheDocument();
      expect(dropdown.querySelector('button')).toBeDisabled();
    });

    it('shows location name when display is absent', () => {
      renderForm(mockConfig, mockLocationNoDisplay);
      expect(screen.getByText('Ward B')).toBeInTheDocument();
    });
  });

  describe('Value change', () => {
    it('does not affect other rows when a row value changes', () => {
      renderForm();
      fireEvent.click(
        screen.getByTestId('common-search-add-criterion-button-test-id'),
      );
      fireEvent.click(
        screen.getByText('COMMON_SEARCH_SELECT_SEARCH_CRITERIA_PLACEHOLDER'),
      );
      fireEvent.click(screen.getByText('PATIENT_AGE'));

      fireEvent.click(
        screen.getByTestId('common-search-search-button-test-id'),
      );
      expect(screen.getAllByText('COMMON_SEARCH_VALUE_REQUIRED')).toHaveLength(
        2,
      );

      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'Rahul' },
      });
      expect(screen.getAllByText('COMMON_SEARCH_VALUE_REQUIRED')).toHaveLength(
        1,
      );
    });

    it('preserves the validation error when the updated value has a null from', () => {
      renderForm([mockPatientContextWithRangeNumeric]);
      fireEvent.click(
        screen.getByTestId('common-search-search-button-test-id'),
      );

      const [, toInput] = screen.getAllByRole('spinbutton');
      fireEvent.change(toInput, { target: { value: '30' } });

      expect(
        screen.getByText('COMMON_SEARCH_VALUE_REQUIRED'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('common-search-search-button-test-id'),
      ).toBeDisabled();
    });
  });

  describe('Range criterion validation', () => {
    it.each([
      ['only from is filled', '20', '', 1],
      ['neither bound is filled', '', '', 2],
    ])('shows VALUE_REQUIRED when %s', (_, fromVal, toVal, expectedCount) => {
      renderForm([mockPatientContextWithRangeNumeric]);
      const [fromInput, toInput] = screen.getAllByRole('spinbutton');
      if (fromVal) fireEvent.change(fromInput, { target: { value: fromVal } });
      if (toVal) fireEvent.change(toInput, { target: { value: toVal } });
      fireEvent.click(
        screen.getByTestId('common-search-search-button-test-id'),
      );
      expect(screen.getAllByText('COMMON_SEARCH_VALUE_REQUIRED')).toHaveLength(
        expectedCount,
      );
    });
  });

  describe('Range order validation', () => {
    it('shows range order error and disables search button when from > to', () => {
      renderForm([mockPatientContextWithRangeNumeric]);
      const [fromInput, toInput] = screen.getAllByRole('spinbutton');
      fireEvent.change(fromInput, { target: { value: '50' } });
      fireEvent.change(toInput, { target: { value: '20' } });
      fireEvent.click(
        screen.getByTestId('common-search-search-button-test-id'),
      );
      expect(
        screen.getByText('COMMON_SEARCH_RANGE_ORDER_INVALID'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('common-search-search-button-test-id'),
      ).toBeDisabled();
    });

    it('clears range order error when to value changes', () => {
      renderForm([mockPatientContextWithRangeNumeric]);
      const [fromInput, toInput] = screen.getAllByRole('spinbutton');
      fireEvent.change(fromInput, { target: { value: '50' } });
      fireEvent.change(toInput, { target: { value: '20' } });
      fireEvent.click(
        screen.getByTestId('common-search-search-button-test-id'),
      );
      expect(
        screen.getByText('COMMON_SEARCH_RANGE_ORDER_INVALID'),
      ).toBeInTheDocument();

      fireEvent.change(toInput, { target: { value: '60' } });
      expect(
        screen.queryByText('COMMON_SEARCH_RANGE_ORDER_INVALID'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Snapshot', () => {
    it('matches snapshot', () => {
      const { container } = renderForm();
      expect(container).toMatchSnapshot();
    });
  });

  describe('Accessibility', () => {
    it('has no a11y violations', async () => {
      const { container } = renderForm();
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
