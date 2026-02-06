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
import styles from './styles/SelectedVaccinationItem.module.scss';

export interface SelectedVaccinationItemProps {
  vaccinationInputEntry: MedicationInputEntry;
  medicationConfig: MedicationConfig;
  updateDosage: (vaccinationId: string, dosage: number) => void;
  updateDosageUnit: (vaccinationId: string, unit: Concept) => void;
  updateFrequency: (vaccinationId: string, frequency: Frequency | null) => void;
  updateRoute: (vaccinationId: string, route: Concept) => void;
  updateDuration: (vaccinationId: string, duration: number) => void;
  updateDurationUnit: (
    vaccinationId: string,
    unit: DurationUnitOption | null,
  ) => void;
  updateInstruction: (vaccinationId: string, instruction: Concept) => void;
  updateisSTAT: (vaccinationId: string, isSTAT: boolean) => void;
  updateStartDate: (vaccinationId: string, date: Date) => void;
  updateDispenseQuantity: (vaccinationId: string, quantity: number) => void;
  updateDispenseUnit: (vaccinationId: string, unit: Concept) => void;
  updateNote: (vaccinationId: string, note: string) => void;
}

const SelectedVaccinationItem: React.FC<SelectedVaccinationItemProps> =
  React.memo(
    ({
      vaccinationInputEntry,
      medicationConfig,
      updateDosage,
      updateDosageUnit,
      updateFrequency,
      updateRoute,
      updateDuration,
      updateDurationUnit,
      updateInstruction,
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
        dispenseQuantity,
        dispenseUnit,
        startDate,
        note,
        errors,
      } = vaccinationInputEntry;

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
        if (isSTAT) {
          const immediateFrequency =
            medicationConfig.frequencies.find(isImmediateFrequency);
          if (immediateFrequency) {
            updateFrequency(id, immediateFrequency);
          }
          updateDuration(id, 0);
          updateDurationUnit(id, null);
          updateStartDate(id, getTodayDate());
        }
      }, [
        isSTAT,
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

      const vaccineName = display.split('(')[0];
      const VaccineDetails = display.includes('(')
        ? '(' + display.split('(').slice(1).join('(')
        : '';

      return (
        <>
          <Grid
            condensed={false}
            narrow={false}
            data-testid={`selected-vaccination-item-grid-${id}`}
          >
            <Column sm={2} md={4} lg={8} className={styles.vaccinationTitle}>
              <span data-testid={`vaccination-name-${id}`}>{vaccineName}</span>
              {VaccineDetails && (
                <span
                  className={styles.vaccineDetails}
                  data-testid={`vaccination-details-${id}`}
                >
                  {VaccineDetails}
                </span>
              )}
            </Column>
            <Column sm={2} md={4} lg={8} className={styles.vaccinationActions}>
              <Checkbox
                id={`stat-${id}`}
                data-testid={`vaccination-stat-checkbox-${id}`}
                labelText={t('MEDICATION_STAT')}
                aria-label="STAT"
                checked={isSTAT}
                onChange={(e) => updateisSTAT(id, e.target.checked)}
                className={styles.statControl}
              />
            </Column>

            <Column sm={2} md={3} lg={6} className={styles.dosageControls}>
              <NumberInput
                id={`dosage-unit-${id}`}
                data-testid={`vaccination-dosage-input-${id}`}
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
                data-testid={`vaccination-dosage-unit-dropdown-${id}`}
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
                data-testid={`vaccination-frequency-dropdown-${id}`}
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
                disabled={isSTAT}
              />
            </Column>
            <Column sm={2} md={3} lg={6} className={styles.durationControls}>
              <NumberInput
                id={`duration-${id}`}
                data-testid={`vaccination-duration-input-${id}`}
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
                disabled={isSTAT}
              />
              <Dropdown
                id={`duration-unit-${id}`}
                data-testid={`vaccination-duration-unit-dropdown-${id}`}
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
                disabled={isSTAT}
              />
            </Column>

            <Column sm={1} md={2} lg={4} className={styles.column}>
              <Dropdown
                id={`vac-instructions-${id}`}
                data-testid={`vaccination-instructions-dropdown-${id}`}
                titleText={t('MEDICATION_INSTRUCTIONS_INPUT_LABEL')}
                label={t('MEDICATION_INSTRUCTIONS_INPUT_LABEL')}
                aria-label="Vaccination Instructions"
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
                data-testid={`vaccination-route-dropdown-${id}`}
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
                data-testid={`vaccination-start-date-picker-${id}`}
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
                  data-testid={`vaccination-start-date-input-${id}`}
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
                  data-testid={`vaccination-add-note-link-${id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setHasNote(true);
                  }}
                >
                  {t('VACCINATION_ADD_NOTE')}
                </Link>
              )}
              <span data-testid={`vaccination-total-quantity-${id}`}>
                {t('VACCINATION_TOTAL_QUANTITY')} : {dispenseQuantity}{' '}
                {dispenseUnit?.name ?? ''}
              </span>
            </Column>
          </Grid>
          {hasNote && (
            <TextAreaWClose
              id={`vaccination-note-${id}`}
              data-testid={`vaccination-note-${id}`}
              labelText={t('VACCINATION_ADD_NOTE')}
              placeholder={t('VACCINATION_ADD_NOTE_PLACEHOLDER')}
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

SelectedVaccinationItem.displayName = 'SelectedVaccinationItem';

export default SelectedVaccinationItem;
