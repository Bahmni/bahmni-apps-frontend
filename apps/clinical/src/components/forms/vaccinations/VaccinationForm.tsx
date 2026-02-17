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
  getVaccinations,
  getPatientMedicationBundle,
  useSubscribeConsultationSaved,
  ConsultationSavedEventPayload,
} from '@bahmni/services';
import { usePatientUUID } from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import { Bundle } from 'fhir/r4';
import React, { useState, useMemo, useRef, useEffect } from 'react';

import useMedicationConfig from '../../../hooks/useMedicationConfig';
import { MedicationFilterResult } from '../../../models/medication';
import {
  getMedicationDisplay,
  getMedicationsFromBundle,
  getActiveMedicationsFromBundle,
} from '../../../services/medicationService';
import { useVaccinationStore } from '../../../stores/vaccinationsStore';
import {
  checkMedicationsOverlap,
  isDuplicateMedication,
  medicationsMatchByCode,
} from '../../../utils/fhir/medicationUtilities';

import SelectedVaccinationItem from './SelectedVaccinationItem';
import styles from './styles/VaccinationForm.module.scss';

/**
 * VaccinationForm component
 *
 * Uses the same FHIR code-based overlap/duplicate detection as MedicationsForm.
 */
const VaccinationForm: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
  const [searchVaccinationTerm, setSearchVaccinationTerm] = useState('');
  const [showDuplicateNotification, setShowDuplicateNotification] =
    useState(false);
  const isSelectingRef = useRef(false);
  const [selectedVaccinationItem] = useState<MedicationFilterResult | null>(
    null,
  );
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

  const searchResults = useMemo(
    () =>
      vaccinationsBundle ? getMedicationsFromBundle(vaccinationsBundle) : [],
    [vaccinationsBundle],
  );

  const {
    data: vaccinationBundle,
    isLoading: existingVaccinationsLoading,
    refetch: refetchVaccinations,
  } = useQuery<Bundle>({
    queryKey: ['patientVaccinations', patientUUID],
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
        refetchVaccinations();
      }
    },
    [patientUUID, refetchVaccinations],
  );

  const { activeMedications: activeVaccinations, medicationMap } = useMemo(
    () => getActiveMedicationsFromBundle(vaccinationBundle),
    [vaccinationBundle],
  );

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

  // Monitor selected vaccinations and update notification based on current overlap status
  useEffect(() => {
    const hasOverlaps = checkMedicationsOverlap(
      selectedVaccinations,
      activeVaccinations,
      medicationMap,
    );
    setShowDuplicateNotification(hasOverlaps);
  }, [selectedVaccinations, activeVaccinations, medicationMap]);

  const handleSearch = (searchTerm: string) => {
    if (!isSelectingRef.current) {
      setSearchVaccinationTerm(searchTerm);
    }
  };

  const handleOnChange = (selectedItem: MedicationFilterResult) => {
    if (!selectedItem?.medication?.id) {
      return;
    }

    const displayName = getMedicationDisplay(selectedItem.medication);

    const newStartDate = new Date();
    const isDuplicate = isDuplicateMedication(
      selectedItem.medication,
      newStartDate,
      1,
      'd',
      activeVaccinations,
      selectedVaccinations,
      medicationMap,
    );

    setShowDuplicateNotification(isDuplicate);

    isSelectingRef.current = true;
    addVaccination(selectedItem.medication, displayName);
    setSearchVaccinationTerm('');
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 100);
  };

  const filteredSearchResults = useMemo(() => {
    if (!searchVaccinationTerm || searchVaccinationTerm.trim() === '') {
      return [];
    }
    if (loading || existingVaccinationsLoading) {
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
      const itemDisplayName = getMedicationDisplay(item);

      const isAlreadySelected = selectedVaccinations.some((selected) =>
        medicationsMatchByCode(item, selected.medication),
      );

      return {
        medication: item,
        displayName: isAlreadySelected
          ? `${itemDisplayName} (${t('VACCINATION_ALREADY_SELECTED')})`
          : itemDisplayName,
        disabled: isAlreadySelected,
      };
    });
  }, [
    searchVaccinationTerm,
    loading,
    existingVaccinationsLoading,
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
          selectedItem={selectedVaccinationItem}
          clearSelectedOnChange
          allowCustomValue
          size="md"
          autoAlign
          disabled={existingVaccinationsLoading}
          aria-label={t('VACCINATION_SEARCH_PLACEHOLDER')}
        />
      )}
      {showDuplicateNotification && (
        <InlineNotification
          kind="error"
          lowContrast
          subtitle={t('ERROR_DUPLICATE_ACTIVE_VACCINATION')}
          onClose={() => setShowDuplicateNotification(false)}
          hideCloseButton={false}
          className={styles.duplicateNotification}
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
