import { CriterionRow, RangeValue, ScalarValue } from '../../models';

export const mockRowNoCriterion: CriterionRow = {
  rowId: 'row-no-criterion',
  criterionKey: null,
  value: null,
  validationError: null,
  rangeOrderError: null,
};

export const mockRowTextNoValue: CriterionRow = {
  rowId: 'row-text-no-value',
  criterionKey: 'patient.name.given',
  value: null,
  validationError: null,
  rangeOrderError: null,
};

export const mockRowTextWithValue: CriterionRow = {
  rowId: 'row-text-with-value',
  criterionKey: 'patient.name.given',
  value: { value: 'Rahul' } satisfies ScalarValue,
  validationError: null,
  rangeOrderError: null,
};

export const mockRowScalarEmpty: CriterionRow = {
  rowId: 'row-scalar-empty',
  criterionKey: 'patient.name.given',
  value: { value: '' } satisfies ScalarValue,
  validationError: null,
  rangeOrderError: null,
};

export const mockRowGenderNoValue: CriterionRow = {
  rowId: 'row-gender-no-value',
  criterionKey: 'patient.gender',
  value: null,
  validationError: null,
  rangeOrderError: null,
};

export const mockRowRangeNoBounds: CriterionRow = {
  rowId: 'row-range-no-bounds',
  criterionKey: 'patient.age',
  value: { from: { value: null, comparator: null } } satisfies RangeValue,
  validationError: null,
  rangeOrderError: null,
};

export const mockRowRangePartial: CriterionRow = {
  rowId: 'row-range-partial',
  criterionKey: 'patient.age',
  value: { from: { value: '20', comparator: null } } satisfies RangeValue,
  validationError: null,
  rangeOrderError: null,
};

export const mockRowRangeFull: CriterionRow = {
  rowId: 'row-range-full',
  criterionKey: 'patient.age',
  value: {
    from: { value: '20', comparator: null },
    to: { value: '30', comparator: null },
  } satisfies RangeValue,
  validationError: null,
  rangeOrderError: null,
};

export const mockRowRangeInvalidOrder: CriterionRow = {
  rowId: 'row-range-invalid-order',
  criterionKey: 'patient.age',
  value: {
    from: { value: '50', comparator: null },
    to: { value: '20', comparator: null },
  } satisfies RangeValue,
  validationError: null,
  rangeOrderError: null,
};
