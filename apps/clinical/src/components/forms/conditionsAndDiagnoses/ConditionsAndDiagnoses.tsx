import {
  ComboBox,
  Tile,
  BoxWHeader,
  SelectedItem,
  InlineNotification,
} from '@bahmni/design-system';
import {
  useTranslation,
  type ConceptSearch,
  getConditions,
  getPatientDiagnoses,
} from '@bahmni/services';
import { useNotification, usePatientUUID } from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  const [showDuplicateNotification, setShowDuplicateNotification] =
    useState(false);

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
    queryKey: ['conditions', patientUUID!],
    enabled: !!patientUUID,
    queryFn: () => getConditions(patientUUID!),
  });

  // Fetch existing diagnoses from backend
  const {
    data: existingDiagnoses,
    isLoading: existingDiagnosesLoading,
    error: existingDiagnosesError,
  } = useQuery({
    queryKey: ['diagnoses', patientUUID!],
    enabled: !!patientUUID,
    queryFn: () => getPatientDiagnoses(patientUUID!),
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

  useEffect(() => {
    if (existingDiagnosesError) {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: existingDiagnosesError.message,
        type: 'error',
      });
    }
  }, [existingDiagnosesLoading, existingDiagnosesError, addNotification, t]);

  const handleSearch = (searchTerm: string) => {
    setSearchDiagnosesTerm(searchTerm);
  };

  const isDuplicateDiagnosis = useCallback(
    (diagnosisId: string, diagnosisDisplay: string): boolean => {
      // Normalize for case-insensitive comparison (same as backend deduplication)
      const normalizedDisplay = diagnosisDisplay.toLowerCase().trim();

      // Check against existing diagnoses from backend by display name
      const isExistingDiagnosis = existingDiagnoses?.some(
        (d) => d.display.toLowerCase().trim() === normalizedDisplay,
      );

      // Check against currently selected diagnoses in the form by ID
      const isSelectedDiagnosis = selectedDiagnoses.some(
        (d) => d.id === diagnosisId,
      );

      // We need || here (not ??) because we're checking boolean false values
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      return !!(isExistingDiagnosis || isSelectedDiagnosis);
    },
    [existingDiagnoses, selectedDiagnoses],
  );

  const handleOnChange = (selectedItem: ConceptSearch | null) => {
    if (!selectedItem?.conceptUuid || !selectedItem.conceptName) {
      return;
    }

    // Check for duplicate BEFORE adding
    if (
      isDuplicateDiagnosis(selectedItem.conceptUuid, selectedItem.conceptName)
    ) {
      setShowDuplicateNotification(true);
      return; // Don't add duplicate!
    }

    // Successfully added, clear any previous duplicate notification
    setShowDuplicateNotification(false);
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
    if (
      isSearchLoading ||
      existingConditionsLoading ||
      existingDiagnosesLoading
    ) {
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
          ? `${item.conceptName} (${t('DIAGNOSIS_ALREADY_ADDED')})`
          : item.conceptName,
        disabled: isAlreadySelected,
      };
    });
  }, [
    isSearchLoading,
    existingConditionsLoading,
    existingDiagnosesLoading,
    searchResults,
    searchDiagnosesTerm,
    searchError,
    existingConditionsError,
    selectedDiagnoses,
    t,
  ]);

  return (
    <Tile
      className={styles.conditionsAndDiagnosesTile}
      data-testid="conditions-and-diagnoses-tile"
    >
      <div
        className={styles.conditionsAndDiagnosesTitle}
        data-testid="conditions-and-diagnoses-title"
      >
        {t('CONDITIONS_AND_DIAGNOSES_FORM_TITLE')}
      </div>
      <ComboBox
        id="diagnoses-search"
        data-testid="diagnoses-search-combobox"
        placeholder={t('DIAGNOSES_SEARCH_PLACEHOLDER')}
        items={filteredSearchResults}
        itemToString={(item) => item?.conceptName ?? ''}
        onChange={(data) => handleOnChange(data.selectedItem ?? null)}
        onInputChange={(searchQuery: string) => handleSearch(searchQuery)}
        size="md"
        autoAlign
        aria-label={t('DIAGNOSES_SEARCH_ARIA_LABEL')}
      />
      {showDuplicateNotification && (
        <InlineNotification
          kind="error"
          lowContrast
          subtitle={t('DIAGNOSIS_ALREADY_ADDED')}
          onClose={() => setShowDuplicateNotification(false)}
          hideCloseButton={false}
          className={styles.duplicateNotification}
        />
      )}
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
