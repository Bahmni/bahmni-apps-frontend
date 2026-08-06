import {
  Column,
  DatePicker,
  DatePickerInput,
  Dropdown,
  Grid,
  Link,
  TextAreaWClose,
  Tile,
} from '@bahmni/design-system';
import {
  get,
  getConfig,
  fetchMedicationOrdersMetadata,
  useTranslation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { MedicationRequest } from 'fhir/r4';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import type { EncounterSessionStartContext } from '../../../events/startConsultation';
import {
  MedicationConfig,
  MedicationJSONConfig,
} from '../../../models/medicationConfig';
import {
  fetchStopReasons,
  StopReason,
} from '../../../services/stopMedicationService';
import { useStopMedicationStore } from '../../../stores/stopMedicationsStore';
import { MEDICATIONS_CONFIG_URL } from '../medicationRequest/constants';
import medicationConfigSchema from '../medicationRequest/schema.json';
import styles from './styles/StopMedicationForm.module.scss';

interface StopMedicationFormProps {
  encounterSessionStartContext?: EncounterSessionStartContext;
}

const StopMedicationForm: React.FC<StopMedicationFormProps> = React.memo(
  ({ encounterSessionStartContext }) => {
    const { t } = useTranslation();
    const stopMedication = encounterSessionStartContext?.stopMedication as
      | MedicationRequest
      | undefined;
    const {
      stopDate,
      stopReason,
      note,
      errors,
      fieldConfig,
      setStopDate,
      setStopReason,
      setNote,
      setMedicationToStop,
      setFieldConfig,
    } = useStopMedicationStore();

    const [hasNote, setHasNote] = useState(!!note);

    // Stable ref for the DatePicker `value` prop — prevents the controlled-value cycle
    // where Carbon calls fp.setDate(value) on every Zustand update and clears the input
    // when the user re-selects the same date that is already in the store.
    const initialStopDateRef = useRef(stopDate);
    const prevMedicationIdRef = useRef<string | undefined>(stopMedication?.id);
    // Update synchronously during render so the DatePicker re-initialises to today
    // whenever a different medication is being stopped.
    if (prevMedicationIdRef.current !== stopMedication?.id) {
      prevMedicationIdRef.current = stopMedication?.id;
      initialStopDateRef.current = stopDate;
    }

    const { data: medicationConfig } = useQuery({
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

    const { data: conceptStopReasons } = useQuery({
      queryKey: ['stopReasons'],
      queryFn: fetchStopReasons,
    });

    useEffect(() => {
      if (stopMedication) {
        setMedicationToStop(stopMedication);
      }
    }, [stopMedication, setMedicationToStop]);

    useEffect(() => {
      if (medicationConfig?.stopMedicationFields) {
        setFieldConfig(medicationConfig.stopMedicationFields);
      }
    }, [medicationConfig?.stopMedicationFields, setFieldConfig]);

    const { data: orderDates } = useQuery({
      queryKey: ['orderDates', stopMedication?.id],
      queryFn: () =>
        get<{ effectiveStartDate: string; effectiveStopDate: string }>(
          `/openmrs/ws/rest/v1/order/${stopMedication!.id}?v=custom:(effectiveStartDate,effectiveStopDate)`,
        ),
      enabled: !!stopMedication?.id,
    });

    // min = effectiveStartDate (medication start), max = today
    // Scheduled (on-hold) meds: effectiveStartDate is future — cap min to today
    // Memoized so the Date object references stay stable between re-renders and
    // don't trigger unnecessary flatpickr minDate/maxDate updates.
    const isScheduled = stopMedication?.status === 'on-hold';
    const minStopDate = useMemo(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isScheduled || !orderDates?.effectiveStartDate) return today;
      return new Date(orderDates.effectiveStartDate);
    }, [isScheduled, orderDates?.effectiveStartDate]);
    const maxStopDate = useMemo(() => {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return today;
    }, []);

    if (!stopMedication) {
      return null;
    }

    const medicationName = stopMedication.medicationReference?.display ?? '';

    // Use concept-based reasons from API; fall back to config-based strings
    const stopReasons: StopReason[] =
      conceptStopReasons && conceptStopReasons.length > 0
        ? conceptStopReasons
        : (medicationConfig?.stopReasons ?? []).map((r) => ({
            uuid: r,
            display: r,
          }));

    const isStopDateVisible = fieldConfig.stopDate?.isVisible !== false;
    const isStopReasonVisible = fieldConfig.stopReason?.isVisible !== false;
    const isNoteVisible = fieldConfig.note?.isVisible !== false;

    return (
      <Tile
        className={styles.stopMedicationFormTile}
        data-testid="stop-medication-form-tile"
      >
        <div className={styles.formTitle}>
          {t('STOP_MEDICATION_FORM_TITLE')}
        </div>

        <Grid condensed={false}>
          <Column sm={4} md={8} lg={16}>
            <p className={styles.medicationName}>{medicationName}</p>
          </Column>

          {isStopDateVisible && (
            <Column sm={2} md={4} lg={8} className={styles.column}>
              <DatePicker
                key={orderDates?.effectiveStartDate ?? 'pending'}
                datePickerType="single"
                data-testid="stop-medication-date-picker"
                value={initialStopDateRef.current}
                minDate={minStopDate}
                maxDate={maxStopDate}
                onChange={(dates: Date[]) => {
                  if (dates.length > 0) {
                    setStopDate(dates[0]);
                  }
                }}
              >
                <DatePickerInput
                  id="stop-medication-date"
                  data-testid="stop-medication-date-input"
                  labelText={t('STOP_MEDICATION_DATE_LABEL')}
                  placeholder="dd/mm/yyyy"
                  size="sm"
                  invalid={!!errors.stopDate}
                  invalidText={t(errors.stopDate ?? '')}
                />
              </DatePicker>
            </Column>
          )}

          {isStopReasonVisible && (
            <Column sm={2} md={4} lg={8} className={styles.column}>
              <Dropdown
                id="stop-medication-reason"
                data-testid="stop-medication-reason-dropdown"
                titleText={t('STOP_MEDICATION_REASON_LABEL')}
                label={t('STOP_MEDICATION_REASON_LABEL')}
                items={stopReasons}
                itemToString={(item: StopReason) => (item ? item.display : '')}
                selectedItem={
                  stopReasons.find((r) => r.uuid === stopReason?.uuid) ?? null
                }
                onChange={({
                  selectedItem,
                }: {
                  selectedItem: StopReason | null;
                }) => {
                  // Allow deselection if same item clicked
                  if (selectedItem?.uuid === stopReason?.uuid) {
                    setStopReason(null);
                  } else {
                    setStopReason(selectedItem ?? null);
                  }
                }}
                size="sm"
                invalid={!!errors.stopReason}
                invalidText={t(errors.stopReason ?? '')}
              />
            </Column>
          )}

          {isNoteVisible && (
            <Column sm={4} md={8} lg={16} className={styles.column}>
              {!hasNote && (
                <Link
                  href="#"
                  data-testid="stop-medication-add-note-link"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    setHasNote(true);
                  }}
                >
                  {t('STOP_MEDICATION_ADD_NOTE')}
                </Link>
              )}
              {hasNote && (
                <TextAreaWClose
                  id="stop-medication-note"
                  data-testid="stop-medication-note"
                  labelText={t('STOP_MEDICATION_NOTE_LABEL')}
                  placeholder={t('STOP_MEDICATION_NOTE_PLACEHOLDER')}
                  value={note}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    if (e.target.value.length <= 100) {
                      setNote(e.target.value);
                    }
                  }}
                  onClose={() => {
                    setHasNote(false);
                    setNote('');
                  }}
                  enableCounter
                  maxCount={100}
                />
              )}
            </Column>
          )}
        </Grid>
      </Tile>
    );
  },
);

StopMedicationForm.displayName = 'StopMedicationForm';

export default StopMedicationForm;
