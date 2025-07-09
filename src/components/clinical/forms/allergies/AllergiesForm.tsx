import { ComboBox, Tile } from '@carbon/react';
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import BoxWHeader from '@components/common/boxWHeader/BoxWHeader';
import SelectedItem from '@components/common/selectedItem/SelectedItem';
import useAllergenSearch from '@hooks/useAllergenSearch';
import { useAllergyStore } from '@stores/allergyStore';
import { AllergenConcept } from '@types/concepts';
import { getCategoryDisplayName } from '@utils/allergy';
import SelectedAllergyItem from './SelectedAllergyItem';
import * as styles from './styles/AllergiesForm.module.scss';

/**
 * AllergiesForm component
 *
 * A component that displays a search interface for allergies and a list of selected allergies.
 * It allows users to search for allergies, select them, and specify severity and reactions.
 */
const AllergiesForm: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const [searchAllergenTerm, setSearchAllergenTerm] = useState('');

  // Use Zustand store
  const {
    selectedAllergies,
    addAllergy,
    removeAllergy,
    updateSeverity,
    updateReactions,
    updateNote,
  } = useAllergyStore();

  // Use allergen search hook
  const {
    allergens: searchResults,
    reactions: reactionConcepts,
    isLoading,
    error,
  } = useAllergenSearch(searchAllergenTerm);

  const handleSearch = (searchTerm: string) => {
    setSearchAllergenTerm(searchTerm);
  };

  const handleOnChange = (
    selectedItem:
      | AllergenConcept
      | { uuid: string; display: string; type: null; disabled: boolean }
      | null,
  ) => {
    if (
      !selectedItem ||
      !selectedItem.uuid ||
      !selectedItem.display ||
      !selectedItem.type
    ) {
      return;
    }

    addAllergy(selectedItem as AllergenConcept);
  };

  const filteredSearchResults = useMemo(() => {
    if (searchAllergenTerm.length === 0) return [];
    if (isLoading) {
      return [
        {
          uuid: '',
          display: t('LOADING_CONCEPTS'),
          type: null,
          disabled: isLoading,
        },
      ];
    }
    const isSearchEmpty = searchResults.length === 0 && !error;

    if (isSearchEmpty) {
      return [
        {
          uuid: '',
          display: t('NO_MATCHING_ALLERGEN_FOUND'),
          type: null,
          disabled: isSearchEmpty,
        },
      ];
    }

    if (error) {
      return [
        {
          uuid: '',
          display: t('ERROR_FETCHING_CONCEPTS'),
          type: null,
          disabled: true,
        },
      ];
    }

    return searchResults.map((item) => {
      const isAlreadySelected = selectedAllergies.some(
        (a) => a.id === item.uuid,
      );
      return {
        ...item,
        display: isAlreadySelected
          ? `${item.display} (${t('ALLERGY_ALREADY_SELECTED')})`
          : item.display,
        type: isAlreadySelected ? null : item.type,
        disabled: isAlreadySelected,
      };
    });
  }, [
    isLoading,
    searchResults,
    searchAllergenTerm,
    error,
    selectedAllergies,
    t,
  ]);

  return (
    <Tile className={styles.allergiesFormTile}>
      <div className={styles.allergiesFormTitle}>
        {t('ALLERGIES_FORM_TITLE')}
      </div>
      <ComboBox
        id="allergies-search"
        placeholder={t('ALLERGIES_SEARCH_PLACEHOLDER')}
        items={filteredSearchResults}
        itemToString={(item) =>
          item?.type
            ? `${item.display} [${t(getCategoryDisplayName(item.type))}]`
            : item
              ? `${item.display}`
              : ''
        }
        onChange={(data) => handleOnChange(data.selectedItem!)}
        onInputChange={(searchQuery: string) => handleSearch(searchQuery)}
        size="md"
        autoAlign
        aria-label={t('ALLERGIES_SEARCH_ARIA_LABEL')}
      />
      {selectedAllergies && selectedAllergies.length > 0 && (
        <BoxWHeader
          title={t('ALLERGIES_ADDED_ALLERGIES')}
          className={styles.allergiesBox}
        >
          {selectedAllergies.map((allergy) => (
            <SelectedItem
              key={allergy.id}
              className={styles.selectedAllergyItem}
              onClose={() => removeAllergy(allergy.id)}
            >
              <SelectedAllergyItem
                allergy={allergy}
                reactionConcepts={reactionConcepts}
                updateSeverity={updateSeverity}
                updateReactions={updateReactions}
                updateNote={updateNote}
              />
            </SelectedItem>
          ))}
        </BoxWHeader>
      )}
    </Tile>
  );
});

AllergiesForm.displayName = 'AllergiesForm';

export default AllergiesForm;
