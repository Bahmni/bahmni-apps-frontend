import {
  BoxWHeader,
  SelectedItem,
  ComboBox,
  DropdownSkeleton,
  Tile,
  InlineNotification,
} from '@bahmni/design-system';
import {
  useTranslation,
  getPatientMedicationBundle,
  useSubscribeConsultationSaved,
  ConsultationSavedEventPayload,
} from '@bahmni/services';
import { useNotification, usePatientUUID } from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import { Bundle } from 'fhir/r4';
import React, { useState, useMemo, useRef, useEffect } from 'react';

import useMedicationConfig from '../../../hooks/useMedicationConfig';
import { useMedicationSearch } from '../../../hooks/useMedicationSearch';
import { MedicationFilterResult } from '../../../models/medication';
import {
  getMedicationDisplay,
  getActiveMedicationsFromBundle,
} from '../../../services/medicationService';
import { useMedicationStore } from '../../../stores/medicationsStore';
import {
  checkMedicationsOverlap,
  medicationsMatchByCode,
} from '../../../utils/fhir/medicationUtilities';
import SelectedMedicationItem from './SelectedMedicationItem';
import styles from './styles/MedicationsForm.module.scss';

/**
 * MedicationsForm component
 *
 * A component that displays a search interface for medications and a list of selected medications.
 * It allows users to search for medications, select them, and specify dosage, frequency, route, timing, and duration.
 */

const MedicationsForm: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
  const { addNotification } = useNotification();
  const [searchMedicationTerm, setSearchMedicationTerm] = useState('');
  const [showDuplicateNotification, setShowDuplicateNotification] =
    useState(false);
  const isSelectingRef = useRef(false);
  const [selectedMedicationItem, setSelectedMedicationItem] =
    useState<MedicationFilterResult | null>(null);
  const {
    medicationConfig,
    loading: medicationConfigLoading,
    error: medicationConfigError,
  } = useMedicationConfig();
  const { searchResults, loading, error } =
    useMedicationSearch(searchMedicationTerm);

  const {
    selectedMedications,
    addMedication,
    removeMedication,
    updateDosage,
    updateDosageUnit,
    updateFrequency,
    updateRoute,
    updateDuration,
    updateDurationUnit,
    updateInstruction,
    updateisPRN,
    updateisSTAT,
    updateDispenseQuantity,
    updateDispenseUnit,
    updateNote,
    updateStartDate,
    setOverlapDuplicates,
  } = useMedicationStore();

  const {
    data: medicationBundle,
    isLoading: existingMedicationsLoading,
    error: existingMedicationsError,
    refetch: refetchMedications,
  } = useQuery<Bundle>({
    queryKey: ['medications', patientUUID!],
    enabled: !!patientUUID && patientUUID.trim().length > 0,
    queryFn: () =>
      getPatientMedicationBundle(patientUUID!, [], undefined, true),
    refetchOnMount: 'always',
  });

  useSubscribeConsultationSaved(
    (payload: ConsultationSavedEventPayload) => {
      if (
        payload.patientUUID === patientUUID &&
        payload.updatedResources.medications
      ) {
        refetchMedications();
      }
    },
    [patientUUID, refetchMedications],
  );

  const { activeMedications, medicationMap } = useMemo(
    () => getActiveMedicationsFromBundle(medicationBundle),
    [medicationBundle],
  );

  useEffect(() => {
    if (existingMedicationsError) {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: existingMedicationsError.message,
        type: 'error',
      });
    }
  }, [existingMedicationsError, addNotification, t]);

  // Monitor selected medications and update notification based on current overlap status
  useEffect(() => {
    const hasOverlaps = checkMedicationsOverlap(
      selectedMedications,
      activeMedications,
      medicationMap,
    );
    setShowDuplicateNotification(hasOverlaps);
    setOverlapDuplicates(hasOverlaps);
  }, [
    selectedMedications,
    activeMedications,
    medicationMap,
    setOverlapDuplicates,
  ]);

  const handleSearch = (searchTerm: string) => {
    if (!isSelectingRef.current) {
      setSearchMedicationTerm(searchTerm);
    }
  };

  const handleOnChange = (selectedItem: MedicationFilterResult) => {
    if (!selectedItem?.medication?.id) {
      return;
    }

    const displayName = getMedicationDisplay(selectedItem.medication);

    isSelectingRef.current = true;
    addMedication(selectedItem.medication, displayName);
    setSearchMedicationTerm('');
    setSelectedMedicationItem(selectedItem);
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 100);
  };

  const filteredSearchResults = useMemo(() => {
    if (!searchMedicationTerm || searchMedicationTerm.trim() === '') {
      return [];
    }
    if (loading || existingMedicationsLoading) {
      return [
        {
          displayName: t('LOADING_MEDICATIONS'),
          disabled: true,
        },
      ];
    }
    if (error) {
      return [
        {
          displayName: t('ERROR_SEARCHING_MEDICATIONS', {
            error: error.message,
          }),
          disabled: true,
        },
      ];
    }
    if (!searchResults || searchResults.length === 0) {
      return [
        {
          displayName: t('NO_MATCHING_MEDICATIONS_FOUND'),
          disabled: true,
        },
      ];
    }

    return searchResults.map((item) => {
      const itemDisplayName = getMedicationDisplay(item);
      const isAlreadySelected = selectedMedications.some((selected) =>
        medicationsMatchByCode(item, selected.medication),
      );

      return {
        medication: item,
        displayName: isAlreadySelected
          ? `${itemDisplayName} (${t('MEDICATIONS_ALREADY_ADDED')})`
          : itemDisplayName,
        disabled: isAlreadySelected,
      };
    });
  }, [
    searchMedicationTerm,
    loading,
    existingMedicationsLoading,
    error,
    searchResults,
    selectedMedications,
    t,
  ]);

  return (
    <Tile
      className={styles.medicationsFormTile}
      data-testid="medications-form-tile"
    >
      <div
        className={styles.medicationsFormTitle}
        data-testid="medications-form-title"
      >
        {t('MEDICATIONS_FORM_TITLE')}
      </div>
      {medicationConfigLoading && <DropdownSkeleton />}
      {medicationConfigError && (
        <div>
          {t('ERROR_FETCHING_MEDICATION_CONFIG', {
            error: medicationConfigError.message,
          })}
        </div>
      )}
      {!medicationConfigLoading && !medicationConfigError && (
        <ComboBox
          id="medications-search"
          data-testid="medications-search-combobox"
          placeholder={t('MEDICATIONS_SEARCH_PLACEHOLDER')}
          items={filteredSearchResults}
          itemToString={(item) => (item ? item.displayName : '')}
          onChange={(data) => handleOnChange(data.selectedItem!)}
          onInputChange={(searchQuery: string) => handleSearch(searchQuery)}
          selectedItem={selectedMedicationItem}
          clearSelectedOnChange
          allowCustomValue
          size="md"
          autoAlign
          disabled={existingMedicationsLoading}
          aria-label={t('MEDICATIONS_SEARCH_PLACEHOLDER')}
        />
      )}
      {showDuplicateNotification && (
        <InlineNotification
          kind="error"
          lowContrast
          subtitle={t('ERROR_DUPLICATE_ACTIVE_MEDICATION')}
          onClose={() => setShowDuplicateNotification(false)}
          hideCloseButton={false}
          className={styles.duplicateNotification}
        />
      )}
      {medicationConfig &&
        selectedMedications &&
        selectedMedications.length > 0 && (
          <BoxWHeader
            title={t('MEDICATIONS_ADDED_MEDICATIONS')}
            className={styles.medicationsBox}
          >
            {selectedMedications.map((medication) => (
              <SelectedItem
                onClose={() => removeMedication(medication.id)}
                className={styles.selectedMedicationItem}
                key={medication.id}
              >
                <SelectedMedicationItem
                  medicationInputEntry={medication}
                  medicationConfig={medicationConfig!}
                  updateDosage={updateDosage}
                  updateDosageUnit={updateDosageUnit}
                  updateFrequency={updateFrequency}
                  updateRoute={updateRoute}
                  updateDuration={updateDuration}
                  updateDurationUnit={updateDurationUnit}
                  updateInstruction={updateInstruction}
                  updateisPRN={updateisPRN}
                  updateisSTAT={updateisSTAT}
                  updateDispenseQuantity={updateDispenseQuantity}
                  updateDispenseUnit={updateDispenseUnit}
                  updateNote={updateNote}
                  updateStartDate={updateStartDate}
                />
              </SelectedItem>
            ))}
          </BoxWHeader>
        )}
    </Tile>
  );
});

MedicationsForm.displayName = 'MedicationsForm';

export default MedicationsForm;
