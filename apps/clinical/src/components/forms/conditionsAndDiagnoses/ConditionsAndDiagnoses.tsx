import {
  ComboBox,
  Tile,
  BoxWHeader,
  SelectedItem,
} from '@bahmni/design-system';
import {
  useTranslation,
  type ConceptSearch,
  getConditions,
} from '@bahmni/services';
import {
  conditionsQueryKeys,
  useNotification,
  usePatientUUID,
} from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import React, { useState, useMemo, useEffect } from 'react';
import { useConceptSearch } from '../../../hooks/useConceptSearch';
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
  const patientUUID = usePatientUUID();
  const { addNotification } = useNotification();
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
    data: existingConditions,
    isLoading: existingConditionsLoading,
    error: existingConditionsError,
  } = useQuery({
    queryKey: conditionsQueryKeys(patientUUID!),
    enabled: !!patientUUID,
    queryFn: () => getConditions(patientUUID!),
  });

  useEffect(() => {
    if (existingConditionsError) {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: existingConditionsError.message,
        type: 'error',
      });
    }
  }, [existingConditionsLoading, existingConditionsError, addNotification, t]);

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
    const isExistingCondition = existingConditions!.some(
      (d) => d.code === diagnosisId,
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
        itemToString={(item) => item?.conceptName ?? ''}
        onChange={(data) => handleOnChange(data.selectedItem!)}
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
