import { Column, Grid, Dropdown, Link } from '@bahmni/design-system';
import { useTranslation, type DiagnosisInputEntry } from '@bahmni/services';
import { Coding } from 'fhir/r4';
import React from 'react';
import { CERTAINITY_CONCEPTS } from '../../../constants/diagnosis';
import styles from './styles/SelectedDiagnosisItem.module.scss';

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

    return (
      <Grid data-testid="selected-diagnosis-item-grid">
        <Column
          sm={4}
          md={7}
          lg={11}
          xlg={11}
          className={styles.selectedDiagnosisTitle}
        >
          <span data-testid={`diagnosis-display-name-${id}`}>{display}</span>
          <Link
            data-testid="add-as-condition-link"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (doesConditionExist) {
                return;
              }
              onMarkAsCondition(id);
            }}
            disabled={doesConditionExist}
            aria-disabled={doesConditionExist}
            className={styles.addAsConditionLink}
          >
            {doesConditionExist
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
            testId={`diagnoses-certainty-dropdown-${id}`}
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
