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
import { useTranslation, getTodayDate } from '@bahmni/services';
import React, { useEffect, useState } from 'react';
import { MedicationInputEntry } from '../../../../models/medication';
import { MedicationConfig } from '../../../../models/medicationConfig';
import { InputControlAttributes } from '../../../../providers/clinicalConfig/models';
import {
  DURATION_UNIT_OPTIONS,
  MEDICATIONS_INPUT_CONTROL_KEY,
} from '../constants';
import { MedicationRequestStoreKey } from '../models';
import { useMedicationRequestStore } from '../store';
import styles from '../styles/SelectedMedicationRequestItem.module.scss';
import {
  applyMountDefaults,
  calculateTotalQuantity,
  findAttr,
  isImmediateFrequency,
} from '../utils';

export interface SelectedMedicationRequestItemProps {
  entry: MedicationInputEntry;
  medicationConfig: MedicationConfig;
  inputControlType: MedicationRequestStoreKey;
  attributes: InputControlAttributes[];
}

const SelectedMedicationRequestItem: React.FC<SelectedMedicationRequestItemProps> =
  React.memo(({ entry, medicationConfig, inputControlType, attributes }) => {
    const {
      updateDosage,
      updateDosageUnit,
      updateFrequency,
      updateRoute,
      updateDuration,
      updateDurationUnit,
      updateInstruction,
      updateIsPRN,
      updateIsSTAT,
      updateStartDate,
      updateDispenseQuantity,
      updateDispenseUnit,
      updateNote,
    } = useMedicationRequestStore(inputControlType);
    const { t } = useTranslation();
    const isMedicationRequest =
      inputControlType === MEDICATIONS_INPUT_CONTROL_KEY;

    const {
      id,
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
      doseForm,
      note,
      errors,
    } = entry;

    const [hasNote, setHasNote] = useState(!!note);
    const noteRequired = findAttr('note', attributes)?.required;

    useEffect(() => {
      const totalQuantity = calculateTotalQuantity(
        dosage,
        frequency,
        duration,
        durationUnit,
      );
      updateDispenseQuantity(id, totalQuantity);
    }, [dosage, frequency, duration, durationUnit, id, updateDispenseQuantity]);

    useEffect(() => {
      if (isMedicationRequest) {
        if (isPRN || !isSTAT) {
          updateFrequency(id, null);
        }
        if (isSTAT && !isPRN) {
          const immediateFrequency =
            medicationConfig.frequencies.find(isImmediateFrequency);
          if (immediateFrequency) {
            updateFrequency(id, immediateFrequency);
          }
        }
        if (isSTAT) {
          updateStartDate(id, getTodayDate());
        }
      } else if (isSTAT) {
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
      isPRN,
      isMedicationRequest,
      id,
      medicationConfig.frequencies,
      updateFrequency,
      updateDuration,
      updateDurationUnit,
      updateStartDate,
    ]);

    useEffect(() => {
      applyMountDefaults({
        attributes,
        medicationConfig,
        entry,
        updateDosageUnit,
        updateDispenseUnit,
        updateFrequency,
        updateDurationUnit,
        updateInstruction,
        updateRoute,
      });
    }, []);

    const medicationName = display.split('(')[0];
    const medicationDetails = display.includes('(')
      ? '(' + display.split('(').slice(1).join('(')
      : '';

    return (
      <>
        <Grid
          condensed={false}
          narrow={false}
          id={`${inputControlType}-selected-item-${id}`}
          data-testid={`${inputControlType}-selected-item-${id}-test-id`}
          aria-label={`${inputControlType}-selected-item-${id}-aria-label`}
        >
          <Column sm={2} md={4} lg={8} className={styles.itemTitle}>
            <span
              id={`${inputControlType}-name-${id}`}
              data-testid={`${inputControlType}-name-${id}-test-id`}
              aria-label={`${inputControlType}-name-${id}-aria-label`}
            >
              {medicationName}
            </span>
            {medicationDetails && (
              <span
                id={`${inputControlType}-details-${id}`}
                className={styles.itemDetails}
                data-testid={`${inputControlType}-details-${id}-test-id`}
                aria-label={`${inputControlType}-details-${id}-aria-label`}
              >
                {medicationDetails}
              </span>
            )}
            {doseForm && (
              <span
                id={`${inputControlType}-dose-form-${id}`}
                className={styles.doseForm}
                data-testid={`${inputControlType}-dose-form-${id}-test-id`}
                aria-label={`${inputControlType}-dose-form-${id}-aria-label`}
              >
                {doseForm}
              </span>
            )}
          </Column>
          <Column sm={2} md={4} lg={8} className={styles.itemActions}>
            {findAttr('stat', attributes) && (
              <Checkbox
                id={`${inputControlType}-stat-checkbox-${id}`}
                data-testid={`${inputControlType}-stat-checkbox-${id}-test-id`}
                labelText={t(`${inputControlType.toUpperCase()}_STAT`)}
                aria-label="STAT"
                checked={isSTAT}
                onChange={(e) => updateIsSTAT(id, e.target.checked)}
                className={styles.statControl}
                invalid={!!errors.stat}
                invalidText={errors.stat ? t(errors.stat) : ''}
                disabled={findAttr('stat', attributes)?.readOnly}
              />
            )}
            {isMedicationRequest && findAttr('prn', attributes) && (
              <Checkbox
                id={`${inputControlType}-prn-checkbox-${id}`}
                data-testid={`${inputControlType}-prn-checkbox-${id}-test-id`}
                labelText={t(`${inputControlType.toUpperCase()}_PRN`)}
                aria-label="PRN"
                checked={isPRN}
                onChange={(e) => updateIsPRN(id, e.target.checked)}
                invalid={!!errors.prn}
                invalidText={errors.prn ? t(errors.prn) : ''}
                disabled={findAttr('prn', attributes)?.readOnly}
              />
            )}
          </Column>

          {(findAttr('dosage', attributes) ??
            findAttr('dosageUnit', attributes)) && (
            <Column sm={2} md={4} lg={8} className={styles.dosageControls}>
              {findAttr('dosage', attributes) && (
                <NumberInput
                  id={`${inputControlType}-dosage-input-${id}`}
                  data-testid={`${inputControlType}-dosage-input-${id}-test-id`}
                  min={0}
                  step={1}
                  value={dosage}
                  label={t(
                    `${inputControlType.toUpperCase()}_DOSAGE_INPUT_LABEL`,
                  )}
                  aria-label="Dosage"
                  className={styles.dosageInput}
                  hideLabel
                  type="number"
                  onChange={(_, { value }) => {
                    updateDosage(
                      id,
                      Number.isNaN(value)
                        ? 0
                        : Number.parseFloat(String(value)),
                    );
                  }}
                  invalid={!!errors.dosage}
                  invalidText={errors.dosage ? t(errors.dosage) : ''}
                  disabled={findAttr('dosage', attributes)?.readOnly}
                />
              )}
              {findAttr('dosageUnit', attributes) && (
                <Dropdown
                  id={`${inputControlType}-dosage-unit-dropdown-${id}`}
                  data-testid={`${inputControlType}-dosage-unit-dropdown-${id}-test-id`}
                  titleText={t(
                    `${inputControlType.toUpperCase()}_DOSAGE_UNIT_INPUT_LABEL`,
                  )}
                  label={t(
                    `${inputControlType.toUpperCase()}_DOSAGE_UNIT_INPUT_LABEL`,
                  )}
                  aria-label="Dosage Unit"
                  className={styles.dosageUnit}
                  hideLabel
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
                  invalid={!!errors.dosageUnit}
                  invalidText={errors.dosageUnit ? t(errors.dosageUnit) : ''}
                  disabled={findAttr('dosageUnit', attributes)?.readOnly}
                />
              )}
            </Column>
          )}

          {findAttr('frequency', attributes) && (
            <Column sm={1} md={4} lg={8} className={styles.column}>
              <Dropdown
                id={`${inputControlType}-frequency-dropdown-${id}`}
                data-testid={`${inputControlType}-frequency-dropdown-${id}-test-id`}
                titleText={t(
                  `${inputControlType.toUpperCase()}_FREQUENCY_INPUT_LABEL`,
                )}
                label={t(
                  `${inputControlType.toUpperCase()}_FREQUENCY_INPUT_LABEL`,
                )}
                aria-label="Frequency"
                hideLabel
                items={medicationConfig.frequencies ?? []}
                itemToString={(item) => (item ? item.name : '')}
                selectedItem={frequency}
                onChange={(e) => {
                  updateFrequency(id, e.selectedItem);
                }}
                autoAlign
                invalid={!!errors.frequency}
                invalidText={errors.frequency ? t(errors.frequency) : ''}
                disabled={
                  (isMedicationRequest ? isSTAT && !isPRN : isSTAT) ||
                  !!findAttr('frequency', attributes)?.readOnly
                }
              />
            </Column>
          )}

          {(findAttr('duration', attributes) ??
            findAttr('durationUnit', attributes)) && (
            <Column sm={2} md={4} lg={8} className={styles.durationControls}>
              {findAttr('duration', attributes) && (
                <NumberInput
                  id={`${inputControlType}-duration-input-${id}`}
                  data-testid={`${inputControlType}-duration-input-${id}-test-id`}
                  label={t(
                    `${inputControlType.toUpperCase()}_DURATION_INPUT_LABEL`,
                  )}
                  aria-label="Duration"
                  className={styles.durationInput}
                  hideLabel
                  min={0}
                  step={1}
                  value={duration}
                  onChange={(_, { value }) => {
                    updateDuration(
                      id,
                      Number.isNaN(value)
                        ? 0
                        : Number.parseFloat(String(value)),
                    );
                  }}
                  invalid={!!errors.duration}
                  invalidText={errors.duration ? t(errors.duration) : ''}
                  disabled={
                    (isMedicationRequest ? isSTAT && !isPRN : isSTAT) ||
                    !!findAttr('duration', attributes)?.readOnly
                  }
                />
              )}
              {findAttr('durationUnit', attributes) && (
                <Dropdown
                  id={`${inputControlType}-duration-unit-dropdown-${id}`}
                  data-testid={`${inputControlType}-duration-unit-dropdown-${id}-test-id`}
                  titleText={t(
                    `${inputControlType.toUpperCase()}_DURATION_UNIT_INPUT_LABEL`,
                  )}
                  label={t(
                    `${inputControlType.toUpperCase()}_DURATION_UNIT_INPUT_LABEL`,
                  )}
                  aria-label="Duration Unit"
                  className={styles.durationUnit}
                  hideLabel
                  items={DURATION_UNIT_OPTIONS}
                  itemToString={(item) =>
                    item ? t(item.display, { defaultValue: item.code }) : ''
                  }
                  selectedItem={durationUnit}
                  onChange={(e) => {
                    updateDurationUnit(id, e.selectedItem);
                  }}
                  autoAlign
                  invalid={!!errors.durationUnit}
                  invalidText={
                    errors.durationUnit ? t(errors.durationUnit) : ''
                  }
                  disabled={
                    (isMedicationRequest ? isSTAT && !isPRN : isSTAT) ||
                    !!findAttr('durationUnit', attributes)?.readOnly
                  }
                />
              )}
            </Column>
          )}

          {findAttr('instruction', attributes) && (
            <Column sm={1} md={4} lg={8} className={styles.column}>
              <Dropdown
                id={`${inputControlType}-instructions-dropdown-${id}`}
                data-testid={`${inputControlType}-instructions-dropdown-${id}-test-id`}
                titleText={t(
                  `${inputControlType.toUpperCase()}_INSTRUCTIONS_INPUT_LABEL`,
                )}
                label={t(
                  `${inputControlType.toUpperCase()}_INSTRUCTIONS_INPUT_LABEL`,
                )}
                hideLabel
                items={medicationConfig.dosingInstructions ?? []}
                itemToString={(item) => (item ? item.name : '')}
                selectedItem={instruction}
                onChange={(e) => {
                  if (e.selectedItem) updateInstruction(id, e.selectedItem);
                }}
                autoAlign
                invalid={!!errors.instruction}
                invalidText={errors.instruction ? t(errors.instruction) : ''}
                disabled={findAttr('instruction', attributes)?.readOnly}
              />
            </Column>
          )}

          {findAttr('route', attributes) && (
            <Column sm={1} md={4} lg={8} className={styles.column}>
              <Dropdown
                id={`${inputControlType}-route-dropdown-${id}`}
                data-testid={`${inputControlType}-route-dropdown-${id}-test-id`}
                titleText={t(
                  `${inputControlType.toUpperCase()}_ROUTE_INPUT_LABEL`,
                )}
                label={t(`${inputControlType.toUpperCase()}_ROUTE_INPUT_LABEL`)}
                aria-label="Route"
                hideLabel
                items={medicationConfig.routes ?? []}
                itemToString={(item) => (item ? item.name : '')}
                selectedItem={route}
                onChange={(e) => {
                  if (e.selectedItem) updateRoute(id, e.selectedItem);
                }}
                autoAlign
                invalid={!!errors.route}
                invalidText={errors.route ? t(errors.route) : ''}
                disabled={findAttr('route', attributes)?.readOnly}
              />
            </Column>
          )}

          {findAttr('startDate', attributes) && (
            <Column sm={2} md={4} lg={8} className={styles.column}>
              <DatePicker
                datePickerType="single"
                data-testid={`${inputControlType}-start-date-picker-${id}-test-id`}
                value={startDate}
                minDate={getTodayDate()}
                onChange={(date) => {
                  updateStartDate(id, date[0]);
                }}
                className={styles.datePicker}
              >
                <DatePickerInput
                  id={`${inputControlType}-start-date-input-${id}`}
                  data-testid={`${inputControlType}-start-date-input-${id}-test-id`}
                  labelText={t(
                    `${inputControlType.toUpperCase()}_START_DATE_INPUT_LABEL`,
                  )}
                  aria-label="Start Date"
                  hideLabel
                  invalid={!!errors.startDate}
                  invalidText={errors.startDate ? t(errors.startDate) : ''}
                  disabled={
                    isSTAT || findAttr('startDate', attributes)?.readOnly
                  }
                />
              </DatePicker>
            </Column>
          )}
          <Column sm={4} md={8} lg={16} className={styles.footerRow}>
            {findAttr('note', attributes) && !hasNote && !noteRequired && (
              <Link
                href="#"
                id={`${inputControlType}-add-note-link-${id}`}
                data-testid={`${inputControlType}-add-note-link-${id}-test-id`}
                aria-label={`${inputControlType}-add-note-link-${id}-aria-label`}
                onClick={(e) => {
                  e.preventDefault();
                  setHasNote(true);
                }}
                disabled={findAttr('note', attributes)?.readOnly}
              >
                {t(`${inputControlType.toUpperCase()}_ADD_NOTE`)}
              </Link>
            )}
            <span
              id={`${inputControlType}-total-quantity-${id}`}
              data-testid={`${inputControlType}-total-quantity-${id}-test-id`}
              aria-label={`${inputControlType}-total-quantity-${id}-aria-label`}
            >
              {t(`${inputControlType.toUpperCase()}_TOTAL_QUANTITY`)} :{' '}
              {dispenseQuantity} {dispenseUnit?.name ?? ''}
            </span>
          </Column>
        </Grid>
        {findAttr('note', attributes) && (hasNote || noteRequired) && (
          <TextAreaWClose
            id={`${inputControlType}-note-${id}`}
            data-testid={`${inputControlType}-note-${id}-test-id`}
            labelText={t(`${inputControlType.toUpperCase()}_ADD_NOTE`)}
            placeholder={t(
              `${inputControlType.toUpperCase()}_ADD_NOTE_PLACEHOLDER`,
            )}
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
            invalid={!!errors.note}
            invalidText={errors.note ? t(errors.note) : ''}
            disabled={findAttr('note', attributes)?.readOnly}
          />
        )}
      </>
    );
  });

SelectedMedicationRequestItem.displayName = 'SelectedMedicationRequestItem';

export default SelectedMedicationRequestItem;
