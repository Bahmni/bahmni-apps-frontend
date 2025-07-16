import { Column, Grid, Dropdown, Link } from '@carbon/react';
import { Coding } from 'fhir/r4';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CERTAINITY_CONCEPTS } from '@constants/concepts';
import { DiagnosisInputEntry } from '@types/diagnosis';
import * as styles from './styles/SelectedDiagnosisItem.module.scss';

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
