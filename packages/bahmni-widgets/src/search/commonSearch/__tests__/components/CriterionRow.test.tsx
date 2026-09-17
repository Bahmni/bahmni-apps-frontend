import { render, screen, fireEvent } from '@testing-library/react';
import CriterionRow from '../../components/CriterionRow';
import {
  CriterionConfig,
  CriterionRow as CriterionRowState,
} from '../../models';
import {
  mockDateCriterion,
  mockLookupCriterion,
  mockRangeNumericCriterion,
} from '../__mocks__/criterionRowMocks';
import { mockPatientContext } from '../__mocks__/searchFormMocks';

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: undefined,
    isLoading: false,
    isError: false,
  })),
}));

const makeRow = (
  overrides?: Partial<CriterionRowState>,
): CriterionRowState => ({
  rowId: 'test-row',
  criterionKey: null,
  value: null,
  validationError: null,
  ...overrides,
});

const defaultProps = {
  availableCriteria: mockPatientContext.criteria,
  onCriterionChange: jest.fn(),
  onValueChange: jest.fn(),
  onRemove: jest.fn(),
};

const renderRow = (
  row: CriterionRowState,
  selectedCriterion: CriterionConfig | null,
) =>
  render(
    <CriterionRow
      {...defaultProps}
      row={row}
      selectedCriterion={selectedCriterion}
    />,
  );

describe('CriterionRow', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([
    {
      kind: 'text',
      testId: 'text-criterion-input-test-id',
      criterion: mockPatientContext.criteria[0],
    },
    {
      kind: 'numeric',
      testId: 'numeric-criterion-input-test-id',
      criterion: mockPatientContext.criteria[2],
    },
    {
      kind: 'options',
      testId: 'options-criterion-input-test-id',
      criterion: mockPatientContext.criteria[1],
    },
    {
      kind: 'date',
      testId: 'date-criterion-input-test-id',
      criterion: mockDateCriterion,
    },
    {
      kind: 'lookup',
      testId: 'lookup-criterion-input-test-id',
      criterion: mockLookupCriterion,
    },
  ])('renders $kind criterion input', ({ testId, criterion }) => {
    renderRow(makeRow({ criterionKey: criterion.field.key }), criterion);
    expect(screen.getByTestId(testId)).toBeInTheDocument();
  });

  it('does not render value input when no criterion is selected', () => {
    renderRow(makeRow(), null);
    expect(
      screen.queryByTestId('text-criterion-input'),
    ).not.toBeInTheDocument();
  });

  it('calls onRemove with rowId when × is clicked', () => {
    renderRow(makeRow(), null);
    fireEvent.click(screen.getByTestId('remove-criterion-test-row-test-id'));
    expect(defaultProps.onRemove).toHaveBeenCalledWith('test-row');
  });

  it('calls onCriterionChange with rowId and criterionKey when a criterion is selected', () => {
    renderRow(makeRow(), null);
    fireEvent.click(
      screen.getByText('COMMON_SEARCH_SELECT_SEARCH_CRITERIA_PLACEHOLDER'),
    );
    fireEvent.click(screen.getByText('PATIENT_GIVEN_NAME'));
    expect(defaultProps.onCriterionChange).toHaveBeenCalledWith(
      'test-row',
      'patient.name.given',
    );
  });

  it('shows criterion error on the dropdown when no criterion is selected and validation error is set', () => {
    renderRow(makeRow({ validationError: 'CRITERION_ERR' }), null);
    expect(screen.getByText('CRITERION_ERR')).toBeInTheDocument();
  });

  it('calls onValueChange with CriterionValue when a range input changes', () => {
    renderRow(
      makeRow({ criterionKey: 'patient.weight', value: null }),
      mockRangeNumericCriterion,
    );
    const [fromInput] = screen.getAllByRole('spinbutton');
    fireEvent.change(fromInput, { target: { value: '60' } });
    expect(defaultProps.onValueChange).toHaveBeenCalledWith('test-row', {
      from: { value: '60', comparator: null },
      to: { value: null, comparator: null },
    });
  });
});
