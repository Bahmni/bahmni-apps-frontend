import { ComboBox, DropdownSkeleton, Tile } from '@carbon/react';
import React, { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import BoxWHeader from '@components/common/boxWHeader/BoxWHeader';
import SelectedItem from '@components/common/selectedItem/SelectedItem';
import useMedicationConfig from '@hooks/useMedicationConfig';
import { useMedicationSearch } from '@hooks/useMedicationSearch';
import { getMedicationDisplay } from '@services/medicationService';
import { useMedicationStore } from '@stores/medicationsStore';
import { MedicationFilterResult } from '@types/medication';
import SelectedMedicationItem from './SelectedMedicationItem';
import * as styles from './styles/MedicationsForm.module.scss';

/**
 * MedicationsForm component
 *
 * A component that displays a search interface for medications and a list of selected medications.
 * It allows users to search for medications, select them, and specify dosage, frequency, route, timing, and duration.
 */
const MedicationsForm: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const [searchMedicationTerm, setSearchMedicationTerm] = useState('');
  const isSelectingRef = useRef(false);
  const {
    medicationConfig,
    loading: medicationConfigLoading,
    error: medicationConfigError,
  } = useMedicationConfig();
  const { searchResults, loading, error } =
    useMedicationSearch(searchMedicationTerm);

  // Use Zustand store
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
    updateStartDate,
  } = useMedicationStore();

  const handleSearch = (searchTerm: string) => {
    // Only update search term if we're not in the process of selecting an item
    if (!isSelectingRef.current) {
      setSearchMedicationTerm(searchTerm);
    }
  };

  const handleOnChange = (selectedItem: MedicationFilterResult) => {
    if (!selectedItem) {
      return;
    }
    // Set flag to prevent search when ComboBox updates its input
    isSelectingRef.current = true;
    addMedication(selectedItem.medication!, selectedItem.displayName);
    // Clear the search term after selection
    setSearchMedicationTerm('');
    // Reset the flag after a short delay to allow ComboBox to update
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 100);
  };

  const filteredSearchResults = useMemo(() => {
    if (!searchMedicationTerm || searchMedicationTerm.trim() === '') {
      return [];
    }
    if (loading) {
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
      const isAlreadySelected = selectedMedications.some(
        (m) => m.id === item.id,
      );
      return {
        medication: item,
        displayName: isAlreadySelected
          ? `${getMedicationDisplay(item)} (${t('MEDICATION_ALREADY_SELECTED')})`
          : getMedicationDisplay(item),
        disabled: isAlreadySelected,
      };
    });
  }, [
    searchMedicationTerm,
    loading,
    error,
    searchResults,
    selectedMedications,
    t,
  ]);

  return (
    <Tile className={styles.medicationsFormTile}>
      <div className={styles.medicationsFormTitle}>
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
          placeholder={t('MEDICATIONS_SEARCH_PLACEHOLDER')}
          items={filteredSearchResults}
          itemToString={(item) => (item ? item.displayName : '')}
          onChange={(data) => handleOnChange(data.selectedItem!)}
          onInputChange={(searchQuery: string) => handleSearch(searchQuery)}
          size="md"
          autoAlign
          aria-label={t('MEDICATIONS_SEARCH_PLACEHOLDER')}
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
