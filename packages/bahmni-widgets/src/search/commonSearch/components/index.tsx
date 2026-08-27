import {
  CriterionValue,
  InputConfig,
  RangeValue,
  ScalarValue,
} from '../models';
import DateCriterionInput from './DateCriterionInput';
import LookupCriterionInput from './LookupCriterionInput';
import NumericCriterionInput from './NumericCriterionInput';
import OptionsCriterionInput from './OptionsCriterionInput';
import TextCriterionInput from './TextCriterionInput';

interface CriterionInputProps {
  input: InputConfig;
  value: CriterionValue | null;
  onChange: (value: CriterionValue | null) => void;
  validationError: string | null;
  rangeOrderError: string | null;
}

const CriterionInput = ({
  input,
  value,
  onChange,
  validationError,
  rangeOrderError,
}: CriterionInputProps) => {
  switch (input.kind) {
    case 'text':
      return (
        <TextCriterionInput
          input={input}
          value={value as ScalarValue | null}
          onChange={onChange as (value: ScalarValue | null) => void}
          validationError={validationError}
        />
      );
    case 'numeric':
      return (
        <NumericCriterionInput
          input={input}
          value={value as RangeValue | null}
          onChange={onChange as (value: RangeValue | null) => void}
          validationError={validationError}
          rangeOrderError={rangeOrderError}
        />
      );
    case 'date':
      return (
        <DateCriterionInput
          input={input}
          value={value as RangeValue | null}
          onChange={onChange as (value: RangeValue | null) => void}
          validationError={validationError}
          rangeOrderError={rangeOrderError}
        />
      );
    case 'options':
      return (
        <OptionsCriterionInput
          input={input}
          value={value as ScalarValue | null}
          onChange={onChange as (value: ScalarValue | null) => void}
          validationError={validationError}
        />
      );
    case 'lookup':
      return (
        <LookupCriterionInput
          input={input}
          value={value as ScalarValue | null}
          onChange={onChange as (value: ScalarValue | null) => void}
          validationError={validationError}
        />
      );
  }
};

export { CriterionInput };
