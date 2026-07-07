import { DateInput, RangeValue } from '../../models';

export const mockDateInput: DateInput = {
  kind: 'date',
  placeholderTranslationKey: 'DATE_PLACEHOLDER',
};

export const mockRangeDateInput: DateInput = {
  kind: 'date',
  placeholderTranslationKey: 'DATE_PLACEHOLDER',
  rangeAllowed: true,
};

export const mockFromValue: RangeValue = {
  from: { value: '2024-01-01T00:00:00.000Z', comparator: null },
};

export const mockRangeValue: RangeValue = {
  from: { value: '2024-01-01T00:00:00.000Z', comparator: null },
  to: { value: '2024-12-31T00:00:00.000Z', comparator: null },
};
