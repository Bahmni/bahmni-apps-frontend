import { LookupInput, ScalarValue } from '../../models';

export const mockLookupInput: LookupInput = {
  kind: 'lookup',
  placeholderTranslationKey: 'LOOKUP_PLACEHOLDER',
  lookup: { source: 'testSource', prefetch: false },
};

export const mockLookupScalarValue: ScalarValue = { value: 'selected-item' };
