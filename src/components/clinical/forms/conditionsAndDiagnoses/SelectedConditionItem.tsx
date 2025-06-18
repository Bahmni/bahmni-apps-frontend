import React from 'react';
import { Column, Grid, Dropdown, TextInput } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import * as styles from './styles/SelectedConditionItem.module.scss';
import { ConditionInputEntry } from '@types/condition';
import { DURATION_UNITS } from '@constants/conditions';

export interface SelectedConditionItemProps {
  condition: ConditionInputEntry;
  updateConditionDuration: (
    conditionId: string,
    value: number | null,
    unit: 'days' | 'months' | 'years' | null,
  ) => void;
}

const SelectedConditionItem: React.FC<SelectedConditionItemProps> = React.memo(
  ({ condition, updateConditionDuration }) => {
    const { t } = useTranslation();

    const {
      id,
      display,
      durationValue,
      durationUnit,
      errors,
      hasBeenValidated,
    } = condition;
    const hasDurationValueError = !!(hasBeenValidated && errors.durationValue);
    const hasDurationUnitError = !!(hasBeenValidated && errors.durationUnit);

    return (
      <Grid>
        <Column
          sm={4}
          md={7}
          lg={9}
          xlg={9}
          className={styles.selectedConditionTitle}
        >
          {display}
        </Column>
        <Column
          sm={4}
          md={2}
          lg={6}
          xlg={6}
          className={styles.selectedConditionDuration}
        >
          <TextInput
            id={`condition-duration-value-${id}`}
            labelText={t('CONDITIONS_DURATION_VALUE_LABEL')}
            placeholder={t('CONDITIONS_DURATION_VALUE_PLACEHOLDER')}
            value={durationValue?.toString() || ''}
            onChange={(event) => {
              const value = event.target.value.trim();
              if (value === '') {
                updateConditionDuration(id, null, durationUnit);
                return;
              }
              const numValue = parseInt(value, 10);
              if (!isNaN(numValue) && numValue > 0) {
                updateConditionDuration(id, numValue, durationUnit);
              }
            }}
            data-testid={`condition-duration-value-${id}`}
            type="number"
            invalid={hasDurationValueError}
            invalidText={hasDurationValueError ? t(errors.durationValue!) : ''}
            size="sm"
            hideLabel
            className={styles.selectedConditionDurationValue}
          />
          <Dropdown
            id={`condition-duration-unit-${id}`}
            titleText={t('CONDITIONS_DURATION_UNIT_LABEL')}
            label={t('CONDITIONS_DURATION_UNIT_LABEL')}
            hideLabel
            items={DURATION_UNITS}
            selectedItem={
              DURATION_UNITS.find((unit) => unit.id === durationUnit) || null
            }
            itemToString={(item) => (item?.display ? t(item.display!) : '')}
            onChange={(event) => {
              const unit = event.selectedItem?.id as
                | 'days'
                | 'months'
                | 'years'
                | null;
              if (unit && ['days', 'months', 'years'].includes(unit)) {
                updateConditionDuration(id, durationValue, unit);
              }
            }}
            invalid={hasDurationUnitError}
            invalidText={hasDurationUnitError ? t(errors.durationUnit!) : ''}
            size="sm"
            className={styles.selectedConditionDurationUnit}
            autoAlign
          />
        </Column>
      </Grid>
    );
  },
);

SelectedConditionItem.displayName = 'SelectedConditionItem';

export default SelectedConditionItem;
