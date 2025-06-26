import React, { useState, useMemo } from 'react';
import { ComboBox, Tile } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import * as styles from './styles/MedicationsForm.module.scss';
import SelectedItem from '@components/common/selectedItem/SelectedItem';
import BoxWHeader from '@components/common/boxWHeader/BoxWHeader';
import { MedicationConcept } from '../../../../types/medication';
import SelectedMedicationItem from './SelectedMedicationItem';
import { useMedicationStore } from '../../../../stores/medicationsStore';
import useMedicationConfig from '@/hooks/useMedicationConfig';

/**
 * MedicationsForm component
 *
 * A component that displays a search interface for medications and a list of selected medications.
 * It allows users to search for medications, select them, and specify dosage, frequency, route, timing, and duration.
 */
const MedicationsForm: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const [searchMedicationTerm, setSearchMedicationTerm] = useState('');
  const { medicationConfig, loading, error } = useMedicationConfig();

  // Use Zustand store
  const {
    selectedMedications,
    addMedication,
    removeMedication,
    updateDosage,
    updateFrequency,
    updateRoute,
    updateDuration,
    updateTiming,
    updateFlags,
    updateStartDate,
    updateInstructions,
    calculateTotalQuantity,
  } = useMedicationStore();

  // Mock medication data - in real implementation, this would come from an API
  const mockMedications: MedicationConcept[] = [
    { uuid: '1', display: 'Penicillin G 10 lac units', strength: '10 lac units', dosageForm: 'Tablet' },
    { uuid: '2', display: 'Paracetamol', strength: '500mg', dosageForm: 'Tablet' },
    { uuid: '3', display: 'Ibuprofen', strength: '400mg', dosageForm: 'Tablet' },
    { uuid: '4', display: 'Aspirin', strength: '75mg', dosageForm: 'Tablet' },
    { uuid: '5', display: 'Naproxen', strength: '250mg', dosageForm: 'Tablet' },
    { uuid: '6', display: 'Diclofenac', strength: '50mg', dosageForm: 'Tablet' },
    { uuid: '7', display: 'Amoxicillin', strength: '500mg', dosageForm: 'Capsule' },
    { uuid: '8', display: 'Ciprofloxacin', strength: '500mg', dosageForm: 'Tablet' },
    { uuid: '9', display: 'Azithromycin', strength: '250mg', dosageForm: 'Tablet' },
    { uuid: '10', display: 'Cephalexin', strength: '500mg', dosageForm: 'Capsule' },
    { uuid: '11', display: 'Metronidazole', strength: '400mg', dosageForm: 'Tablet' },
    { uuid: '12', display: 'Doxycycline', strength: '100mg', dosageForm: 'Capsule' },
  ];

  const handleSearch = (searchTerm: string) => {
    setSearchMedicationTerm(searchTerm);
  };

  const handleOnChange = (selectedItem: MedicationConcept) => {
    if (!selectedItem || !selectedItem.uuid || !selectedItem.display) {
      return;
    }

    addMedication(selectedItem);
  };

  const getFilteredSearchResults = () => {
    if (searchMedicationTerm.length === 0) return [];

    const filteredMedications = mockMedications.filter(medication =>
      medication.display.toLowerCase().includes(searchMedicationTerm.toLowerCase())
    );

    if (filteredMedications.length === 0) {
      return [
        {
          uuid: '',
          display: t('NO_MATCHING_MEDICATIONS_FOUND'),
          disabled: true,
        },
      ];
    }

    return filteredMedications.map((item) => {
      const isAlreadySelected = selectedMedications.some(
        (m) => m.id === item.uuid,
      );
      return {
        ...item,
        display: isAlreadySelected
          ? `${item.display} (${t('MEDICATION_ALREADY_SELECTED')})`
          : item.display,
        disabled: isAlreadySelected,
      };
    });
  };

  const filteredSearchResults = useMemo(() => {
    return getFilteredSearchResults();
  }, [
    searchMedicationTerm,
    selectedMedications,
    t,
  ]);

  return (
    <Tile className={styles.medicationsFormTile}>
      <div className={styles.medicationsFormTitle}>
        {t('MEDICATIONS_FORM_TITLE')}
      </div>
      <ComboBox
        id="medications-search"
        placeholder={t('MEDICATIONS_SEARCH_PLACEHOLDER')}
        items={filteredSearchResults}
        itemToString={(item) =>
          item?.strength
            ? `${item.display} - ${item.strength} (${item.dosageForm})`
            : item
              ? `${item.display}`
              : ''
        }
        onChange={(data) => handleOnChange(data.selectedItem!)}
        onInputChange={(searchQuery: string) => handleSearch(searchQuery)}
        size="lg"
        autoAlign
        aria-label={t('MEDICATIONS_SEARCH_PLACEHOLDER')}
      />
      {selectedMedications && selectedMedications.length > 0 && (
        <BoxWHeader
          title={t('MEDICATIONS_ADDED_MEDICATIONS')}
          className={styles.medicationsBox}
        >
          {selectedMedications.map((medicationConfig) => (
              <SelectedMedicationItem
                medication={medicationConfig}
                updateDosage={updateDosage}
                updateFrequency={updateFrequency}
                updateRoute={updateRoute}
                updateDuration={updateDuration}
                updateTiming={updateTiming}
                updateFlags={updateFlags}
                updateStartDate={updateStartDate}
                updateInstructions={updateInstructions}
                calculateTotalQuantity={calculateTotalQuantity}
                removeMedication={removeMedication}
              />
          ))}
        </BoxWHeader>
      )}
    </Tile>
  );
});

MedicationsForm.displayName = 'MedicationsForm';

export default MedicationsForm;
