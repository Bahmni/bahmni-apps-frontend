import React from 'react';
import { Column, Grid, Dropdown, OnChangeData } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import * as styles from './styles/SelectedDiagnosisItem.module.scss';
import { Coding } from 'fhir/r4';

/**
 * Properties for a selected diagnosis item
 * @interface SelectedDiagnosisItemProps
 * @property {string} id - Unique identifier for the diagnosis item
 * @property {string} title - The display name of the diagnosis
 * @property {Coding[]} certaintyConcepts - Available certainty options
 * @property {Coding | null} selectedCertainty - Currently selected certainty
 * @property {Function} handleCertaintyChange - Function to call when certainty changes
 */
export interface SelectedDiagnosisItemProps {
  id: string;
  title: string;
  certaintyConcepts: Coding[];
  selectedCertainty: Coding | null;
  handleCertaintyChange: (
    selectedItem: OnChangeData<Coding | null | undefined>,
  ) => void;
}

/**
 * Component for rendering a selected diagnosis with certainty dropdown
 *
 * @param {SelectedDiagnosisItemProps} props - Component props
 */
const SelectedDiagnosisItem: React.FC<SelectedDiagnosisItemProps> = React.memo(
  ({
    id,
    title,
    certaintyConcepts,
    selectedCertainty,
    handleCertaintyChange,
  }) => {
    const { t } = useTranslation();
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
            type="inline"
            titleText=""
            label={t('DIAGNOSES_SELECT_CERTAINTY')}
            items={certaintyConcepts}
            selectedItem={selectedCertainty}
            itemToString={(item) => item?.display || ''}
            onChange={(data) => {
              handleCertaintyChange(data);
            }}
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
