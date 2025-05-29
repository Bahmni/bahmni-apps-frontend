import React from 'react';
import { Column, Grid, Dropdown } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import * as styles from './styles/SelectedDiagnosisItem.module.scss';
import { Coding } from 'fhir/r4';
import { DiagnosisInputEntry } from '@types/diagnosis';
import { CERTAINITY_CONCEPTS } from '@constants/concepts';

/**
 * Properties for a selected diagnosis item
 * @interface SelectedDiagnosisItemProps
 */
export interface SelectedDiagnosisItemProps {
  diagnosis: DiagnosisInputEntry;
  updateCertainty: (diagnosisId: string, certainty: Coding | null) => void;
}

/**
 * Component for rendering a selected diagnosis with certainty dropdown
 *
 * @param {SelectedDiagnosisItemProps} props - Component props
 */
const SelectedDiagnosisItem: React.FC<SelectedDiagnosisItemProps> = React.memo(
  ({ diagnosis, updateCertainty }) => {
    const { t } = useTranslation();

    const { id, title, selectedCertainty, errors, hasBeenValidated } =
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
          {title}
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
