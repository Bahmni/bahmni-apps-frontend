import {
  ComboBox,
  Tile,
  BoxWHeader,
  SelectedItem,
  InlineNotification,
} from '@bahmni/design-system';
import {
  fetchOtherNonCodedAllergenUUID,
  getFormattedAllergies,
  OTHER_NON_CODED_ALLERGEN_UUID,
  useTranslation,
} from '@bahmni/services';
import {
  useNotification,
  usePatientUUID,
  useHasPrivilege,
  CONSULTATION_PAD_PRIVILEGES,
} from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { EncounterSessionStartContext } from '../../../events/startConsultation';
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
const AllergiesForm: React.FC<{
  encounterSessionStartContext?: EncounterSessionStartContext;
}> = React.memo(({ encounterSessionStartContext }) => {
  // True when opened via the row/section edit button — search to add new allergy is hidden.
  // New structured payload: action.type === 'update' with AllergyIntolerance resources.
  // Legacy: preloadedAllergies present.
  const isEditMode =
    (encounterSessionStartContext?.action?.type === 'update' &&
      (encounterSessionStartContext?.action?.resources?.some(
        (r) => r.resourceType === 'AllergyIntolerance',
      ) ??
        false)) ||
    !!encounterSessionStartContext?.preloadedAllergies;
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
  const { addNotification } = useNotification();
  const canAddAllergies = useHasPrivilege(
    CONSULTATION_PAD_PRIVILEGES.ALLERGIES,
  );
  const canEditAllergies = useHasPrivilege(
    CONSULTATION_PAD_PRIVILEGES.EDIT_ALLERGIES,
  );
  const [searchAllergenTerm, setSearchAllergenTerm] = useState('');
  const [selectedAllergenItem, setSelectedAllergenItem] =
    useState<AllergenConcept | null>(null);
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
    updateNonCodedAllergen,
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
    enabled: !!patientUUID && canAddAllergies,
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

  // Resolves this install's actual Other, Non-Coded concept uuid as early as
  // possible. A bare fetch-and-cache effect isn't enough here: the checks
  // below feed the Specify Allergen field's visibility in the memoized
  // SelectedAllergyItem, and nothing would tell React to re-render once the
  // fetch resolved, so a preloaded "Other" allergy could keep that field
  // hidden for the lifetime of the form. Holding the result in state (rather
  // than only the module-level cache fetchOtherNonCodedAllergenUUID
  // populates) gives this component something that changes on resolution, so
  // everything derived from otherNonCodedAllergenId below recomputes instead
  // of staying stuck on the hardcoded CIEL default.
  const [otherNonCodedAllergenId, setOtherNonCodedAllergenId] = useState(
    OTHER_NON_CODED_ALLERGEN_UUID,
  );

  const [otherNonCodedResolved, setOtherNonCodedResolved] = useState(false);

  useEffect(() => {
    fetchOtherNonCodedAllergenUUID()
      .then((uuid) => {
        setOtherNonCodedAllergenId(uuid);
        setOtherNonCodedResolved(true);
      })
      .catch((err: Error) => {
        addNotification({
          title: t('ERROR_DEFAULT_TITLE'),
          message: err.message,
          type: 'error',
        });
      });
  }, [addNotification, t]);

  const handleSearch = (searchTerm: string) => {
    setSearchAllergenTerm(searchTerm);
  };

  const isDuplicateAllergy = useCallback(
    (allergyId: string): boolean => {
      // The Other, Non-Coded concept is shared by every free-text allergy, so
      // picking it again always represents a distinct new allergen — concept
      // identity can't be used to detect a duplicate here. Each resulting
      // entry gets its own unique entryId, so multiple can coexist safely.
      if (allergyId === otherNonCodedAllergenId) return false;

      // Check against currently selected allergies in the form
      const isSelectedAllergy = selectedAllergies.some(
        (a) => a.id === allergyId,
      );

      // Check against existing allergies from backend. Compare by
      // conceptCode, not id: id is now the unique FHIR resource id (needed
      // for table/React keys), so it can never match a concept uuid here.
      const isExistingAllergy = existingAllergies?.some(
        (a) => a.conceptCode === allergyId,
      );

      // We need || here (not ??) because we're checking boolean false values
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      return !!(isExistingAllergy || isSelectedAllergy);
    },
    [existingAllergies, selectedAllergies, otherNonCodedAllergenId],
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
    // Only classify once the install's real uuid is known; otherwise leave it
    // undefined so submission resolves it first.
    addAllergy(
      selectedItem as AllergenConcept,
      otherNonCodedResolved
        ? selectedItem.uuid === otherNonCodedAllergenId
        : undefined,
    );
    setSearchAllergenTerm('');
    setSelectedAllergenItem(selectedItem);
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
      // The Other, Non-Coded concept is never "already added" — selecting it
      // again always adds a distinct new free-text allergen.
      const isAlreadySelected =
        item.uuid !== otherNonCodedAllergenId &&
        selectedAllergies.some((a) => a.id === item.uuid);
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
    otherNonCodedAllergenId,
    t,
  ]);

  if (!canAddAllergies && !(isEditMode && canEditAllergies)) return null;

  return (
    <Tile
      className={styles.allergiesFormTile}
      data-testid="allergies-form-tile"
    >
      <div
        className={styles.allergiesFormTitle}
        data-testid="allergies-form-title"
      >
        {isEditMode
          ? t('EDIT_ALLERGIES_FORM_TITLE')
          : t('ALLERGIES_FORM_TITLE')}
      </div>
      {!isEditMode && (
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
          selectedItem={selectedAllergenItem}
          clearSelectedOnChange
          size="md"
          allowCustomValue
          autoAlign
          aria-label={t('ALLERGIES_SEARCH_ARIA_LABEL')}
        />
      )}
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
              key={allergy.entryId}
              className={styles.selectedAllergyItem}
              onClose={() => removeAllergy(allergy.entryId)}
            >
              <SelectedAllergyItem
                allergy={allergy}
                isNonCoded={allergy.id === otherNonCodedAllergenId}
                reactionConcepts={reactionConcepts}
                updateSeverity={updateSeverity}
                updateReactions={updateReactions}
                updateNote={updateNote}
                updateNonCodedAllergen={updateNonCodedAllergen}
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
