import {
  DatePicker,
  DatePickerInput,
  Dropdown,
  TextArea,
  Tile,
} from '@bahmni/design-system';
import {
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
import { useStopMedicationStore } from '../../../stores/stopMedicationsStore';
import { MEDICATIONS_CONFIG_URL } from '../medications/constants';
import medicationConfigSchema from '../medications/schema.json';
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

    if (!stopMedication) {
      return null;
    }

    const medicationName = stopMedication.medicationReference?.display ?? '';
    const stopReasons = medicationConfig?.stopReasons ?? [];

    const isStopDateVisible = fieldConfig.stopDate?.isVisible !== false;
    const isStopReasonVisible = fieldConfig.stopReason?.isVisible !== false;
    const isNoteVisible = fieldConfig.note?.isVisible !== false;

    return (
      <Tile className={styles.stopMedicationFormTile}>
        <h4 className={styles.stopMedicationFormTitle}>
          {t('STOP_MEDICATION_FORM_TITLE')}
        </h4>

        <div className={styles.formField}>
          <p className={styles.medicationName}>
            <strong>{t('STOP_MEDICATION_NAME_LABEL')}:</strong> {medicationName}
          </p>
        </div>

        {isStopDateVisible && (
          <div className={styles.formField}>
            <DatePicker
              datePickerType="single"
              data-testid="stop-medication-date-picker"
              value={stopDate}
              minDate={new Date().toISOString()}
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
          </div>
        )}

        {isStopReasonVisible && (
          <div className={styles.formField}>
            <Dropdown
              id="stop-medication-reason"
              data-testid="stop-medication-reason-dropdown"
              titleText={t('STOP_MEDICATION_REASON_LABEL')}
              label={t('STOP_MEDICATION_REASON_LABEL')}
              items={stopReasons}
              itemToString={(item: string) => item ?? ''}
              selectedItem={stopReason}
              onChange={({ selectedItem }: { selectedItem: string }) => {
                setStopReason(selectedItem);
              }}
              size="sm"
              invalid={!!errors.stopReason}
              invalidText={t(errors.stopReason ?? '')}
            />
          </div>
        )}

        {isNoteVisible && (
          <div className={styles.formField}>
            <TextArea
              id="stop-medication-note"
              data-testid="stop-medication-note"
              labelText={t('STOP_MEDICATION_NOTE_LABEL')}
              value={note}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setNote(e.target.value);
              }}
              maxCount={100}
              rows={2}
            />
          </div>
        )}
      </Tile>
    );
  },
);

StopMedicationForm.displayName = 'StopMedicationForm';

export default StopMedicationForm;
