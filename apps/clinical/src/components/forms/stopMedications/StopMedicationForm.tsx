import {
  Column,
  DatePicker,
  DatePickerInput,
  Dropdown,
  Grid,
  TextArea,
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
import React, { useEffect } from 'react';

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

    if (!stopMedication) {
      return null;
    }

    const medicationName = stopMedication.medicationReference?.display ?? '';

    // min = effectiveStartDate (medication start), max = today (can't stop in the future)
    const minStopDate = orderDates?.effectiveStartDate
      ? new Date(orderDates.effectiveStartDate)
      : undefined;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const maxStopDate = today;

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
                datePickerType="single"
                data-testid="stop-medication-date-picker"
                value={stopDate}
                minDate={minStopDate}
                maxDate={maxStopDate}
                onChange={(dates: Date[]) => {
                  if (dates.length > 0) {
                    setStopDate(dates[0]);
                  }
                }}
                allowInput={false}
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
                  stopReasons.find((r) => r.display === stopReason) ?? null
                }
                onChange={({
                  selectedItem,
                }: {
                  selectedItem: StopReason | null;
                }) => {
                  // Allow deselection if same item clicked
                  if (selectedItem?.display === stopReason) {
                    setStopReason(null);
                  } else {
                    setStopReason(selectedItem?.display ?? null);
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
              <label
                htmlFor="stop-medication-note"
                className={styles.fieldLabel}
              >
                {t('STOP_MEDICATION_NOTE_LABEL')}
              </label>
              <TextArea
                id="stop-medication-note"
                data-testid="stop-medication-note"
                labelText=""
                placeholder={t('STOP_MEDICATION_NOTE_PLACEHOLDER')}
                value={note}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  setNote(e.target.value);
                }}
                maxCount={100}
                rows={3}
              />
            </Column>
          )}
        </Grid>
      </Tile>
    );
  },
);

StopMedicationForm.displayName = 'StopMedicationForm';

export default StopMedicationForm;
