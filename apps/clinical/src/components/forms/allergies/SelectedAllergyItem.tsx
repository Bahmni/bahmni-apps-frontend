import {
  Column,
  Grid,
  Dropdown,
  FilterableMultiSelect,
  Link,
  TextAreaWClose,
} from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { Coding } from 'fhir/r4';
import React, { useState } from 'react';
import { ALLERGY_SEVERITY_CONCEPTS } from '../../../constants/allergy';
import { AllergyInputEntry } from '../../../models/allergy';
import { getCategoryDisplayName } from '../../../utils/allergy';
import styles from './styles/SelectedAllergyItem.module.scss';

/**
 * Properties for a selected allergy item
 * @interface SelectedAllergyItemProps
 */
export interface SelectedAllergyItemProps {
  /** The allergy input entry containing all allergy data */
  allergy: AllergyInputEntry;
  /** Available reaction concepts for the multiselect */
  reactionConcepts: Coding[];
  /** Callback function to update allergy severity */
  updateSeverity: (allergyId: string, severity: Coding | null) => void;
  /** Callback function to update allergy reactions */
  updateReactions: (allergyId: string, reactions: Coding[]) => void;
  /** Callback function to update allergy note */
  updateNote: (allergyId: string, note: string) => void;
}

/**
 * Component for rendering a selected allergy with severity dropdown and reactions multiselect
 *
 * @param {SelectedAllergyItemProps} props - Component props
 */
const SelectedAllergyItem: React.FC<SelectedAllergyItemProps> = React.memo(
  ({
    allergy,
    reactionConcepts,
    updateSeverity,
    updateReactions,
    updateNote,
  }) => {
    const { t } = useTranslation();
    const {
      id,
      display,
      type,
      selectedSeverity,
      selectedReactions,
      note,
      errors,
      hasBeenValidated,
    } = allergy;
    const hasSeverityError = !!(hasBeenValidated && errors.severity);
    const hasReactionsError = !!(hasBeenValidated && errors.reactions);
    const [hasNote, setHasNote] = useState(!!note);

    return (
      <>
        <Grid data-testid={`selected-allergy-item-grid-${id}`}>
          <Column
            sm={4}
            md={5}
            lg={8}
            xlg={8}
            className={styles.selectedAllergyTitle}
          >
            <span data-testid={`allergy-display-name-${id}`}>
              {display} [{t(getCategoryDisplayName(type))}]
            </span>
            {!hasNote && (
              <Link
                href="#"
                data-testid={`allergy-add-note-link-${id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setHasNote(true);
                }}
                className={styles.addAllergyNote}
              >
                {t('ADD_ALLERGY_NOTE')}
              </Link>
            )}
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
              titleText={t('ALLERGY_SELECT_SEVERITY')}
              hideLabel
              label={t('ALLERGY_SELECT_SEVERITY')}
              items={ALLERGY_SEVERITY_CONCEPTS}
              selectedItem={selectedSeverity}
              itemToString={(item) => t((item as Coding)?.display ?? '')}
              onChange={(data) => {
                updateSeverity(id, data.selectedItem as Coding | null);
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
              titleText={t('ALLERGY_SELECT_REACTIONS')}
              hideLabel
              placeholder={t('ALLERGY_SELECT_REACTIONS')}
              items={reactionConcepts}
              selectedItems={selectedReactions}
              itemToString={(item) => (item as Coding)?.display ?? ''}
              onChange={(data) => {
                updateReactions(id, data.selectedItems as Coding[]);
              }}
              invalid={hasReactionsError}
              invalidText={t(errors.reactions!)}
              autoAlign
            />
          </Column>
        </Grid>
        {hasNote && (
          <TextAreaWClose
            id={`allergy-note-${id}`}
            data-testid={`allergy-note-${id}`}
            labelText={t('ADD_ALLERGY_NOTE')}
            placeholder={t('ADD_ALLERGY_NOTE_PLACEHOLDER')}
            value={note ?? ''}
            onChange={(event) => {
              const target = event.target;
              updateNote(id, target.value);
            }}
            onClose={() => {
              setHasNote(false);
              updateNote(id, '');
            }}
            enableCounter
            maxCount={1024}
          />
        )}
      </>
    );
  },
);

SelectedAllergyItem.displayName = 'SelectedAllergyItem';

export default SelectedAllergyItem;
