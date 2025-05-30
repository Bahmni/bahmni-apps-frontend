import React, { useState } from 'react';
import { ComboBox, Tile } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import * as styles from './styles/DiagnosesForm.module.scss';
import SelectedItem from '@components/common/selectedItem/SelectedItem';
import BoxWHeader from '@components/common/boxWHeader/BoxWHeader';
import { ConceptSearch } from '@types/concepts';
import SelectedDiagnosisItem from './SelectedDiagnosisItem';
import { useConceptSearch } from '@/hooks/useConceptSearch';
import { useDiagnosisStore } from '@stores/diagnosisStore';

/**
 * DiagnosesForm component
 *
 * A component that displays a search interface for diagnoses and a list of selected diagnoses.
 * It allows users to search for diagnoses, select them, and specify the certainty level.
 */
const DiagnosesForm: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const [searchDiagnosesTerm, setSearchDiagnosesTerm] = useState('');

  // Use Zustand store
  const { selectedDiagnoses, addDiagnosis, removeDiagnosis, updateCertainty } =
    useDiagnosisStore();

  // Use concept search hook for diagnoses
  const {
    searchResults,
    loading: isSearchLoading,
    error: searchError,
  } = useConceptSearch(searchDiagnosesTerm);

  const handleSearch = (searchTerm: string) => {
    setSearchDiagnosesTerm(searchTerm);
  };

  const handleOnChange = (selectedItem: ConceptSearch) => {
    if (
      !selectedItem ||
      !selectedItem.conceptUuid ||
      !selectedItem.conceptName
    ) {
      return;
    }

    addDiagnosis(selectedItem);
  };

  const isSearchEmpty =
    searchResults.length === 0 &&
    !isSearchLoading &&
    searchDiagnosesTerm.length > 2 &&
    !searchError;

  const selectedDiagnosisItems = isSearchLoading
    ? [
        {
          conceptName: t('LOADING_CONCEPTS'),
          conceptUuid: '',
          matchedName: '',
          disabled: true,
        },
      ]
    : isSearchEmpty
      ? [
          {
            conceptName: t('NO_MATCHING_CONCEPTS_FOUND'),
            conceptUuid: '',
            matchedName: '',
            disabled: true,
          },
        ]
      : searchResults.map((item) => {
          const isAlreadySelected = selectedDiagnoses.some(
            (d) => d.id === item.conceptUuid,
          );
          return {
            ...item,
            conceptName: isAlreadySelected
              ? `${item.conceptName} ${t('DIAGNOSIS_ALREADY_SELECTED')}`
              : item.conceptName,
            disabled: isAlreadySelected,
          };
        });

  return (
    <Tile className={styles.diagnosesFormTile}>
      <div className={styles.diagnosesFormTitle}>
        {t('DIAGNOSES_FORM_TITLE')}
      </div>
      <ComboBox
        id="diagnoses-search"
        placeholder={t('DIAGNOSES_SEARCH_PLACEHOLDER')}
        items={selectedDiagnosisItems}
        itemToString={(item) => (item?.conceptName ? item.conceptName : '')}
        onChange={(data) => handleOnChange(data.selectedItem!)}
        onInputChange={(searchQuery: string) => handleSearch(searchQuery)}
        size="lg"
        autoAlign
        aria-label={t('DIAGNOSES_SEARCH_ARIA_LABEL')}
      />
      {selectedDiagnoses && selectedDiagnoses.length > 0 && (
        <BoxWHeader
          title={t('DIAGNOSES_ADDED_DIAGNOSES')}
          className={styles.diagnosesBox}
        >
          {selectedDiagnoses.map((diagnosis) => (
            <SelectedItem
              key={diagnosis.id}
              className={styles.selectedDiagnosisItem}
              onClose={() => removeDiagnosis(diagnosis.id)}
            >
              <SelectedDiagnosisItem
                diagnosis={diagnosis}
                updateCertainty={updateCertainty}
              />
            </SelectedItem>
          ))}
        </BoxWHeader>
      )}
    </Tile>
  );
});

DiagnosesForm.displayName = 'DiagnosesForm';

export default DiagnosesForm;
