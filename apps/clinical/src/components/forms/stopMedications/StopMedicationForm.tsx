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
  searchFHIRConcepts,
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

    const cancelReasonValueSetUuid =
      encounterSessionStartContext?.cancelReasonValueSetUuid as
        | string
        | undefined;

    // When a cancelReasonValueSetUuid is provided via context, this form is being
    // used to cancel a vaccination order — reusing the existing stop medication
    // component rather than duplicating it.
    const isCancelVaccinationMode = !!cancelReasonValueSetUuid;

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
      setIsCancelVaccination,
    } = useStopMedicationStore();

    // In cancel vaccination mode: note is hidden behind an "Add Note" toggle link,
    // matching the original CancelVaccinationForm behaviour.
    const [isCancelNoteVisible, setIsCancelNoteVisible] = useState(false);

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

    // Fetch reasons from the default "Stopped Order Reason" ValueSet when not in
    // cancel vaccination mode.
    const { data: conceptStopReasons } = useQuery({
      queryKey: ['stopReasons'],
      queryFn: fetchStopReasons,
      enabled: !isCancelVaccinationMode,
    });

    // When a cancelReasonValueSetUuid is provided, fetch reasons from that
    // configurable ValueSet instead of the default stop-reason list.
    const { data: cancelReasonValueSet } = useQuery({
      queryKey: ['cancelReasonValueSet', cancelReasonValueSetUuid],
      queryFn: () => searchFHIRConcepts(cancelReasonValueSetUuid!),
      enabled: isCancelVaccinationMode,
      staleTime: Infinity,
    });

    useEffect(() => {
      if (stopMedication) {
        setMedicationToStop(stopMedication);
      }
    }, [stopMedication, setMedicationToStop]);

    useEffect(() => {
      setIsCancelVaccination(isCancelVaccinationMode);
    }, [isCancelVaccinationMode, setIsCancelVaccination]);

    useEffect(() => {
      if (!isCancelVaccinationMode && medicationConfig?.stopMedicationFields) {
        setFieldConfig(medicationConfig.stopMedicationFields);
      }
    }, [
      isCancelVaccinationMode,
      medicationConfig?.stopMedicationFields,
      setFieldConfig,
    ]);

    const { data: orderDates } = useQuery({
      queryKey: ['orderDates', stopMedication?.id],
      queryFn: () =>
        get<{ effectiveStartDate: string; effectiveStopDate: string }>(
          `/openmrs/ws/rest/v1/order/${stopMedication!.id}?v=custom:(effectiveStartDate,effectiveStopDate)`,
        ),
      enabled: !!stopMedication?.id && !isCancelVaccinationMode,
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
    const route =
      stopMedication.dosageInstruction?.[0]?.route?.coding?.[0]?.display ?? '';

    // Use cancel vaccination reasons when in cancel mode; otherwise use
    // concept-based stop reasons from API with config-based strings as fallback.
    const stopReasons: StopReason[] = isCancelVaccinationMode
      ? (cancelReasonValueSet?.expansion?.contains?.map((c) => ({
          uuid: c.code ?? '',
          display: c.display ?? '',
        })) ?? [])
      : conceptStopReasons && conceptStopReasons.length > 0
        ? conceptStopReasons
        : (medicationConfig?.stopReasons ?? []).map((r) => ({
            uuid: r,
            display: r,
          }));

    // In cancel vaccination mode: hide the date picker (date is automatically
    // set to today by the service) and always show the reason dropdown.
    const isStopDateVisible =
      !isCancelVaccinationMode && fieldConfig.stopDate?.isVisible !== false;
    const isStopReasonVisible = fieldConfig.stopReason?.isVisible !== false;
    const isNoteVisible = fieldConfig.note?.isVisible !== false;

    // Labels and placeholders differ between stop medication and cancel vaccination.
    const reasonTitleText = isCancelVaccinationMode
      ? t('CANCEL_VACCINATION_REASON_LABEL')
      : t('STOP_MEDICATION_REASON_LABEL');
    const noteLabelText = isCancelVaccinationMode
      ? t('CANCEL_VACCINATION_NOTE_LABEL')
      : t('STOP_MEDICATION_NOTE_LABEL');
    const notePlaceholder = isCancelVaccinationMode
      ? t('CANCEL_VACCINATION_NOTE_PLACEHOLDER')
      : t('STOP_MEDICATION_NOTE_PLACEHOLDER');

    return (
      <Tile
        className={styles.stopMedicationFormTile}
        data-testid="stop-medication-form-tile"
      >
        {/* Form title: only shown in stop medication mode */}
        {!isCancelVaccinationMode && (
          <div className={styles.formTitle}>
            {t('STOP_MEDICATION_FORM_TITLE')}
          </div>
        )}

        {/* Medication info: info-card style with route in cancel mode, plain name in stop mode */}
        {isCancelVaccinationMode ? (
          <div
            className={styles.medicationInfoCard}
            data-testid="cancel-vaccination-medication-info"
          >
            <span className={styles.infoCardName}>{medicationName}</span>
            {route && (
              <span className={styles.medicationRoute}>[{route}]</span>
            )}
          </div>
        ) : (
          <Grid condensed={false}>
            <Column sm={4} md={8} lg={16}>
              <p className={styles.medicationName}>{medicationName}</p>
            </Column>
          </Grid>
        )}

        <Grid
          condensed={isCancelVaccinationMode}
          className={isCancelVaccinationMode ? styles.fieldsGrid : undefined}
        >
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
            <Column
              sm={isCancelVaccinationMode ? 4 : 2}
              md={isCancelVaccinationMode ? 8 : 4}
              lg={isCancelVaccinationMode ? 16 : 8}
              className={isCancelVaccinationMode ? styles.cancelField : styles.column}
            >
              <Dropdown
                id="stop-medication-reason"
                data-testid="stop-medication-reason-dropdown"
                titleText={reasonTitleText}
                label={reasonTitleText}
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

          {/* Note field: in cancel mode shows "Add Note" link that toggles to textarea */}
          {isNoteVisible && isCancelVaccinationMode && !isCancelNoteVisible && (
            <Column sm={4} md={8} lg={16} className={styles.cancelField}>
              <button
                type="button"
                className={styles.addNoteLink}
                data-testid="cancel-vaccination-add-note-link"
                onClick={() => setIsCancelNoteVisible(true)}
              >
                {t('CANCEL_VACCINATION_ADD_NOTE')}
              </button>
            </Column>
          )}

          {isNoteVisible && (!isCancelVaccinationMode || isCancelNoteVisible) && (
            <Column
              sm={4}
              md={8}
              lg={16}
              className={isCancelVaccinationMode ? styles.cancelField : styles.column}
            >
              <div className={styles.noteLabelRow}>
                <label
                  htmlFor="stop-medication-note"
                  className={styles.fieldLabel}
                >
                  {noteLabelText}
                </label>
                <span className={styles.noteCounter}>{note.length}/100</span>
              </div>
              <TextArea
                id="stop-medication-note"
                data-testid="stop-medication-note"
                labelText=""
                placeholder={notePlaceholder}
                value={note}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  if (e.target.value.length <= 100) {
                    setNote(e.target.value);
                  }
                }}
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
