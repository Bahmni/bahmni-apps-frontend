import React from 'react';
import { Column, Grid, Dropdown, FilterableMultiSelect } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import * as styles from './styles/SelectedAllergyItem.module.scss';
import { AllergyInputEntry } from '@types/allergy';
import { Coding } from 'fhir/r4';
import { capitalize } from '@utils/common';
import { ALLERGY_SEVERITY_CONCEPTS } from '@constants/concepts';

/**
 * Properties for a selected allergy item
 * @interface SelectedAllergyItemProps
 */
export interface SelectedAllergyItemProps {
  allergy: AllergyInputEntry;
  reactionConcepts: Coding[];
  updateSeverity: (allergyId: string, severity: Coding | null) => void;
  updateReactions: (allergyId: string, reactions: Coding[]) => void;
}

/**
 * Component for rendering a selected allergy with severity dropdown and reactions multiselect
 *
 * @param {SelectedAllergyItemProps} props - Component props
 */
const SelectedAllergyItem: React.FC<SelectedAllergyItemProps> = React.memo(
  ({ allergy, reactionConcepts, updateSeverity, updateReactions }) => {
    const { t } = useTranslation();
    const {
      id,
      display,
      type,
      selectedSeverity,
      selectedReactions,
      errors,
      hasBeenValidated,
    } = allergy;
    const hasSeverityError = !!(hasBeenValidated && errors.severity);
    const hasReactionsError = !!(hasBeenValidated && errors.reactions);

    return (
      <Grid>
        <Column
          sm={4}
          md={5}
          lg={8}
          xlg={8}
          className={styles.selectedAllergyTitle}
        >
          {display} [{capitalize(type)}]
        </Column>
        <Column
          sm={4}
          md={3}
          lg={3}
          xlg={3}
          className={styles.selectedAllergySeverity}
        >
          <Dropdown
            id={`allergy-severity-dropdown-${id}`}
            data-testid={`allergy-severity-dropdown-${id}`}
            type="default"
            titleText=""
            label={t('ALLERGY_SELECT_SEVERITY')}
            items={ALLERGY_SEVERITY_CONCEPTS}
            selectedItem={selectedSeverity}
            itemToString={(item) => t(item!.display!)}
            onChange={(data) => {
              updateSeverity(id, data.selectedItem);
            }}
            invalid={hasSeverityError}
            invalidText={hasSeverityError && t(errors.severity!)}
            autoAlign
            aria-label={t('ALLERGY_SEVERITY_ARIA_LABEL')}
          />
        </Column>
        <Column
          sm={4}
          md={4}
          lg={4}
          xlg={4}
          className={styles.selectedAllergyReactions}
        >
          <FilterableMultiSelect
            id={`allergy-reactions-multiselect-${id}`}
            data-testid={`allergy-reactions-multiselect-${id}`}
            type="default"
            titleText=""
            placeholder={t('ALLERGY_SELECT_REACTIONS')}
            items={reactionConcepts}
            selectedItems={selectedReactions}
            itemToString={(item) => (item?.display ? item.display : '')}
            onChange={(data) => {
              updateReactions(id, data.selectedItems!);
            }}
            invalid={hasReactionsError}
            invalidText={t(errors.reactions!)}
            autoAlign
          />
        </Column>
      </Grid>
    );
  },
);

SelectedAllergyItem.displayName = 'SelectedAllergyItem';

export default SelectedAllergyItem;
