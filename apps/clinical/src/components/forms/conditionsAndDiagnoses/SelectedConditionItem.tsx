import { TextInput } from '@bahmni/design-system';
import { useTranslation, type ConditionInputEntry } from '@bahmni/services';
import React from 'react';
import {
  CONDITION_DURATION_FIELDS,
  CONDITION_DURATION_LABELS,
  type ConditionDurationField,
} from '../../../constants/conditions';
import { parseConditionDurationInput } from '../../../utils/conditionDuration';
import styles from './styles/SelectedConditionItem.module.scss';

export interface SelectedConditionItemProps {
  condition: ConditionInputEntry;
  updateConditionDuration: (
    conditionId: string,
    field: ConditionDurationField,
    value: number | null,
  ) => void;
}

const SelectedConditionItem: React.FC<SelectedConditionItemProps> = React.memo(
  ({ condition, updateConditionDuration }) => {
    const { t } = useTranslation();

    const {
      id,
      display,
      durationYears,
      durationMonths,
      durationDays,
      errors,
      hasBeenValidated,
    } = condition;
    const hasDurationError = !!(hasBeenValidated && errors.duration);
    const titleId = `condition-title-${id}`;
    const errorId = `condition-duration-error-${id}`;

    const durationValues: Record<ConditionDurationField, number | null> = {
      years: durationYears,
      months: durationMonths,
      days: durationDays,
    };

    const handleDurationChange = (
      field: ConditionDurationField,
      rawValue: string,
    ) => {
      const value = parseConditionDurationInput(field, rawValue);
      // Invalid input (negative, decimal, non-numeric, out of range) is rejected
      // so the previously committed value stays in the input
      if (value === undefined) return;
      updateConditionDuration(id, field, value);
    };

    return (
      <div className={styles.selectedConditionRow}>
        <span id={titleId} className={styles.selectedConditionTitle}>
          {display}
        </span>
        <div className={styles.selectedConditionDuration}>
          <fieldset
            className={styles.selectedConditionDurationFieldset}
            aria-labelledby={`${titleId} condition-duration-legend-${id}`}
            data-testid={`condition-duration-${id}`}
          >
            <legend
              id={`condition-duration-legend-${id}`}
              className="cds--visually-hidden"
            >
              {t('CONDITIONS_DURATION_LEGEND')}
            </legend>
            <div className={styles.selectedConditionDurationInputs}>
              {CONDITION_DURATION_FIELDS.map((field) => (
                <TextInput
                  key={field}
                  id={`condition-duration-${field}-${id}`}
                  data-testid={`condition-duration-${field}-${id}`}
                  labelText={t(CONDITION_DURATION_LABELS[field])}
                  value={durationValues[field]?.toString() ?? ''}
                  onChange={(event) =>
                    handleDurationChange(field, event.target.value)
                  }
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  aria-invalid={hasDurationError}
                  aria-describedby={hasDurationError ? errorId : undefined}
                  size="sm"
                  className={
                    hasDurationError
                      ? `${styles.selectedConditionDurationInput} ${styles.selectedConditionDurationInputInvalid}`
                      : styles.selectedConditionDurationInput
                  }
                />
              ))}
            </div>
            {hasDurationError && (
              <div
                id={errorId}
                role="alert"
                className={styles.selectedConditionDurationError}
                data-testid={errorId}
              >
                {t(errors.duration!)}
              </div>
            )}
          </fieldset>
        </div>
      </div>
    );
  },
);

SelectedConditionItem.displayName = 'SelectedConditionItem';

export default SelectedConditionItem;
