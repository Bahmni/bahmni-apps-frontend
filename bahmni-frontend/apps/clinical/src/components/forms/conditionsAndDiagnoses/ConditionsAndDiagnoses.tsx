import { ComboBox, Tile } from '@bahmni-frontend/bahmni-design-system';
import { BoxWHeader, SelectedItem } from '@bahmni-frontend/bahmni-design-system';
import React, { useState, useMemo } from 'react';
import { useTranslation, type ConceptSearch } from '@bahmni-frontend/bahmni-services';
import { useConceptSearch } from '../../../hooks/useConceptSearch';
import useConditions from '../../../hooks/useConditions';
import { useConditionsAndDiagnosesStore } from '../../../stores/conditionsAndDiagnosesStore';
import SelectedConditionItem from './SelectedConditionItem';
import SelectedDiagnosisItem from './SelectedDiagnosisItem';
import styles from './styles/ConditionsAndDiagnoses.module.scss';

/**
 * ConditionsAndDiagnoses component
 *
 * A component that displays a search interface for diagnoses and a list of selected diagnoses.
 * It allows users to search for diagnoses, select them, and specify the certainty level.
 */
const ConditionsAndDiagnoses: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const [searchDiagnosesTerm, setSearchDiagnosesTerm] = useState('');

  // Use Zustand store
  const {
    selectedDiagnoses,
    selectedConditions,
    addDiagnosis,
    removeDiagnosis,
    updateCertainty,
    markAsCondition,
    removeCondition,
    updateConditionDuration,
  } = useConditionsAndDiagnosesStore();

  // Use concept search hook for diagnoses
  const {
    searchResults,
    loading: isSearchLoading,
    error: searchError,
  } = useConceptSearch(searchDiagnosesTerm);

  const {
    conditions: existingConditions,
    loading: existingConditionsLoading,
    error: existingConditionsError,
  } = useConditions();

  const handleSearch = (searchTerm: string) => {
    setSearchDiagnosesTerm(searchTerm);
  };

  const handleOnChange = (selectedItem: ConceptSearch) => {
    if (!selectedItem?.conceptUuid || !selectedItem.conceptName) {
      return;
    }

    addDiagnosis(selectedItem);
  };

  const isConditionDuplicate = (diagnosisId: string): boolean => {
    const isExistingCondition = existingConditions.some(
      (d: any) => d.code?.coding?.[0]?.code === diagnosisId,
    );
    const isSelectedConditions =
      selectedConditions?.some((condition) => condition.id === diagnosisId) ||
      false;
    return isExistingCondition || isSelectedConditions;
  };

  const filteredSearchResults: ConceptSearch[] = useMemo(() => {
    if (searchDiagnosesTerm.length === 0) return [];
    if (isSearchLoading || existingConditionsLoading) {
      return [
        {
          conceptName: t('LOADING_CONCEPTS'),
          conceptUuid: '',
          matchedName: '',
          disabled: true,
        },
      ];
    }
    const isSearchEmpty = searchResults.length === 0 && !searchError;

    if (isSearchEmpty) {
      return [
        {
          conceptName: t('NO_MATCHING_DIAGNOSIS_FOUND'),
          conceptUuid: '',
          matchedName: '',
          disabled: true,
        },
      ];
    }

    if (searchError || existingConditionsError) {
      return [
        {
          conceptName: t('ERROR_FETCHING_CONCEPTS'),
          conceptUuid: '',
          matchedName: '',
          disabled: true,
        },
      ];
    }

    return searchResults.map((item) => {
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
  }, [
    isSearchLoading,
    existingConditionsLoading,
    searchResults,
    searchDiagnosesTerm,
    searchError,
    existingConditionsError,
    selectedDiagnoses,
    t,
  ]);

  return (
    <Tile className={styles.conditionsAndDiagnosesTile}>
      <div className={styles.conditionsAndDiagnosesTitle}>
        {t('CONDITIONS_AND_DIAGNOSES_FORM_TITLE')}
      </div>
      <ComboBox
        id="diagnoses-search"
        placeholder={t('DIAGNOSES_SEARCH_PLACEHOLDER')}
        items={filteredSearchResults}
        itemToString={(item: any) => item?.conceptName ?? ''}
        onChange={(data: any) => handleOnChange(data.selectedItem!)}
        onInputChange={(searchQuery: string) => handleSearch(searchQuery)}
        size="md"
        autoAlign
        aria-label={t('DIAGNOSES_SEARCH_ARIA_LABEL')}
      />
      {selectedDiagnoses && selectedDiagnoses.length > 0 && (
        <BoxWHeader
          title={t('DIAGNOSES_ADDED_DIAGNOSES')}
          className={styles.conditionsAndDiagnosesBox}
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
                onMarkAsCondition={() => markAsCondition(diagnosis.id)}
                doesConditionExist={isConditionDuplicate(diagnosis.id)}
              />
            </SelectedItem>
          ))}
        </BoxWHeader>
      )}
      {selectedConditions && selectedConditions.length > 0 && (
        <BoxWHeader
          title={t('CONDITIONS_SECTION_TITLE')}
          className={styles.conditionsAndDiagnosesBox}
        >
          {selectedConditions.map((condition) => (
            <SelectedItem
              key={condition.id}
              className={styles.selectedConditionItem}
              onClose={() => removeCondition(condition.id)}
            >
              <SelectedConditionItem
                condition={condition}
                updateConditionDuration={updateConditionDuration}
              />
            </SelectedItem>
          ))}
        </BoxWHeader>
      )}
    </Tile>
  );
});

ConditionsAndDiagnoses.displayName = 'ConditionsAndDiagnoses';

export default ConditionsAndDiagnoses;