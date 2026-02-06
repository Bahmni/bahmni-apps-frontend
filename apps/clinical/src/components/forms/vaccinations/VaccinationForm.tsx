import {
  BoxWHeader,
  SelectedItem,
  ComboBox,
  DropdownSkeleton,
  Tile,
} from '@bahmni/design-system';
import { useTranslation, getVaccinations } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useState, useMemo, useRef } from 'react';

import useMedicationConfig from '../../../hooks/useMedicationConfig';
import { MedicationFilterResult } from '../../../models/medication';
import {
  getMedicationDisplay,
  getMedicationsFromBundle,
} from '../../../services/medicationService';
import { useVaccinationStore } from '../../../stores/vaccinationsStore';
import SelectedVaccinationItem from './SelectedVaccinationItem';
import styles from './styles/VaccinationForm.module.scss';

/**
 * VaccinationForm component
 *
 * A component that displays a search interface for vaccinations and a list of selected vaccinations.
 * It allows users to search for vaccinations, select them, and specify dosage, frequency, route, timing, and duration.
 */
const VaccinationForm: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const [searchVaccinationTerm, setSearchVaccinationTerm] = useState('');
  const isSelectingRef = useRef(false);
  const {
    medicationConfig,
    loading: medicationConfigLoading,
    error: medicationConfigError,
  } = useMedicationConfig();

  const {
    data: vaccinationsBundle,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ['vaccinations'],
    queryFn: getVaccinations,
  });

  // Extract medications from bundle
  const searchResults = vaccinationsBundle
    ? getMedicationsFromBundle(vaccinationsBundle)
    : [];

  const {
    selectedVaccinations,
    addVaccination,
    removeVaccination,
    updateDosage,
    updateDosageUnit,
    updateFrequency,
    updateRoute,
    updateDuration,
    updateDurationUnit,
    updateInstruction,
    updateisSTAT,
    updateDispenseQuantity,
    updateDispenseUnit,
    updateStartDate,
    updateNote,
  } = useVaccinationStore();

  const handleSearch = (searchTerm: string) => {
    // Only update search term if we're not in the process of selecting an item
    if (!isSelectingRef.current) {
      setSearchVaccinationTerm(searchTerm);
    }
  };

  const handleOnChange = (selectedItem: MedicationFilterResult) => {
    if (!selectedItem) {
      return;
    }
    isSelectingRef.current = true;
    addVaccination(selectedItem.medication!, selectedItem.displayName);
    setSearchVaccinationTerm('');
    // Reset the flag after a short delay to allow ComboBox to update
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 100);
  };

  const filteredSearchResults = useMemo(() => {
    if (!searchVaccinationTerm || searchVaccinationTerm.trim() === '') {
      return [];
    }
    if (loading) {
      return [
        {
          displayName: t('LOADING_VACCINATIONS'),
          disabled: true,
        },
      ];
    }
    if (error) {
      return [
        {
          displayName: t('ERROR_SEARCHING_VACCINATIONS', {
            error: (error as Error).message,
          }),
          disabled: true,
        },
      ];
    }
    if (!searchResults || searchResults.length === 0) {
      return [
        {
          displayName: t('NO_MATCHING_VACCINATIONS_FOUND'),
          disabled: true,
        },
      ];
    }

    // Filter vaccines based on search term
    const filtered = searchResults.filter((item) => {
      const displayName = getMedicationDisplay(item).toLowerCase();
      return displayName.includes(searchVaccinationTerm.toLowerCase());
    });

    if (filtered.length === 0) {
      return [
        {
          displayName: t('NO_MATCHING_VACCINATIONS_FOUND'),
          disabled: true,
        },
      ];
    }

    return filtered.map((item) => {
      const isAlreadySelected = selectedVaccinations.some(
        (v) => v.id === item.id,
      );
      return {
        medication: item,
        displayName: isAlreadySelected
          ? `${getMedicationDisplay(item)} (${t('VACCINATION_ALREADY_SELECTED')})`
          : getMedicationDisplay(item),
        disabled: isAlreadySelected,
      };
    });
  }, [
    searchVaccinationTerm,
    loading,
    error,
    searchResults,
    selectedVaccinations,
    t,
  ]);

  return (
    <Tile
      className={styles.vaccinationFormTile}
      data-testid="vaccination-form-tile"
    >
      <div
        className={styles.vaccinationFormTitle}
        data-testid="vaccination-form-title"
      >
        {t('VACCINATION_FORM_TITLE')}
      </div>
      {medicationConfigLoading && <DropdownSkeleton />}
      {medicationConfigError && (
        <div>
          {t('ERROR_FETCHING_VACCINATION_CONFIG', {
            error: medicationConfigError.message,
          })}
        </div>
      )}
      {!medicationConfigLoading && !medicationConfigError && (
        <ComboBox
          id="vaccinations-search"
          data-testid="vaccinations-search-combobox"
          placeholder={t('VACCINATION_SEARCH_PLACEHOLDER')}
          items={filteredSearchResults}
          itemToString={(item) => (item ? item.displayName : '')}
          onChange={(data) => handleOnChange(data.selectedItem!)}
          onInputChange={(searchQuery: string) => handleSearch(searchQuery)}
          size="md"
          autoAlign
          aria-label={t('VACCINATION_SEARCH_PLACEHOLDER')}
        />
      )}
      {medicationConfig &&
        selectedVaccinations &&
        selectedVaccinations.length > 0 && (
          <BoxWHeader
            title={t('VACCINATION_ADDED_VACCINATIONS')}
            className={styles.vaccinationBox}
          >
            {selectedVaccinations.map((vaccination) => (
              <SelectedItem
                onClose={() => removeVaccination(vaccination.id)}
                className={styles.selectedVaccinationItem}
                key={vaccination.id}
              >
                <SelectedVaccinationItem
                  vaccinationInputEntry={vaccination}
                  medicationConfig={medicationConfig!}
                  updateDosage={updateDosage}
                  updateDosageUnit={updateDosageUnit}
                  updateFrequency={updateFrequency}
                  updateRoute={updateRoute}
                  updateDuration={updateDuration}
                  updateDurationUnit={updateDurationUnit}
                  updateInstruction={updateInstruction}
                  updateisSTAT={updateisSTAT}
                  updateDispenseQuantity={updateDispenseQuantity}
                  updateDispenseUnit={updateDispenseUnit}
                  updateStartDate={updateStartDate}
                  updateNote={updateNote}
                />
              </SelectedItem>
            ))}
          </BoxWHeader>
        )}
    </Tile>
  );
});

VaccinationForm.displayName = 'VaccinationForm';

export default VaccinationForm;
