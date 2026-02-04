import {
  ComboBox,
  Tile,
  BoxWHeader,
  SelectedItem,
  InlineNotification,
} from '@bahmni/design-system';
import { useTranslation, getFormattedAllergies } from '@bahmni/services';
import { useNotification, usePatientUUID } from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import useAllergenSearch from '../../../hooks/useAllergenSearch';
import { AllergenConcept } from '../../../models/allergy';
import { useAllergyStore } from '../../../stores/allergyStore';
import { getCategoryDisplayName } from '../../../utils/allergy';
import SelectedAllergyItem from './SelectedAllergyItem';
import styles from './styles/AllergiesForm.module.scss';

// Query key for allergies
const allergiesQueryKeys = (patientUUID: string) =>
  ['allergies', patientUUID] as const;

/**
 * AllergiesForm component
 *
 * A component that displays a search interface for allergies and a list of selected allergies.
 * It allows users to search for allergies, select them, and specify severity and reactions.
 */
const AllergiesForm: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
  const { addNotification } = useNotification();
  const [searchAllergenTerm, setSearchAllergenTerm] = useState('');
  const [showDuplicateNotification, setShowDuplicateNotification] =
    useState(false);
  const [duplicateAllergyId, setDuplicateAllergyId] = useState<string | null>(
    null,
  );

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

  // Fetch existing allergies from backend
  const {
    data: existingAllergies,
    isLoading: existingAllergiesLoading,
    error: existingAllergiesError,
  } = useQuery({
    queryKey: allergiesQueryKeys(patientUUID!),
    enabled: !!patientUUID,
    queryFn: () => getFormattedAllergies(patientUUID!),
  });

  useEffect(() => {
    if (existingAllergiesError) {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: existingAllergiesError.message,
        type: 'error',
      });
    }
  }, [existingAllergiesLoading, existingAllergiesError, addNotification, t]);

  const handleSearch = (searchTerm: string) => {
    setSearchAllergenTerm(searchTerm);
  };

  const isDuplicateAllergy = useCallback(
    (allergyId: string): boolean => {
      // Check against existing allergies from backend
      const isExistingAllergy = existingAllergies?.some(
        (a) => a.id === allergyId,
      );

      // Check against currently selected allergies in the form
      const isSelectedAllergy = selectedAllergies.some(
        (a) => a.id === allergyId,
      );

      // We need || here (not ??) because we're checking boolean false values
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      return !!(isExistingAllergy || isSelectedAllergy);
    },
    [existingAllergies, selectedAllergies],
  );

  // Clear notification when search term is cleared or when the duplicate allergy is no longer a duplicate
  useEffect(() => {
    if (showDuplicateNotification) {
      // If search is cleared, hide notification
      if (searchAllergenTerm === '') {
        setShowDuplicateNotification(false);
        setDuplicateAllergyId(null);
        return;
      }

      // If the duplicate allergy was removed from selectedAllergies, hide notification
      if (duplicateAllergyId && !isDuplicateAllergy(duplicateAllergyId)) {
        setShowDuplicateNotification(false);
        setDuplicateAllergyId(null);
      }
    }
  }, [
    searchAllergenTerm,
    selectedAllergies,
    showDuplicateNotification,
    duplicateAllergyId,
    isDuplicateAllergy,
  ]);

  const handleOnChange = (
    selectedItem:
      | AllergenConcept
      | { uuid: string; display: string; type: null; disabled: boolean }
      | null,
  ) => {
    if (!selectedItem?.uuid || !selectedItem.display || !selectedItem.type) {
      return;
    }

    // Check for duplicate BEFORE adding
    if (isDuplicateAllergy(selectedItem.uuid)) {
      setDuplicateAllergyId(selectedItem.uuid);
      setShowDuplicateNotification(true);
      return; // Don't add duplicate!
    }

    // Successfully added, clear any previous duplicate notification
    setShowDuplicateNotification(false);
    setDuplicateAllergyId(null);
    addAllergy(selectedItem as AllergenConcept);
  };

  const filteredSearchResults = useMemo(() => {
    if (searchAllergenTerm.length === 0) return [];
    if (isLoading || existingAllergiesLoading) {
      return [
        {
          uuid: '',
          display: t('LOADING_CONCEPTS'),
          type: null,
          disabled: true,
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

    if (error || existingAllergiesError) {
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
          ? `${item.display} (${t('ALLERGY_ALREADY_ADDED')})`
          : item.display,
        type: isAlreadySelected ? null : item.type,
        disabled: isAlreadySelected,
      };
    });
  }, [
    isLoading,
    existingAllergiesLoading,
    searchResults,
    searchAllergenTerm,
    error,
    existingAllergiesError,
    selectedAllergies,
    t,
  ]);

  return (
    <Tile
      className={styles.allergiesFormTile}
      data-testid="allergies-form-tile"
    >
      <div
        className={styles.allergiesFormTitle}
        data-testid="allergies-form-title"
      >
        {t('ALLERGIES_FORM_TITLE')}
      </div>
      <ComboBox
        id="allergies-search"
        data-testid="allergies-search-combobox"
        placeholder={t('ALLERGIES_SEARCH_PLACEHOLDER')}
        items={filteredSearchResults}
        itemToString={(item) => {
          const allergenItem = item as AllergenConcept;
          return allergenItem?.type
            ? `${allergenItem.display} [${t(getCategoryDisplayName(allergenItem.type))}]`
            : allergenItem
              ? `${allergenItem.display}`
              : '';
        }}
        onChange={(data) =>
          handleOnChange(data.selectedItem as AllergenConcept | null)
        }
        onInputChange={(searchQuery: string) => handleSearch(searchQuery)}
        size="md"
        autoAlign
        aria-label={t('ALLERGIES_SEARCH_ARIA_LABEL')}
      />
      {showDuplicateNotification && (
        <InlineNotification
          kind="error"
          lowContrast
          subtitle={t('ALLERGY_ALREADY_ADDED')}
          onClose={() => setShowDuplicateNotification(false)}
          hideCloseButton={false}
          className={styles.duplicateNotification}
        />
      )}
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
