import React, { useState } from 'react';
import {
  Column,
  Grid,
  Dropdown,
  NumberInput,
  Button,
  Checkbox,
  DatePicker,
  DatePickerInput,
  TextArea,
  ComboBox
} from '@carbon/react';
import { Add, Subtract, Close } from '@carbon/icons-react';
import { useTranslation } from 'react-i18next';
import * as styles from './styles/SelectedMedicationItem.module.scss';
import { MedicationInputEntry } from '../../../../types/medication';
import {
  FREQUENCY_OPTIONS,
  ROUTE_OPTIONS,
  TIMING_OPTIONS,
  DOSAGE_UNIT_OPTIONS,
  DURATION_UNIT_OPTIONS
} from '../../../../constants/medications';

export interface SelectedMedicationItemProps {
  medication: MedicationInputEntry;
  updateDosage: (medicationId: string, dosage: number, unit: string) => void;
  updateFrequency: (medicationId: string, frequency: string) => void;
  updateRoute: (medicationId: string, route: string) => void;
  updateDuration: (medicationId: string, duration: number, unit: string) => void;
  updateTiming: (medicationId: string, timing: string) => void;
  updateFlags: (medicationId: string, isSTAT: boolean, isPRN: boolean) => void;
  updateStartDate: (medicationId: string, date: string) => void;
  updateInstructions: (medicationId: string, instructions: string) => void;
  calculateTotalQuantity: (medicationId: string) => number;
  removeMedication: (medicationId: string) => void;
}

const SelectedMedicationItem: React.FC<SelectedMedicationItemProps> = React.memo(
  ({
    medication,
    updateDosage,
    updateFrequency,
    updateRoute,
    updateDuration,
    updateTiming,
    updateFlags,
    updateStartDate,
    updateInstructions,
    calculateTotalQuantity,
    removeMedication,
  }) => {
    const { t } = useTranslation();
    const [showInstructions, setShowInstructions] = useState(false);
    const [isEditingQuantity, setIsEditingQuantity] = useState(false);

    const {
      id,
      display,
      dosage,
      dosageUnit,
      frequency,
      timing,
      route,
      duration,
      durationUnit,
      isSTAT,
      isPRN,
      startDate,
      instructions,
      errors,
      hasBeenValidated,
    } = medication;

    const hasDosageError = !!(hasBeenValidated && errors.dosage);
    const hasFrequencyError = !!(hasBeenValidated && errors.frequency);
    const hasRouteError = !!(hasBeenValidated && errors.route);
    const hasDurationError = !!(hasBeenValidated && errors.duration);

    const totalQuantity = calculateTotalQuantity(id);

    const handleDosageChange = (newDosage: number) => {
      updateDosage(id, newDosage, dosageUnit);
    };

    const handleDosageUnitChange = (selectedItem: any) => {
      updateDosage(id, dosage, selectedItem.code);
    };

    const handleDurationChange = (newDuration: number) => {
      updateDuration(id, newDuration, durationUnit);
    };

    const handleDurationUnitChange = (selectedItem: any) => {
      updateDuration(id, duration, selectedItem.code);
    };

    const handleFrequencyChange = (selectedItem: any) => {
      updateFrequency(id, selectedItem.code);
    };

    const handleRouteChange = (selectedItem: any) => {
      updateRoute(id, selectedItem.code);
    };

    const handleTimingChange = (selectedItem: any) => {
      updateTiming(id, selectedItem.code);
    };

    const handleSTATChange = (checked: boolean) => {
      updateFlags(id, checked, isPRN);
    };

    const handlePRNChange = (checked: boolean) => {
      updateFlags(id, isSTAT, checked);
    };

    const handleDateChange = (dates: Date[]) => {
      if (dates.length > 0 && dates[0]) {
        const dateString = dates[0].toISOString().split('T')[0];
        updateStartDate(id, dateString);
      }
    };

    const handleInstructionsChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateInstructions(id, event.target.value);
    };

    const selectedFrequency = FREQUENCY_OPTIONS.find(f => f.code === frequency);
    const selectedRoute = ROUTE_OPTIONS.find(r => r.code === route);
    const selectedTiming = TIMING_OPTIONS.find(t => t.code === timing);
    const selectedDosageUnit = DOSAGE_UNIT_OPTIONS.find(d => d.code === dosageUnit);
    const selectedDurationUnit = DURATION_UNIT_OPTIONS.find(d => d.code === durationUnit);

    return (
      <div className={styles.selectedMedicationItem}>
        {/* Row 1: Medication name with STAT/PRN checkboxes and remove button */}
        <div className={styles.medicationHeader}>
          <div className={styles.medicationTitle}>
            {display} {medication.strength && `(${medication.strength})`}
          </div>
          <div className={styles.medicationActions}>
            <Checkbox
              id={`stat-${id}`}
              labelText={t('MEDICATION_STAT')}
              checked={isSTAT}
              onChange={(_, { checked }) => handleSTATChange(checked)}
            />
            <Checkbox
              id={`prn-${id}`}
              labelText={t('MEDICATION_PRN')}
              checked={isPRN}
              onChange={(_, { checked }) => handlePRNChange(checked)}
            />
            <Button
              kind="ghost"
              size="sm"
              hasIconOnly
              iconDescription="Remove medication"
              renderIcon={Close}
              onClick={() => removeMedication(id)}
            />
          </div>
        </div>

        {/* Row 2: Dosage, Frequency, Duration controls */}
        <div className={styles.controlsRow}>
          <div className={styles.dosageControls}>
            <div className={styles.dosageInputGroup}>
              <NumberInput
                id="default-number-input"
                invalidText="Invalid dosage"
                invalid={hasDosageError}
                max={100}
                min={0}
                onChange={() => handleDosageChange(Math.max(1, dosage - 1))}
                size="md"
                step={1}
                value={dosage}
                warnText="Warning: Dosage should be a positive number."
              />
              <div className={styles.dosageSeparator}></div>
              <Dropdown
                id={`dosage-unit-${id}`}
                titleText="Unit"
                label="Unit"
                hideLabel
                items={DOSAGE_UNIT_OPTIONS}
                selectedItem={selectedDosageUnit}
                itemToString={(item) => item ? t(item.display) : ''}
                onChange={({ selectedItem }) => handleDosageUnitChange(selectedItem)}
                size="md"
              />
            </div>
          </div>


          <div className={styles.frequencyControl}>
            <Dropdown
              id={`frequency-${id}`}
              titleText="Frequency"
              label="Frequency"
              hideLabel
              items={FREQUENCY_OPTIONS}
              selectedItem={selectedFrequency}
              itemToString={(item) => item ? t(item.display) : ''}
              onChange={({ selectedItem }) => handleFrequencyChange(selectedItem)}
              invalid={hasFrequencyError}
              invalidText={hasFrequencyError && t(errors.frequency!)}
              size="md"
            />
          </div>

          <div className={styles.durationControls}>
            <div className={styles.durationInputGroup}>
              <NumberInput
                id="default-number-input"
                invalidText="Invalid duration"
                invalid={hasDurationError}
                max={30}
                min={0}
                onChange={() => handleDurationChange(Math.max(0, duration - 1))}
                size="md"
                step={1}
                value={duration}
                warnText="Warning: Duration should be a positive number."
              />

              <Dropdown
                id={`duration-unit-${id}`}
                titleText="Duration Unit"
                label="Duration Unit"
                hideLabel
                items={DURATION_UNIT_OPTIONS}
                selectedItem={selectedDurationUnit}
                itemToString={(item) => item ? t(item.display) : ''}
                onChange={({ selectedItem }) => handleDurationUnitChange(selectedItem)}
                size="md"
              />
            </div>
          </div>
        </div>

        {/* Row 3: Timing, Route, Date */}
        <div className={styles.detailsRow}>
          <div className={styles.timingControl}>
            <Dropdown
              id={`timing-${id}`}
              titleText="Timing"
              label="Timing"
              hideLabel
              items={TIMING_OPTIONS}
              selectedItem={selectedTiming}
              itemToString={(item) => item ? t(item.display) : ''}
              onChange={({ selectedItem }) => handleTimingChange(selectedItem)}
              size="md"
            />
          </div>

          <div className={styles.routeControl}>
            <Dropdown
              id={`route-${id}`}
              titleText="Route"
              label="Route"
              hideLabel
              items={ROUTE_OPTIONS}
              selectedItem={selectedRoute}
              itemToString={(item) => item ? t(item.display) : ''}
              onChange={({ selectedItem }) => handleRouteChange(selectedItem)}
              invalid={hasRouteError}
              invalidText={hasRouteError && t(errors.route!)}
              size="md"
            />
          </div>

          <div className={styles.dateControl}>
            <DatePicker
              datePickerType="single"
              value={startDate}
              onChange={handleDateChange}
            >
              <DatePickerInput
                id={`start-date-${id}`}
                placeholder="mm/dd/yyyy"
                labelText="Start Date"
                hideLabel
                size="md"
              />
            </DatePicker>
          </div>
        </div>

        {/* Row 4: Add note and Total quantity */}
        <div className={styles.bottomRow}>
          <div className={styles.noteControl}>
            <Button
              kind="ghost"
              size="sm"
              onClick={() => setShowInstructions(!showInstructions)}
            >
              {t('MEDICATION_ADD_NOTE')}
            </Button>
            {showInstructions && (
              <TextArea
                id={`instructions-${id}`}
                labelText={t('MEDICATION_ADD_NOTE')}
                placeholder={t('MEDICATION_ADD_NOTE')}
                value={instructions || ''}
                onChange={handleInstructionsChange}
                rows={2}
              />
            )}
          </div>

          <div className={styles.quantityControl}>
            <span className={styles.quantityLabel}>
              {t('MEDICATION_TOTAL_QUANTITY')}: {totalQuantity} {t(selectedDosageUnit?.display || '')}
            </span>
            <Button
              kind="ghost"
              size="sm"
              onClick={() => setIsEditingQuantity(!isEditingQuantity)}
            >
              {isEditingQuantity ? t('MEDICATION_DONE') : t('MEDICATION_EDIT')}
            </Button>
            {isEditingQuantity && (
              <NumberInput
                id={`total-quantity-${id}`}
                value={totalQuantity}
                min={1}
                step={1}
                hideSteppers
                size="sm"
              />
            )}
          </div>
        </div>
      </div >
    );
  },
);

SelectedMedicationItem.displayName = 'SelectedMedicationItem';

export default SelectedMedicationItem;
