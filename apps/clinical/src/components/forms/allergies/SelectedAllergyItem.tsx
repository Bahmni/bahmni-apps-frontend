import {
  Column,
  Grid,
  Dropdown,
  FilterableMultiSelect,
  Link,
  TextAreaWClose,
  TextInput,
} from '@bahmni/design-system';
import { isNonCodedAllergen, useTranslation } from '@bahmni/services';
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
  updateSeverity: (entryId: string, severity: Coding | null) => void;
  /** Callback function to update allergy reactions */
  updateReactions: (entryId: string, reactions: Coding[]) => void;
  /** Callback function to update allergy note */
  updateNote: (entryId: string, note: string) => void;
  /** Callback to update the free-text name of a non-coded allergen */
  updateNonCodedAllergen: (entryId: string, name: string) => void;
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
    updateNonCodedAllergen,
  }) => {
    const { t } = useTranslation();
    const {
      id,
      entryId,
      display,
      type,
      selectedSeverity,
      selectedReactions,
      note,
      nonCodedAllergen,
      errors,
      hasBeenValidated,
    } = allergy;
    const hasSeverityError = !!(hasBeenValidated && errors.severity);
    const hasReactionsError = !!(hasBeenValidated && errors.reactions);
    const isNonCoded = isNonCodedAllergen(id);
    const hasNonCodedError = !!(hasBeenValidated && errors.nonCodedAllergen);
    const [hasNote, setHasNote] = useState(!!note);

    return (
      <>
        <Grid data-testid={`selected-allergy-item-grid-${entryId}`}>
          <Column
            sm={4}
            md={5}
            lg={8}
            xlg={8}
            className={styles.selectedAllergyTitle}
          >
            <span data-testid={`allergy-display-name-${entryId}`}>
              {display} [{t(getCategoryDisplayName(type))}]
            </span>
            {!hasNote && (
              <Link
                href="#"
                data-testid={`allergy-add-note-link-${entryId}`}
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
              id={`allergy-severity-dropdown-${entryId}`}
              data-testid={`allergy-severity-dropdown-${entryId}`}
              type="default"
              titleText={t('ALLERGY_SEVERITY_LABEL')}
              label={t('ALLERGY_SELECT_SEVERITY')}
              items={ALLERGY_SEVERITY_CONCEPTS}
              selectedItem={selectedSeverity}
              itemToString={(item) => t((item as Coding)?.display ?? '')}
              onChange={(data) => {
                updateSeverity(entryId, data.selectedItem as Coding | null);
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
              key={entryId}
              id={`allergy-reactions-multiselect-${entryId}`}
              data-testid={`allergy-reactions-multiselect-${entryId}`}
              type="default"
              titleText={t('ALLERGY_REACTIONS_LABEL')}
              placeholder={t('ALLERGY_SELECT_REACTIONS')}
              items={reactionConcepts}
              selectedItems={selectedReactions}
              itemToString={(item) => (item as Coding)?.display ?? ''}
              onChange={(data) => {
                updateReactions(entryId, data.selectedItems as Coding[]);
              }}
              invalid={hasReactionsError}
              invalidText={t(errors.reactions!)}
              autoAlign
            />
          </Column>
        </Grid>
        {isNonCoded && (
          <TextInput
            id={`allergy-non-coded-name-${entryId}`}
            data-testid={`allergy-non-coded-name-${entryId}`}
            labelText={t('ALLERGY_OTHER_ALLERGEN_LABEL')}
            placeholder={t('ALLERGY_OTHER_ALLERGEN_PLACEHOLDER')}
            value={nonCodedAllergen ?? ''}
            onChange={(e) => updateNonCodedAllergen(entryId, e.target.value)}
            invalid={hasNonCodedError}
            invalidText={hasNonCodedError ? t(errors.nonCodedAllergen!) : ''}
            maxLength={255}
          />
        )}
        {hasNote && (
          <TextAreaWClose
            id={`allergy-note-${entryId}`}
            data-testid={`allergy-note-${entryId}`}
            labelText={t('NOTE_LABEL')}
            placeholder={t('ADD_ALLERGY_NOTE_PLACEHOLDER')}
            value={note ?? ''}
            onChange={(e) => updateNote(entryId, e.target.value)}
            onClose={() => {
              setHasNote(false);
              updateNote(entryId, '');
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
