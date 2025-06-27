import React, { useEffect } from 'react';
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
import { DurationUnitOption, MedicationInputEntry } from '@types/medication';
import { Frequency, MedicationConfig } from '@types/medicationConfig';
import { DURATION_UNIT_OPTIONS } from '@constants/medications';
import { Concept } from '@types/encounterConcepts';
import {
  calculateTotalQuantity,
  getDefaultDosingUnit,
  getDefaultRoute,
  isImmediateFrequency,
} from '@services/medicationsValueCalculator';

export interface SelectedMedicationItemProps {
  medicationInputEntry: MedicationInputEntry;
  medicationConfig: MedicationConfig;
  removeMedication: (medicationId: string) => void;
  updateDosage: (medicationId: string, dosage: number) => void;
  updateDosageUnit: (medicationId: string, unit: Concept) => void;
  updateFrequency: (medicationId: string, frequency: Frequency | null) => void;
  updateRoute: (medicationId: string, route: Concept) => void;
  updateDuration: (medicationId: string, duration: number) => void;
  updateDurationUnit: (
    medicationId: string,
    unit: DurationUnitOption | null,
  ) => void;
  updateInstruction: (medicationId: string, instruction: Concept) => void;
  updateisPRN: (medicationId: string, isPRN: boolean) => void;
  updateisSTAT: (medicationId: string, isSTAT: boolean) => void;
  updateStartDate: (medicationId: string, date: Date) => void;
  updateDispenseQuantity: (medicationId: string, quantity: number) => void;
  updateDispenseUnit: (medicationId: string, unit: Concept) => void;
}

const SelectedMedicationItem: React.FC<SelectedMedicationItemProps> =
  React.memo(
    ({
      medicationInputEntry,
      medicationConfig,
      updateDosage,
      updateDosageUnit,
      updateFrequency,
      updateRoute,
      updateDuration,
      updateDurationUnit,
      updateInstruction,
      updateisPRN,
      updateisSTAT,
      updateStartDate,
      updateDispenseQuantity,
      updateDispenseUnit,
      removeMedication,
    }) => {
      const { t } = useTranslation();

      const {
        id,
        medication,
        dosage,
        dosageUnit,
        frequency,
        route,
        duration,
        durationUnit,
        instruction,
        display,
        isSTAT,
        isPRN,
        dispenseQuantity,
        dispenseUnit,
        startDate,
        errors,
      } = medicationInputEntry;

      useEffect(() => {
        if (
          !medicationConfig ||
          !medicationConfig.drugFormDefaults ||
          !medicationConfig.routes ||
          !medicationConfig.doseUnits
        ) {
          return;
        }
        const defaultRoute = getDefaultRoute(
          medication,
          medicationConfig.drugFormDefaults,
          medicationConfig.routes,
        );
        if (defaultRoute && !route) {
          updateRoute(id, defaultRoute);
        }
        const defaultDosingUnit = getDefaultDosingUnit(
          medication,
          medicationConfig.drugFormDefaults,
          medicationConfig.doseUnits,
        );
        if (defaultDosingUnit && !dosageUnit) {
          updateDosageUnit(id, defaultDosingUnit);
          updateDispenseUnit(id, defaultDosingUnit);
        }
      }, [medication]);

      useEffect(() => {
        const totalQuantity = calculateTotalQuantity(
          dosage,
          frequency,
          duration,
          durationUnit,
        );
        updateDispenseQuantity(id, totalQuantity);
      }, [dosage, frequency, duration, durationUnit]);

      useEffect(() => {
        if (isPRN || !isSTAT) {
          updateFrequency(id, null);
        }
        if (isSTAT && !isPRN) {
          const immediateFrequency =
            medicationConfig.frequencies.find(isImmediateFrequency);
          if (immediateFrequency) {
            updateFrequency(id, immediateFrequency);
          }
          updateStartDate(id, new Date());
          updateDuration(id, 0);
          updateDurationUnit(id, null);
        }
      }, [isSTAT, isPRN]);

      return (
        <Grid className={styles.selectedMedicationItem}>
          {/* Row 1: Medication name with STAT/PRN checkboxes and remove button */}
          <Column span={12} className={styles.medicationTitle}>
            {display}
          </Column>
          <Column span={4} className={styles.medicationActions}>
            <Checkbox
              id={`stat-${id}`}
              labelText={t('MEDICATION_STAT')}
              checked={isSTAT}
              onChange={(e) => updateisSTAT(id, e.target.checked)}
            />
            <Checkbox
              id={`prn-${id}`}
              labelText={t('MEDICATION_PRN')}
              checked={isPRN}
              onChange={(e) => updateisPRN(id, e.target.checked)}
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
              min={0}
              size="sm"
              step={1}
              value={dosage}
              label="Dosage"
              hideLabel
              onChange={(_, { value }) => {
                const numericValue = parseFloat(value.toString());
                if (!isNaN(numericValue)) {
                  updateDosage(id, numericValue);
                }
              }}
              invalid={errors.dosage ? true : false}
              invalidText={t(errors.dosage || '')}
            />
            <Dropdown
              id={`dosage-unit-${id}`}
              style={{ width: '120px' }}
              titleText="Dosage Unit"
              label="Dosage Unit"
              hideLabel
              size="sm"
              items={medicationConfig.doseUnits || []}
              itemToString={(item) => (item ? item.name : '')}
              selectedItem={dosageUnit}
              onChange={(e) => {
                if (e.selectedItem) {
                  updateDosageUnit(id, e.selectedItem);
                  updateDispenseUnit(id, e.selectedItem);
                }
              }}
              invalid={errors.dosageUnit ? true : false}
              invalidText={t(errors.dosageUnit || '')}
            />
          </Column>
          <Column span={6} className={styles.frequencyControl}>
            <Dropdown
              id={`frequency-${id}`}
              style={{ width: '100%' }}
              titleText="Frequency"
              label="Frequency"
              hideLabel
              size="sm"
              items={
                medicationConfig.frequencies.filter(
                  (item) => !isImmediateFrequency(item),
                ) || []
              }
              itemToString={(item) => (item ? item.name : '')}
              selectedItem={frequency}
              onChange={(e) => {
                if (e.selectedItem) {
                  updateFrequency(id, e.selectedItem);
                }
              }}
              invalid={errors.frequency ? true : false}
              invalidText={t(errors.frequency || '')}
              disabled={isSTAT && !isPRN}
            />
          </Column>
          <Column span={5} className={styles.durationControls}>
            <NumberInput
              id={`duration-${id}`}
              label="Duration"
              hideLabel
              style={{ width: '107px' }}
              min={0}
              size="sm"
              step={1}
              value={duration}
              onChange={(_, { value }) => {
                const numericValue = parseFloat(value.toString());
                if (!isNaN(numericValue)) {
                  updateDuration(id, numericValue);
                }
              }}
              invalid={errors.duration ? true : false}
              invalidText={t(errors.duration || '')}
              disabled={isSTAT && !isPRN}
            />
            <Dropdown
              id={`duration-unit-${id}`}
              titleText="Duration Unit"
              label="Duration Unit"
              hideLabel
              size="sm"
              items={DURATION_UNIT_OPTIONS}
              itemToString={(item) =>
                item ? t(item.display, { defaultValue: item.code }) : ''
              }
              selectedItem={durationUnit}
              onChange={(e) => {
                if (e.selectedItem) {
                  updateDurationUnit(id, e.selectedItem);
                }
              }}
              invalid={errors.durationUnit ? true : false}
              invalidText={t(errors.durationUnit || '')}
              disabled={isSTAT && !isPRN}
            />
          </Column>

          {/* Row 3: Instruction, Route, Date */}
          <Column span={5} className={styles.timingControl}>
            <Dropdown
              id={`med-instructions-${id}`}
              titleText="Instructions"
              label="Instructions"
              hideLabel
              size="sm"
              items={medicationConfig.dosingInstructions || []}
              itemToString={(item) => (item ? item.name : '')}
              selectedItem={instruction}
              onChange={(e) => {
                if (e.selectedItem) {
                  updateInstruction(id, e.selectedItem);
                }
              }}
            />
          </Column>

          <Column span={6} className={styles.routeControl}>
            <Dropdown
              id={`route-${id}`}
              titleText="Route"
              label="Route"
              hideLabel
              size="sm"
              items={medicationConfig.routes || []}
              itemToString={(item) => (item ? item.name : '')}
              selectedItem={route}
              onChange={(e) => {
                if (e.selectedItem) {
                  updateRoute(id, e.selectedItem);
                }
              }}
              invalid={errors.route ? true : false}
              invalidText={t(errors.route || '')}
            />
          </Column>

          <Column span={5} className={styles.dateControl}>
            <DatePicker
              datePickerType="single"
              value={startDate}
              onChange={(date) => {
                if (date && date[0]) {
                  updateStartDate(id, date[0]);
                }
              }}
            >
              <DatePickerInput
                id={`start-date-${id}`}
                placeholder="mm/dd/yyyy"
                labelText="Start Date"
                hideLabel
                size="sm"
                disabled={isSTAT && !isPRN}
              />
            </DatePicker>
          </Column>
          <Column span={12}>
            <span>
              Total Quantity:{dispenseQuantity} {dispenseUnit?.name || ''}
            </span>
          </Column>
        </Grid>
      );
    },
  );

SelectedMedicationItem.displayName = 'SelectedMedicationItem';

export default SelectedMedicationItem;
