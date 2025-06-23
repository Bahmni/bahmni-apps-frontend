import React from 'react';
import { Column, Grid, Dropdown, Link, DataTableSkeleton } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import * as styles from './styles/SelectedDiagnosisItem.module.scss';
import { Coding } from 'fhir/r4';
import { DiagnosisInputEntry } from '@types/diagnosis';
import { CERTAINITY_CONCEPTS } from '@constants/concepts';
import useConditions from '@hooks/useConditions';

export interface SelectedDiagnosisItemProps {
  diagnosis: DiagnosisInputEntry;
  updateCertainty: (diagnosisId: string, certainty: Coding | null) => void;
  onMarkAsCondition: (diagnosisId: string) => void;
  doesConditionExist?: boolean;
}

/**
 * Component for rendering a selected diagnosis with certainty dropdown
 *
 * @param {SelectedDiagnosisItemProps} props - Component props
 */
const SelectedDiagnosisItem: React.FC<SelectedDiagnosisItemProps> = React.memo(
  ({
    diagnosis,
    updateCertainty,
    onMarkAsCondition,
    doesConditionExist = false,
  }) => {
    const { t } = useTranslation();

    const { id, display, selectedCertainty, errors, hasBeenValidated } =
      diagnosis;
    const hasCertaintyError = !!(hasBeenValidated && errors.certainty);
    const {
      conditions: existingConditions,
      loading: existingConditionsLoading,
    } = useConditions();

    if (existingConditionsLoading) {
      return (
        <DataTableSkeleton
          columnCount={2}
          rowCount={0}
          showHeader={false}
          showToolbar={false}
          compact
        />
      );
    }

    const isExistingCondition = existingConditions.some(
      (d) => d.code?.coding?.[0]?.code === diagnosis.id,
    );

    return (
      <Grid>
        <Column
          sm={4}
          md={7}
          lg={11}
          xlg={11}
          className={styles.selectedDiagnosisTitle}
        >
          {display}
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (doesConditionExist || isExistingCondition) {
                return;
              }
              onMarkAsCondition(id);
            }}
            disabled={doesConditionExist || isExistingCondition}
            aria-disabled={doesConditionExist || isExistingCondition}
            className={styles.addAsConditionLink}
          >
            {doesConditionExist || isExistingCondition
              ? t('DIAGNOSES_ALREADY_ADDED_AS_CONDITION')
              : t('CONDITIONS_ADD_AS_CONDITION')}
          </Link>
        </Column>
        <Column
          sm={4}
          md={2}
          lg={4}
          xlg={4}
          className={styles.selectedDiagnosisCertainty}
        >
          <Dropdown
            id={`diagnoses-certainty-dropdown-${id}`}
            data-testid={`diagnoses-certainty-dropdown-${id}`}
            type="default"
            titleText=""
            label={t('DIAGNOSES_SELECT_CERTAINTY')}
            items={CERTAINITY_CONCEPTS}
            selectedItem={selectedCertainty}
            itemToString={(item) => (item?.display ? t(item.display) : '')}
            onChange={(data) => {
              updateCertainty(id, data.selectedItem);
            }}
            invalid={hasCertaintyError}
            invalidText={hasCertaintyError ? t(errors.certainty!) : ''}
            autoAlign
            aria-label={t('DIAGNOSES_CERTAINTY_ARIA_LABEL')}
          />
        </Column>
      </Grid>
    );
  },
);

SelectedDiagnosisItem.displayName = 'SelectedDiagnosisItem';

export default SelectedDiagnosisItem;
