import {
  Column,
  Grid,
  Dropdown,
  NumberInput,
  Checkbox,
  DatePicker,
  DatePickerInput,
  Link,
  TextAreaWClose,
} from '@bahmni/design-system';
import {
  useTranslation,
  getTodayDate,
  DATE_PICKER_INPUT_FORMAT,
} from '@bahmni/services';
import React, { useEffect, useCallback, useState } from 'react';
import { DURATION_UNIT_OPTIONS } from '../../../constants/medications';
import { Concept } from '../../../models/encounterConcepts';
import {
  DurationUnitOption,
  MedicationInputEntry,
} from '../../../models/medication';
import { Frequency, MedicationConfig } from '../../../models/medicationConfig';
import {
  calculateTotalQuantity,
  getDefaultDosingUnit,
  getDefaultRoute,
  isImmediateFrequency,
} from '../../../services/medicationsValueCalculator';
import styles from './styles/SelectedMedicationItem.module.scss';

export interface SelectedMedicationItemProps {
  medicationInputEntry: MedicationInputEntry;
  medicationConfig: MedicationConfig;
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
  updateNote: (medicationId: string, note: string) => void;
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
      updateNote,
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
        note,
        errors,
      } = medicationInputEntry;

      const [hasNote, setHasNote] = useState(!!note);

      const setDefaultInstruction = useCallback(() => {
        if (
          !medicationConfig?.dosingInstructions ||
          medicationConfig.dosingInstructions.length === 0 ||
          !medicationConfig.defaultInstructions
        ) {
          return;
        }
        if (!instruction) {
          const defaultInstruction = medicationConfig.dosingInstructions.find(
            (item) => item.name === medicationConfig.defaultInstructions,
          );
          if (defaultInstruction) {
            updateInstruction(id, defaultInstruction);
          }
        }
      }, [medicationConfig, instruction, updateInstruction, id]);

      const setDefaultDurationUnit = useCallback(() => {
        if (
          !medicationConfig?.durationUnits ||
          medicationConfig.durationUnits.length === 0 ||
          !medicationConfig.defaultDurationUnit
        ) {
          return;
        }
        if (!durationUnit) {
          const defaultDurationUnit = DURATION_UNIT_OPTIONS.find(
            (item) => item.code === medicationConfig.defaultDurationUnit,
          );
          if (defaultDurationUnit) {
            updateDurationUnit(id, defaultDurationUnit);
          }
        }
      }, [medicationConfig, durationUnit, updateDurationUnit, id]);

      useEffect(() => {
        if (
          !medicationConfig?.drugFormDefaults ||
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
      }, [
        medication,
        medicationConfig,
        route,
        dosageUnit,
        id,
        updateRoute,
        updateDosageUnit,
        updateDispenseUnit,
      ]);

      useEffect(() => {
        const totalQuantity = calculateTotalQuantity(
          dosage,
          frequency,
          duration,
          durationUnit,
        );
        updateDispenseQuantity(id, totalQuantity);
      }, [
        dosage,
        frequency,
        duration,
        durationUnit,
        id,
        updateDispenseQuantity,
      ]);

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
          updateDuration(id, 0);
          updateDurationUnit(id, null);
        }
        if (isSTAT) {
          updateStartDate(id, getTodayDate());
        }
      }, [
        isSTAT,
        isPRN,
        id,
        medicationConfig.frequencies,
        updateFrequency,
        updateDuration,
        updateDurationUnit,
        updateStartDate,
      ]);

      useEffect(() => {
        setDefaultInstruction();
        setDefaultDurationUnit();
      }, [setDefaultInstruction, setDefaultDurationUnit]);

      const medicineName = display.split('(')[0];
      const medicineDetails = display.includes('(')
        ? '(' + display.split('(').slice(1).join('(')
        : '';

      return (
        <>
          <Grid
            condensed={false}
            narrow={false}
            data-testid={`selected-medication-item-grid-${id}`}
          >
            <Column sm={2} md={4} lg={8} className={styles.medicationTitle}>
              <span data-testid={`medication-name-${id}`}>{medicineName}</span>
              {medicineDetails && (
                <span
                  className={styles.medicineDetails}
                  data-testid={`medication-details-${id}`}
                >
                  {medicineDetails}
                </span>
              )}
            </Column>
            <Column sm={2} md={4} lg={8} className={styles.medicationActions}>
              <Checkbox
                id={`stat-${id}`}
                data-testid={`medication-stat-checkbox-${id}`}
                labelText={t('MEDICATION_STAT')}
                aria-label="STAT"
                checked={isSTAT}
                onChange={(e) => updateisSTAT(id, e.target.checked)}
                className={styles.statControl}
              />
              <Checkbox
                id={`prn-${id}`}
                data-testid={`medication-prn-checkbox-${id}`}
                labelText={t('MEDICATION_PRN')}
                aria-label="PRN"
                checked={isPRN}
                onChange={(e) => updateisPRN(id, e.target.checked)}
              />
            </Column>

            <Column sm={2} md={3} lg={6} className={styles.dosageControls}>
              <NumberInput
                id={`dosage-unit-${id}`}
                data-testid={`medication-dosage-input-${id}`}
                min={0}
                size="sm"
                step={1}
                value={dosage}
                label={t('MEDICATION_DOSAGE_INPUT_LABEL')}
                aria-label="Dosage"
                className={styles.dosageInput}
                hideLabel
                onChange={(_, { value }) => {
                  const numericValue = parseFloat(value.toString());
                  if (!isNaN(numericValue)) {
                    updateDosage(id, numericValue);
                  }
                }}
                invalid={errors.dosage ? true : false}
                invalidText={t(errors.dosage ?? '')}
              />

              <Dropdown
                id={`dosage-unit-${id}`}
                data-testid={`medication-dosage-unit-dropdown-${id}`}
                titleText={t('MEDICATION_DOSAGE_UNIT_INPUT_LABEL')}
                label={t('MEDICATION_DOSAGE_UNIT_INPUT_LABEL')}
                aria-label="Dosage Unit"
                className={styles.dosageUnit}
                hideLabel
                size="sm"
                items={medicationConfig.doseUnits ?? []}
                itemToString={(item) => (item ? item.name : '')}
                selectedItem={dosageUnit}
                onChange={(e) => {
                  if (e.selectedItem) {
                    updateDosageUnit(id, e.selectedItem);
                    updateDispenseUnit(id, e.selectedItem);
                  }
                }}
                autoAlign
                invalid={errors.dosageUnit ? true : false}
                invalidText={t(errors.dosageUnit ?? '')}
              />
            </Column>
            <Column sm={1} md={2} lg={4} className={styles.column}>
              <Dropdown
                id={`frequency-${id}`}
                data-testid={`medication-frequency-dropdown-${id}`}
                titleText={t('MEDICATION_FREQUENCY_INPUT_LABEL')}
                label={t('MEDICATION_FREQUENCY_INPUT_LABEL')}
                aria-label="Frequency"
                hideLabel
                size="sm"
                items={
                  medicationConfig.frequencies.filter(
                    (item) => !isImmediateFrequency(item),
                  ) ?? []
                }
                itemToString={(item) => (item ? item.name : '')}
                selectedItem={frequency}
                onChange={(e) => {
                  if (e.selectedItem) {
                    updateFrequency(id, e.selectedItem);
                  }
                }}
                autoAlign
                invalid={errors.frequency ? true : false}
                invalidText={t(errors.frequency ?? '')}
                disabled={isSTAT && !isPRN}
              />
            </Column>
            <Column sm={2} md={3} lg={6} className={styles.durationControls}>
              <NumberInput
                id={`duration-${id}`}
                data-testid={`medication-duration-input-${id}`}
                label={t('MEDICATION_DURATION_INPUT_LABEL')}
                aria-label="Duration"
                className={styles.durationInput}
                hideLabel
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
                invalidText={t(errors.duration ?? '')}
                disabled={isSTAT && !isPRN}
              />
              <Dropdown
                id={`duration-unit-${id}`}
                data-testid={`medication-duration-unit-dropdown-${id}`}
                titleText={t('MEDICATION_DURATION_UNIT_INPUT_LABEL')}
                label={t('MEDICATION_DURATION_UNIT_INPUT_LABEL')}
                aria-label="Duration Unit"
                className={styles.durationUnit}
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
                autoAlign
                invalid={errors.durationUnit ? true : false}
                invalidText={t(errors.durationUnit ?? '')}
                disabled={isSTAT && !isPRN}
              />
            </Column>

            <Column sm={1} md={2} lg={4} className={styles.column}>
              <Dropdown
                id={`med-instructions-${id}`}
                data-testid={`medication-instructions-dropdown-${id}`}
                titleText={t('MEDICATION_INSTRUCTIONS_INPUT_LABEL')}
                label={t('MEDICATION_INSTRUCTIONS_INPUT_LABEL')}
                aria-label="Medication Instructions"
                hideLabel
                size="sm"
                items={medicationConfig.dosingInstructions ?? []}
                itemToString={(item) => (item ? item.name : '')}
                selectedItem={instruction}
                onChange={(e) => {
                  if (e.selectedItem) {
                    updateInstruction(id, e.selectedItem);
                  }
                }}
                autoAlign
              />
            </Column>

            <Column sm={1} md={2} lg={4} className={styles.column}>
              <Dropdown
                id={`route-${id}`}
                data-testid={`medication-route-dropdown-${id}`}
                titleText={t('MEDICATION_ROUTE_INPUT_LABEL')}
                label={t('MEDICATION_ROUTE_INPUT_LABEL')}
                aria-label="Route"
                hideLabel
                size="sm"
                items={medicationConfig.routes ?? []}
                itemToString={(item) => (item ? item.name : '')}
                selectedItem={route}
                onChange={(e) => {
                  if (e.selectedItem) {
                    updateRoute(id, e.selectedItem);
                  }
                }}
                autoAlign
                invalid={errors.route ? true : false}
                invalidText={t(errors.route ?? '')}
              />
            </Column>

            <Column sm={2} md={4} lg={8} className={styles.column}>
              <DatePicker
                datePickerType="single"
                dateFormat={DATE_PICKER_INPUT_FORMAT}
                data-testid={`medication-start-date-picker-${id}`}
                value={startDate}
                minDate={getTodayDate()}
                onChange={(date) => {
                  if (date?.[0] && date[0] > getTodayDate()) {
                    updateStartDate(id, date[0]);
                  }
                }}
              >
                <DatePickerInput
                  id={`start-date-${id}`}
                  data-testid={`medication-start-date-input-${id}`}
                  placeholder={DATE_PICKER_INPUT_FORMAT}
                  labelText={t('MEDICATION_START_DATE_INPUT_LABEL')}
                  aria-label="Start Date"
                  hideLabel
                  size="sm"
                  disabled={isSTAT}
                />
              </DatePicker>
            </Column>
            <Column sm={4} md={8} lg={16} className={styles.footerRow}>
              {!hasNote && (
                <Link
                  href="#"
                  data-testid={`medication-add-note-link-${id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setHasNote(true);
                  }}
                >
                  {t('MEDICATION_ADD_NOTE')}
                </Link>
              )}
              <span data-testid={`medication-total-quantity-${id}`}>
                {t('MEDICATION_TOTAL_QUANTITY')} : {dispenseQuantity}{' '}
                {dispenseUnit?.name ?? ''}
              </span>
            </Column>
          </Grid>
          {hasNote && (
            <TextAreaWClose
              id={`medication-note-${id}`}
              data-testid={`medication-note-${id}`}
              labelText={t('MEDICATION_ADD_NOTE')}
              placeholder={t('MEDICATION_ADD_NOTE_PLACEHOLDER')}
              value={note ?? ''}
              onChange={(event) => {
                const target = event.target;
                updateNote(id, target.value);
              }}
              onClose={() => {
                setHasNote(false);
                updateNote(id, '');
              }}
              enableCounter
              maxCount={1024}
            />
          )}
        </>
      );
    },
  );

SelectedMedicationItem.displayName = 'SelectedMedicationItem';

export default SelectedMedicationItem;
