import { DatePicker, DatePickerInput } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { DateInput as DateInputConfig, RangeValue } from '../models';
import styles from '../styles/CommonSearchWidget.module.scss';

interface Props {
  input: DateInputConfig;
  value: RangeValue | null;
  onChange: (value: RangeValue | null) => void;
  validationError: string | null;
  rangeOrderError: string | null;
}

const DateCriterionInput = ({
  input,
  value,
  onChange,
  validationError,
  rangeOrderError,
}: Props) => {
  const { t } = useTranslation();

  if (input.rangeAllowed) {
    return (
      <div
        id="date-criterion-input"
        data-testid="date-criterion-input-test-id"
        className={styles.rangeContainer}
      >
        <div
          id="date-criterion-input-from"
          data-testid="date-criterion-input-from-test-id"
          className={`${styles.rangeInputCol} ${styles.datePicker}`}
        >
          <DatePicker
            datePickerType="single"
            value={value?.from.value ?? ''}
            onChange={(dates: Date[]) =>
              onChange({
                from: {
                  value: dates[0]?.toISOString() ?? null,
                  comparator: null,
                },
                to: {
                  value: value?.to?.value ?? null,
                  comparator: value?.to?.comparator ?? null,
                },
              })
            }
          >
            <DatePickerInput
              id={`date-input-from-${input.placeholderTranslationKey}`}
              labelText={t('COMMON_SEARCH_CRITERIA_DATE_INPUT_FIELD_FROM')}
              placeholder={t(input.placeholderTranslationKey)}
              invalid={!!validationError && !value?.from.value}
              invalidText={validationError ?? undefined}
            />
          </DatePicker>
        </div>
        <div
          id="date-criterion-input-to"
          data-testid="date-criterion-input-to-test-id"
          className={`${styles.rangeInputCol} ${styles.datePicker}`}
        >
          <DatePicker
            datePickerType="single"
            value={value?.to?.value ?? ''}
            onChange={(dates: Date[]) =>
              onChange({
                from: {
                  value: value?.from.value ?? null,
                  comparator: value?.from.comparator ?? null,
                },
                to: {
                  value: dates[0]?.toISOString() ?? null,
                  comparator: null,
                },
              })
            }
          >
            <DatePickerInput
              id={`date-input-to-${input.placeholderTranslationKey}`}
              labelText={t('COMMON_SEARCH_CRITERIA_DATE_INPUT_FIELD_TO')}
              placeholder={t(input.placeholderTranslationKey)}
              invalid={
                (!!validationError && !value?.to?.value) || !!rangeOrderError
              }
              invalidText={
                rangeOrderError ??
                (validationError && !value?.to?.value
                  ? validationError
                  : undefined)
              }
            />
          </DatePicker>
        </div>
      </div>
    );
  }

  return (
    <div id="date-criterion-input" data-testid="date-criterion-input-test-id">
      <DatePicker
        datePickerType="single"
        value={value?.from.value ?? ''}
        className={styles.datePicker}
        onChange={(dates: Date[]) => {
          const iso = dates[0]?.toISOString() ?? null;
          onChange(iso ? { from: { value: iso, comparator: null } } : null);
        }}
      >
        <DatePickerInput
          id={`date-input-${input.placeholderTranslationKey}`}
          labelText={t('ENTER_SEARCH_VALUE')}
          placeholder={t(input.placeholderTranslationKey)}
          invalid={!!validationError}
          invalidText={validationError ?? undefined}
        />
      </DatePicker>
    </div>
  );
};

export default DateCriterionInput;
