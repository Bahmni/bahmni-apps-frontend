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
} from '@carbon/react';
import { Close } from '@carbon/icons-react';
import { useTranslation } from 'react-i18next';
import * as styles from './styles/SelectedMedicationItem.module.scss';
import { MedicationInputEntry } from '../../../../types/medication';
import {
  FREQUENCY_OPTIONS,
  ROUTE_OPTIONS,
  TIMING_OPTIONS,
  DOSAGE_UNIT_OPTIONS,
  DURATION_UNIT_OPTIONS,
} from '../../../../constants/medications';

export interface SelectedMedicationItemProps {
  medication: MedicationInputEntry;
  updateDosage: (medicationId: string, dosage: number, unit: string) => void;
  updateFrequency: (medicationId: string, frequency: string) => void;
  updateRoute: (medicationId: string, route: string) => void;
  updateDuration: (
    medicationId: string,
    duration: number,
    unit: string,
  ) => void;
  updateTiming: (medicationId: string, timing: string) => void;
  updateFlags: (medicationId: string, isSTAT: boolean, isPRN: boolean) => void;
  updateStartDate: (medicationId: string, date: string) => void;
  updateInstructions: (medicationId: string, instructions: string) => void;
  calculateTotalQuantity: (medicationId: string) => number;
  removeMedication: (medicationId: string) => void;
}

const SelectedMedicationItem: React.FC<SelectedMedicationItemProps> =
  React.memo(
    ({
      medication,
      updateDosage,
      updateFrequency,
      updateRoute,
      updateDuration,
      updateTiming,
      updateFlags,
      updateStartDate,
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
        errors,
        hasBeenValidated,
      } = medication;

      const hasFrequencyError = !!(hasBeenValidated && errors.frequency);
      const hasRouteError = !!(hasBeenValidated && errors.route);

      const totalQuantity = calculateTotalQuantity(id);

      const handleDosageChange = (newDosage: number) => {
        updateDosage(id, newDosage, dosageUnit);
      };

      const handleDosageUnitChange = (
        selectedItem: { code: string; display: string } | null,
      ) => {
        if (selectedItem) {
          updateDosage(id, dosage, selectedItem.code);
        }
      };

      const handleDurationChange = (newDuration: number) => {
        updateDuration(id, newDuration, durationUnit);
      };

      const handleDurationUnitChange = (
        selectedItem: { code: string; display: string } | null,
      ) => {
        if (selectedItem) {
          updateDuration(id, duration, selectedItem.code);
        }
      };

      const handleFrequencyChange = (
        selectedItem: { code: string; display: string } | null,
      ) => {
        if (selectedItem) {
          updateFrequency(id, selectedItem.code);
        }
      };

      const handleRouteChange = (
        selectedItem: { code: string; display: string } | null,
      ) => {
        if (selectedItem) {
          updateRoute(id, selectedItem.code);
        }
      };

      const handleTimingChange = (
        selectedItem: { code: string; display: string } | null,
      ) => {
        if (selectedItem) {
          updateTiming(id, selectedItem.code);
        }
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

      const selectedFrequency = FREQUENCY_OPTIONS.find(
        (f) => f.code === frequency,
      );
      const selectedRoute = ROUTE_OPTIONS.find((r) => r.code === route);
      const selectedTiming = TIMING_OPTIONS.find((t) => t.code === timing);
      const selectedDosageUnit = DOSAGE_UNIT_OPTIONS.find(
        (d) => d.code === dosageUnit,
      );
      const selectedDurationUnit = DURATION_UNIT_OPTIONS.find(
        (d) => d.code === durationUnit,
      );

      return (
        <Grid className={styles.selectedMedicationItem}>
          {/* Row 1: Medication name with STAT/PRN checkboxes and remove button */}
          <Column span={12} className={styles.medicationTitle}>
            {display} {medication.strength && `(${medication.strength})`}
          </Column>
          <Column span={4} className={styles.medicationActions}>
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
          </Column>

          {/*Row 2: Dosage, Frequency, Duration controls*/}
          <Column span={5} className={styles.dosageControls}>
            <NumberInput
              id={`dosage-unit-${id}`}
              style={{ width: '107px' }}
              invalidText="Number of tablets are invalid. Must be more than 0"
              min={1}
              onChange={(event, { value }) => {
                const newValue = Number(value);
                if (newValue > dosage) {
                  // User clicked + button
                  handleDosageChange(dosage + 1);
                } else if (newValue < dosage) {
                  // User clicked - button
                  handleDosageChange(Math.max(1, dosage - 1));
                } else {
                  // Direct input change
                  handleDosageChange(Math.max(1, newValue));
                }
              }}
              size="sm"
              step={1}
              value={dosage}
              warnText="Warning: Dosage should be a positive number."
            />
            <Dropdown
              id={`dosage-unit-${id}`}
              style={{ width: '120px' }}
              titleText="Unit"
              label="Unit"
              hideLabel
              items={DOSAGE_UNIT_OPTIONS}
              selectedItem={selectedDosageUnit}
              size="sm"
              itemToString={(item) => (item ? t(item.display) : '')}
              onChange={({ selectedItem }) =>
                handleDosageUnitChange(selectedItem)
              }
            />
          </Column>
          <Column span={6} className={styles.frequencyControl}>
            <Dropdown
              id={`frequency-${id}`}
              style={{ width: '100%' }}
              titleText="Frequency"
              label="Frequency"
              hideLabel
              items={FREQUENCY_OPTIONS}
              selectedItem={selectedFrequency}
              size="sm"
              itemToString={(item) => (item ? t(item.display) : '')}
              onChange={({ selectedItem }) =>
                handleFrequencyChange(selectedItem)
              }
              invalid={hasFrequencyError}
              invalidText={hasFrequencyError && t(errors.frequency!)}
            />
          </Column>
          <Column span={5} className={styles.durationControls}>
            <NumberInput
              id={`duration-${id}`}
              style={{ width: '107px' }}
              min={0}
              onChange={(event, { value }) => {
                const newValue = Number(value);
                if (newValue > duration) {
                  // User clicked + button
                  handleDurationChange(duration + 1);
                } else if (newValue < duration) {
                  // User clicked - button
                  handleDurationChange(Math.max(0, duration - 1));
                } else {
                  // Direct input change
                  handleDurationChange(Math.max(0, newValue));
                }
              }}
              size="sm"
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
              size="sm"
              itemToString={(item) => (item ? t(item.display) : '')}
              onChange={({ selectedItem }) =>
                handleDurationUnitChange(selectedItem)
              }
            />
          </Column>

          {/* Row 3: Timing, Route, Date */}
          <Column span={5} className={styles.timingControl}>
            <Dropdown
              id={`timing-${id}`}
              titleText="Timing"
              label="Timing"
              hideLabel
              items={TIMING_OPTIONS}
              selectedItem={selectedTiming}
              size="sm"
              itemToString={(item) => (item ? t(item.display) : '')}
              onChange={({ selectedItem }) => handleTimingChange(selectedItem)}
            />
          </Column>

          <Column span={6} className={styles.routeControl}>
            <Dropdown
              id={`route-${id}`}
              titleText="Route"
              label="Route"
              hideLabel
              items={ROUTE_OPTIONS}
              selectedItem={selectedRoute}
              size="sm"
              itemToString={(item) => (item ? t(item.display) : '')}
              onChange={({ selectedItem }) => handleRouteChange(selectedItem)}
              invalid={hasRouteError}
              invalidText={hasRouteError && t(errors.route!)}
            />
          </Column>

          <Column span={5} className={styles.dateControl}>
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
                size="sm"
              />
            </DatePicker>
          </Column>

          {/* Row 4: Add note and Total quantity */}
          <Column span={8} className={styles.noteControl}>
            <Button
              size="sm"
              onClick={() => setShowInstructions(!showInstructions)}
            >
              {t('MEDICATION_ADD_NOTE')}
            </Button>
          </Column>

          <Column span={4} className={styles.quantityLabel}>
            <span>
              {t('MEDICATION_TOTAL_QUANTITY')}: {totalQuantity}{' '}
              {t(selectedDosageUnit?.display || '')}
            </span>
          </Column>

          <Column span={4} className={styles.editControl}>
            <Button
              size="sm"
              onClick={() => setIsEditingQuantity(!isEditingQuantity)}
            >
              {isEditingQuantity ? t('MEDICATION_DONE') : t('MEDICATION_EDIT')}
            </Button>
          </Column>
        </Grid>
      );
    },
  );

SelectedMedicationItem.displayName = 'SelectedMedicationItem';

export default SelectedMedicationItem;
