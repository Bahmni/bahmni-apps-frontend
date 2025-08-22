import { ComboBox, Tile } from '@carbon/react';
import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Icon,
  BoxWHeader,
  SelectedItem,
  ICON_SIZE,
  ICON_PADDING
} from '@bahmni-frontend/bahmni-design-system';
import useObservationFormsSearch from '../../../hooks/useObservationFormsSearch';
import { ObservationForm } from '../../../models/observationForms';
import styles from './styles/ObservationForms.module.scss';

interface ObservationFormsProps {
  onFormSelect?: (form: ObservationForm) => void;
  selectedForms?: ObservationForm[];
  onRemoveForm?: (formUuid: string) => void;
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
  ({ onFormSelect, selectedForms = [], onRemoveForm }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');

    // Use the observation forms search hook
    const {
      forms: availableForms,
      isLoading,
      error,
    } = useObservationFormsSearch(searchTerm);

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
      </Tile>
    );
  },
);

ObservationForms.displayName = 'ObservationForms';

export default ObservationForms;
