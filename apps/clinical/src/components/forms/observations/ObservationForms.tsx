import {
  ComboBox,
  Tile,
  FormCard,
  FormCardContainer,
  SkeletonText,
} from '@bahmni/design-system';
import { ObservationForm } from '@bahmni/services';
import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DEFAULT_FORM_API_NAMES,
  VALIDATION_STATE_EMPTY,
  VALIDATION_STATE_MANDATORY,
  VALIDATION_STATE_INVALID,
  VALIDATION_STATE_SCRIPT_ERROR,
} from '../../../constants/forms';
import { useObservationFormsStore } from '../../../stores/observationFormsStore';
import styles from './styles/ObservationForms.module.scss';

interface ObservationFormsProps {
  onFormSelect?: (form: ObservationForm) => void;
  selectedForms?: ObservationForm[];
  onRemoveForm?: (formUuid: string) => void;
  // Pinned forms state passed from parent (required)
  pinnedForms: ObservationForm[];
  updatePinnedForms: (newPinnedForms: ObservationForm[]) => Promise<void>;
  isPinnedFormsLoading: boolean;
  // Forms data passed from parent to avoid redundant API calls
  allForms: ObservationForm[];
  isAllFormsLoading: boolean;
  observationFormsError: Error | null;
}

/**
 * ObservationForms component
 *
 * A component that displays a search interface for observation forms and a list of selected forms.
 * It allows users to search for observation forms by name, select them, and add them to the consultation.
 *
 * Features:
 * - ComboBox-based search interface
 * - Real-time filtering by form name
 * - Visual distinction for already-added forms
 * - Alphabetical ordering of search results
 * - Internationalization support
 * - Error handling and loading states
 */
const ObservationForms: React.FC<ObservationFormsProps> = React.memo(
  ({
    onFormSelect,
    selectedForms = [],
    onRemoveForm,
    pinnedForms,
    updatePinnedForms,
    isPinnedFormsLoading,
    allForms,
    isAllFormsLoading,
    observationFormsError,
  }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const { getFormData } = useObservationFormsStore();

    // Client-side filtering based on search term
    // Uses OR logic: searching "Vitals History" matches forms containing either "vitals" OR "history"
    // This provides more flexible and user-friendly search results
    const availableForms = useMemo(() => {
      if (!searchTerm.trim()) return allForms;

      const searchTermLower = searchTerm.toLowerCase().trim();
      const searchWords = searchTermLower.split(/\s+/);

      return allForms.filter((form) => {
        const nameLower = form.name.toLowerCase();
        // OR logic: match if ANY search word is found in the form name
        return searchWords.some((word) => nameLower.includes(word));
      });
    }, [allForms, searchTerm]);

    // Use same loading and error state for search
    const isSearchLoading = isAllFormsLoading;
    const searchError = observationFormsError;

    // Validate and filter available forms - handle malformed data
    const validatedAvailableForms = useMemo(() => {
      return allForms.filter((form) => {
        // Check required properties
        if (!form || typeof form !== 'object') return false;
        if (!form.uuid || typeof form.uuid !== 'string') return false;
        if (!form.name || typeof form.name !== 'string') return false;
        return true;
      });
    }, [allForms]);

    // Use API names for filtering (these match the actual form names from backend)
    const defaultPinnedForms = validatedAvailableForms.filter((form) =>
      DEFAULT_FORM_API_NAMES.includes(form.name),
    );

    // Filter orphaned pinned forms - remove forms that are pinned but no longer available
    const validUserPinnedForms = useMemo(() => {
      return pinnedForms.filter((pinnedForm) => {
        return validatedAvailableForms.some(
          (availableForm) => availableForm.uuid === pinnedForm.uuid,
        );
      });
    }, [pinnedForms, validatedAvailableForms]);

    // Merge with user-pinned forms (avoid duplicates)
    const userPinnedUuids = validUserPinnedForms.map((f) => f.uuid);

    // Step 1: Get default forms that user hasn't pinned, sorted alphabetically
    const sortedDefaultForms = defaultPinnedForms
      .filter((f) => !userPinnedUuids.includes(f.uuid))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Step 2: Get user-pinned forms, sorted alphabetically
    const sortedUserPinnedForms = [...validUserPinnedForms].sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    // Step 3: Combine - defaults first, then user-pinned
    const allPinnedForms = [...sortedDefaultForms, ...sortedUserPinnedForms];

    const handleSearch = useCallback((searchQuery: string) => {
      setSearchTerm(searchQuery);
    }, []);

    const handleOnChange = useCallback(
      (data: {
        selectedItem?: { id: string; label: string; disabled?: boolean } | null;
      }) => {
        const selectedItem = data.selectedItem;
        if (!selectedItem?.id || selectedItem.disabled) {
          return;
        }
        const form = availableForms.find(
          (f: ObservationForm) => f.uuid === selectedItem.id,
        );
        if (form) {
          onFormSelect?.(form);
        }
      },
      [availableForms, onFormSelect],
    );

    const searchResults = useMemo(() => {
      if (isSearchLoading) {
        return [
          {
            id: '',
            label: t('OBSERVATION_FORMS_LOADING_FORMS'),
            disabled: true,
          },
        ];
      }

      if (searchError) {
        return [
          {
            id: '',
            label: t('OBSERVATION_FORMS_ERROR_LOADING_FORMS'),
            disabled: true,
          },
        ];
      }

      if (availableForms.length === 0 && searchTerm.length > 0) {
        return [
          {
            id: '',
            label: t('OBSERVATION_FORMS_NO_FORMS_FOUND'),
            disabled: true,
          },
        ];
      }

      if (availableForms.length === 0) {
        return [
          {
            id: '',
            label: 'No forms available',
            disabled: true,
          },
        ];
      }

      // Map forms to ComboBox items with proper labeling for already selected forms
      const results = availableForms.map((form: ObservationForm) => {
        const isAlreadySelected = selectedForms.some(
          (selected: ObservationForm) => selected.uuid === form.uuid,
        );

        return {
          id: form.uuid,
          label: isAlreadySelected
            ? `${form.name} (${t('OBSERVATION_FORMS_FORM_ALREADY_ADDED')})`
            : form.name,
          disabled: isAlreadySelected,
        };
      });

      return results;
    }, [
      isSearchLoading,
      searchError,
      searchTerm,
      availableForms,
      selectedForms,
      t,
    ]);

    return (
      <Tile
        className={styles.observationFormsTile}
        data-testid="observation-forms-tile"
      >
        <div
          className={styles.observationFormsTitle}
          data-testid="observation-forms-title"
        >
          {t('OBSERVATION_FORMS_SECTION_TITLE')}
        </div>

        <div data-testid="observation-forms-search-section">
          <ComboBox
            id="observation-forms-search"
            placeholder={t('OBSERVATION_FORMS_SEARCH_PLACEHOLDER')}
            items={searchResults}
            itemToString={(item) => item?.label ?? ''}
            onChange={handleOnChange}
            onInputChange={handleSearch}
            size="md"
            autoAlign
            disabled={isSearchLoading}
            aria-label={t('OBSERVATION_FORMS_SEARCH_ARIA_LABEL')}
            data-testid="observation-forms-search-combobox"
          />
        </div>

        {selectedForms && selectedForms.length > 0 && (
          <div data-testid="added-forms-section">
            <FormCardContainer
              title={t('OBSERVATION_FORMS_ADDED_FORMS')}
              dataTestId="added-forms-container"
            >
              {selectedForms.map((form: ObservationForm) => {
                const savedFormData = getFormData(form.uuid);
                const validationState = savedFormData?.validationState;

                // Show error indicator for all validation error types
                const showError =
                  validationState === VALIDATION_STATE_MANDATORY ||
                  validationState === VALIDATION_STATE_INVALID ||
                  validationState === VALIDATION_STATE_EMPTY ||
                  validationState === VALIDATION_STATE_SCRIPT_ERROR;
                const errorMessage = showError
                  ? t(
                      `OBSERVATION_ADDED_FORM_VALIDATION_ERROR_TITLE_${validationState.toUpperCase()}`,
                    )
                  : undefined;

                return (
                  <FormCard
                    key={form.uuid}
                    title={form.name}
                    icon="fa-file-lines"
                    actionIcon="fa-times"
                    onOpen={() => onFormSelect?.(form)}
                    onActionClick={() => onRemoveForm?.(form.uuid)}
                    dataTestId={`selected-form-${form.uuid}`}
                    ariaLabel={`Open ${form.name} form`}
                    errorMessage={errorMessage}
                  />
                );
              })}
            </FormCardContainer>
          </div>
        )}

        <div data-testid="pinned-forms-section">
          <FormCardContainer
            title={t('DEFAULT_AND_PINNED_FORMS_TITLE')}
            showNoFormsMessage={
              !isAllFormsLoading &&
              allPinnedForms.length === 0 &&
              defaultPinnedForms.length === 0
            }
            noFormsMessage={t('DEFAULT_AND_PINNED_FORMS_NO_FORMS_FOUND')}
            dataTestId="pinned-forms-container"
          >
            {isAllFormsLoading || isPinnedFormsLoading ? (
              <SkeletonText
                width="100%"
                lineCount={3}
                testId="pinned-forms-skeleton"
              />
            ) : (
              allPinnedForms.map((form: ObservationForm) => (
                <FormCard
                  key={form.uuid}
                  title={form.name}
                  icon="fa-file-lines"
                  actionIcon={
                    !DEFAULT_FORM_API_NAMES.includes(form.name)
                      ? 'fa-thumbtack'
                      : undefined
                  }
                  onOpen={() => onFormSelect?.(form)}
                  onActionClick={() => {
                    const newPinnedForms = pinnedForms.filter(
                      (f) => f.uuid !== form.uuid,
                    );
                    updatePinnedForms(newPinnedForms);
                  }}
                  dataTestId={`pinned-form-${form.uuid}`}
                  ariaLabel={`Open ${form.name} form`}
                />
              ))
            )}
          </FormCardContainer>
        </div>
      </Tile>
    );
  },
);

ObservationForms.displayName = 'ObservationForms';

export default ObservationForms;
