import { NumericInput, RangeValue } from '../../models';

export const mockNumericInput: NumericInput = {
  kind: 'numeric',
  placeholderTranslationKey: 'NUMERIC_PLACEHOLDER',
};

export const mockRangeNumericInput: NumericInput = {
  kind: 'numeric',
  placeholderTranslationKey: 'NUMERIC_PLACEHOLDER',
  rangeAllowed: true,
};

export const mockFromValue: RangeValue = {
  from: { value: '20', comparator: null },
};

export const mockRangeValue: RangeValue = {
  from: { value: '20', comparator: null },
  to: { value: '30', comparator: null },
};

export const mockInvalidOrderRangeValue: RangeValue = {
  from: { value: '50', comparator: null },
  to: { value: '20', comparator: null },
};
