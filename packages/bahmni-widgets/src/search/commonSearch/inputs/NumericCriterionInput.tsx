import { NumberInput } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { NumericInput as NumericInputConfig, RangeValue } from '../models';
import styles from '../styles/CommonSearchWidget.module.scss';

interface Props {
  input: NumericInputConfig;
  value: RangeValue | null;
  onChange: (value: RangeValue | null) => void;
  validationError: string | null;
  rangeOrderError: string | null;
}

const toRawValue = (val: string | number | undefined): string | null => {
  if (val == null || val === '') return null;
  return String(val);
};

const NumericCriterionInput = ({
  input,
  value,
  onChange,
  validationError,
  rangeOrderError,
}: Props) => {
  const { t } = useTranslation();

  if (input.rangeAllowed) {
    const fromInvalid = !!validationError && !value?.from.value;
    const toInvalid =
      (!!validationError && !value?.to?.value) || !!rangeOrderError;
    return (
      <div
        id="numeric-criterion-input"
        data-testid="numeric-criterion-input-test-id"
        className={styles.rangeContainer}
      >
        <div
          id="numeric-criterion-input-from"
          data-testid="numeric-criterion-input-from-test-id"
          className={styles.rangeInputCol}
        >
          <NumberInput
            id={`numeric-input-from-${input.placeholderTranslationKey}`}
            label={t('COMMON_SEARCH_CRITERIA_NUMERIC_INPUT_FIELD_FROM')}
            placeholder={t(input.placeholderTranslationKey)}
            value={value?.from.value ?? 0}
            onChange={(_e, state) =>
              onChange({
                from: { value: toRawValue(state?.value), comparator: null },
                to: {
                  value: value?.to?.value ?? null,
                  comparator: value?.to?.comparator ?? null,
                },
              })
            }
            invalid={fromInvalid}
            invalidText={fromInvalid ? validationError : undefined}
            className={styles.numericInput}
          />
        </div>
        <div
          id="numeric-criterion-input-to"
          data-testid="numeric-criterion-input-to-test-id"
          className={styles.rangeInputCol}
        >
          <NumberInput
            id={`numeric-input-to-${input.placeholderTranslationKey}`}
            label={t('COMMON_SEARCH_CRITERIA_NUMERIC_INPUT_FIELD_TO')}
            placeholder={t(input.placeholderTranslationKey)}
            value={value?.to?.value ?? 0}
            onChange={(_e, state) =>
              onChange({
                from: {
                  value: value?.from.value ?? null,
                  comparator: value?.from.comparator ?? null,
                },
                to: { value: toRawValue(state?.value), comparator: null },
              })
            }
            invalid={toInvalid}
            invalidText={
              rangeOrderError ?? (toInvalid ? validationError : undefined)
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div
      id="numeric-criterion-input"
      data-testid="numeric-criterion-input-test-id"
    >
      <NumberInput
        id={`numeric-input-${input.placeholderTranslationKey}`}
        label={t('ENTER_SEARCH_VALUE')}
        placeholder={t(input.placeholderTranslationKey)}
        value={value?.from.value ?? 0}
        onChange={(_e, state) => {
          const raw = toRawValue(state?.value);
          onChange(
            raw !== null ? { from: { value: raw, comparator: null } } : null,
          );
        }}
        invalid={!!validationError}
        invalidText={validationError ?? undefined}
      />
    </div>
  );
};

export default NumericCriterionInput;
