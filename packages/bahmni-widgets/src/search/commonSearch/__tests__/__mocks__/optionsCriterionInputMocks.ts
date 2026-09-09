import { OptionsInput, ScalarValue } from '../../models';

export const mockOptionsInput: OptionsInput = {
  kind: 'options',
  placeholderTranslationKey: 'OPTIONS_PLACEHOLDER',
  options: [
    { translationKey: 'OPTION_ONE', value: 'one' },
    { translationKey: 'OPTION_TWO', value: 'two' },
  ],
};

export const mockOptionsScalarValue: ScalarValue = { value: 'one' };
