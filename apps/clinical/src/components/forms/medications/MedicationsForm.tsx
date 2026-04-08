import {
  BoxWHeader,
  SelectedItem,
  ComboBox,
  DropdownSkeleton,
  Tile,
} from '@bahmni/design-system';
import {
  getConfig,
  fetchMedicationOrdersMetadata,
  useTranslation,
  getPatientMedicationBundle,
  useSubscribeConsultationSaved,
  ConsultationSavedEventPayload,
} from '@bahmni/services';
import {
  useNotification,
  usePatientUUID,
  useHasPrivilege,
  CONSULTATION_PAD_PRIVILEGES,
} from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import { Bundle } from 'fhir/r4';
import React, { useState, useMemo, useRef, useEffect } from 'react';

import { useMedicationSearch } from '../../../hooks/useMedicationSearch';
import { MedicationFilterResult } from '../../../models/medication';
import {
  MedicationConfig,
  MedicationJSONConfig,
} from '../../../models/medicationConfig';
import { getMedicationDisplay } from '../../../services/medicationService';
import { useMedicationStore } from '../../../stores/medicationsStore';
import { MEDICATIONS_CONFIG_URL } from './constants';
import medicationConfigSchema from './schema.json';
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
  const canAddMedications = useHasPrivilege(
    CONSULTATION_PAD_PRIVILEGES.MEDICATIONS,
  );
  const [searchMedicationTerm, setSearchMedicationTerm] = useState('');
  const isSelectingRef = useRef(false);
  const [selectedMedicationItem, setSelectedMedicationItem] =
    useState<MedicationFilterResult | null>(null);
  const {
    data: medicationConfig,
    isLoading: medicationConfigLoading,
    error: medicationConfigError,
  } = useQuery({
    queryKey: ['medicationConfig'],
    queryFn: async () => {
      const [jsonConfig, metadata] = await Promise.all([
        getConfig<MedicationJSONConfig>(
          MEDICATIONS_CONFIG_URL,
          medicationConfigSchema,
        ),
        fetchMedicationOrdersMetadata(),
      ]);
      return { ...metadata, ...jsonConfig } as MedicationConfig;
    },
  });

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
  } = useMedicationStore();

  const {
    isLoading: existingMedicationsLoading,
    error: existingMedicationsError,
    refetch: refetchMedications,
  } = useQuery<Bundle>({
    queryKey: ['medications', patientUUID!],
    enabled:
      !!patientUUID && patientUUID.trim().length > 0 && canAddMedications,
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

  useEffect(() => {
    if (existingMedicationsError) {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: existingMedicationsError.message,
        type: 'error',
      });
    }
  }, [existingMedicationsError, addNotification, t]);

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

      return {
        medication: item,
        displayName: itemDisplayName,
        disabled: false,
      };
    });
  }, [
    searchMedicationTerm,
    loading,
    existingMedicationsLoading,
    error,
    searchResults,
    t,
  ]);

  if (!canAddMedications) return null;

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
                  medicationConfig={medicationConfig}
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
