import {
  Icon,
  BoxWHeader,
  SelectedItem,
  ICON_SIZE,
  ICON_PADDING,
  ComboBox,
  Tile,
  FormCard,
} from '@bahmni-frontend/bahmni-design-system';
import { ObservationForm } from '@bahmni-frontend/bahmni-services';
import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import useObservationFormsSearch from '../../../hooks/useObservationFormsSearch';
import styles from './styles/ObservationForms.module.scss';

interface ObservationFormsProps {
  onFormSelect?: (form: ObservationForm) => void;
  selectedForms?: ObservationForm[];
  onRemoveForm?: (formUuid: string) => void;
  pinnedForms?: ObservationForm[];
  onPinToggle?: (form: ObservationForm) => void;
  onUnpinForm?: (formUuid: string) => void;
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
export const defaultFormNames = ['History and Examination', 'Vitals'];
const ObservationForms: React.FC<ObservationFormsProps> = React.memo(
  ({ onFormSelect, selectedForms = [], onRemoveForm, pinnedForms = [], onPinToggle, onUnpinForm }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');

    // Use the observation forms search hook
    const {
      forms: availableForms,
      isLoading,
      error,
    } = useObservationFormsSearch(searchTerm);


    const defaultPinnedForms = availableForms.filter(form =>
      defaultFormNames.includes(form.name)
    );

    // Merge with user-pinned forms (avoid duplicates)
    const userPinnedUuids = pinnedForms.map(f => f.uuid);

    // Step 1: Get default forms that user hasn't pinned, sorted alphabetically
    const sortedDefaultForms = defaultPinnedForms
      .filter(f => !userPinnedUuids.includes(f.uuid))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Step 2: Get user-pinned forms, sorted alphabetically  
    const sortedUserPinnedForms = [...pinnedForms]
      .sort((a, b) => a.name.localeCompare(b.name));

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

    const handleRemoveForm = useCallback(
      (formUuid: string) => {
        onRemoveForm?.(formUuid);
      },
      [onRemoveForm],
    );

    const searchResults = useMemo(() => {
      if (isLoading) {
        return [
          {
            id: '',
            label: t('OBSERVATION_FORMS_LOADING_FORMS'),
            disabled: true,
          },
        ];
      }

      if (error) {
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
    }, [isLoading, error, searchTerm, availableForms, selectedForms, t]);

    return (
      <Tile className={styles.observationFormsTile}>
        <div className={styles.observationFormsTitle}>
          {t('OBSERVATION_FORMS_SECTION_TITLE')}
        </div>

        <ComboBox
          id="observation-forms-search"
          placeholder={t('OBSERVATION_FORMS_SEARCH_PLACEHOLDER')}
          items={searchResults}
          itemToString={(item) => item?.label ?? ''}
          onChange={handleOnChange}
          onInputChange={handleSearch}
          size="md"
          autoAlign
          disabled={isLoading}
          aria-label={t('OBSERVATION_FORMS_SEARCH_ARIA_LABEL')}
        />

        {selectedForms && selectedForms.length > 0 && (
          <BoxWHeader
            title={t('OBSERVATION_FORMS_ADDED_FORMS')}
            className={styles.observationFormsBox}
          >
            {selectedForms.map((form: ObservationForm) => (
              <SelectedItem
                key={form.uuid}
                className={styles.selectedObservationFormItem}
                onClose={() => handleRemoveForm(form.uuid)}
              >
                <div
                  className={styles.selectedFormContent}
                  onClick={() => onFormSelect?.(form)}
                >
                  <div className={styles.selectedFormHeader}>
                    <Icon
                      id="fa-file-lines"
                      name="fa-file-lines"
                      size={ICON_SIZE.LG}
                      padding={ICON_PADDING.NONE}
                    />
                    <div className={styles.selectedFormName}>{form.name}</div>
                  </div>
                </div>
              </SelectedItem>
            ))}
          </BoxWHeader>
        )}

        {/* Pinned And Popular Forms Section - Now comes second */}
        <div className={styles.pinnedFormsSection}>
          <div className={styles.observationFormsBox}>
            {t('DEFAULT_AND_PINNED_FORMS_TITLE')}
          </div>

          {allPinnedForms.length > 0 ? (
            <div className={styles.pinnedFormsGrid}>
              {allPinnedForms.map((form: ObservationForm) => (
                <FormCard
                  key={form.uuid}
                  title={form.name}
                  icon="fa-file-lines"
                  actionIcon={!defaultFormNames.includes(form.name) ? "fa-thumbtack" : undefined}
                  onOpen={() => onFormSelect?.(form)}
                  onActionClick={() => onUnpinForm?.(form.uuid)}
                  dataTestId={`pinned-form-${form.uuid}`}
                  ariaLabel={`Open ${form.name} form`}
                />
              ))}
            </div>
          ) : (
            <div className={styles.noFormsMessage}>
              {t('DEFAULT_AND_PINNED_FORMS_NO_FORMS_FOUND')}
            </div>
          )}
        </div>
      </Tile>
    );
  },
);

ObservationForms.displayName = 'ObservationForms';

export default ObservationForms;
