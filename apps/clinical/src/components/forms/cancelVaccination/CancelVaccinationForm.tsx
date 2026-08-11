import {
  Column,
  Dropdown,
  Grid,
  TextArea,
  Tile,
} from '@bahmni/design-system';
import { formatDateTime, useTranslation } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { MedicationRequest } from 'fhir/r4';
import React, { useEffect, useState } from 'react';

import type { EncounterSessionStartContext } from '../../../events/startConsultation';
import {
  fetchCancelReasons,
  CancelReason,
} from '../../../services/cancelVaccinationService';
import { useCancelVaccinationStore } from '../../../stores/cancelVaccinationStore';
import styles from './styles/CancelVaccinationForm.module.scss';

interface CancelVaccinationFormProps {
  encounterSessionStartContext?: EncounterSessionStartContext;
}

const CancelVaccinationForm: React.FC<CancelVaccinationFormProps> = React.memo(
  ({ encounterSessionStartContext }) => {
    const { t } = useTranslation();
    const cancelVaccination =
      encounterSessionStartContext?.cancelVaccination as
        | MedicationRequest
        | undefined;

    const {
      cancellationReason,
      note,
      errors,
      fieldConfig,
      setCancellationReason,
      setNote,
      setMedicationToCancel,
    } = useCancelVaccinationStore();

    const [isNoteVisible, setIsNoteVisible] = useState(false);

    const { data: conceptCancelReasons } = useQuery({
      queryKey: ['cancelReasons'],
      queryFn: fetchCancelReasons,
    });

    useEffect(() => {
      if (cancelVaccination) {
        setMedicationToCancel(cancelVaccination);
      }
    }, [cancelVaccination, setMedicationToCancel]);

    if (!cancelVaccination) {
      return null;
    }

    const medicationName =
      cancelVaccination.medicationReference?.display ?? '';

    const dosageInstruction = cancelVaccination.dosageInstruction?.[0];
    const dosage = dosageInstruction
      ? [
          dosageInstruction.doseAndRate?.[0]?.doseQuantity?.value,
          dosageInstruction.doseAndRate?.[0]?.doseQuantity?.unit,
        ]
          .filter(Boolean)
          .join(' ')
      : '';

    const instruction = dosageInstruction?.text ?? '';
    const startDate = cancelVaccination.dosageInstruction?.[0]?.timing?.repeat
      ?.boundsPeriod?.start
      ?? cancelVaccination.authoredOn
      ?? '';
    const orderedBy = cancelVaccination.requester?.display ?? '';
    const orderedOn = cancelVaccination.authoredOn ?? '';

    const cancelReasons: CancelReason[] =
      conceptCancelReasons && conceptCancelReasons.length > 0
        ? conceptCancelReasons
        : [];

    const isCancellationReasonVisible =
      fieldConfig.cancellationReason?.isVisible !== false;
    const isNoteFieldVisible = fieldConfig.note?.isVisible !== false;

    return (
      <Tile
        className={styles.cancelVaccinationFormTile}
        data-testid="cancel-vaccination-form-tile"
      >
        <div className={styles.formTitle}>
          {t('CANCEL_VACCINATION_FORM_TITLE')}
        </div>

        {/* Medication Info Card */}
        <div
          className={styles.medicationInfoCard}
          data-testid="cancel-vaccination-medication-info"
        >
          <p className={styles.medicationName}>{medicationName}</p>
          <div className={styles.medicationDetails}>
            {dosage && (
              <div className={styles.medicationDetailItem}>
                <span className={styles.detailLabel}>
                  {t('CANCEL_VACCINATION_DOSAGE_LABEL')}
                </span>
                <span className={styles.detailValue}>{dosage}</span>
              </div>
            )}
            {instruction && (
              <div className={styles.medicationDetailItem}>
                <span className={styles.detailLabel}>
                  {t('CANCEL_VACCINATION_INSTRUCTIONS_LABEL')}
                </span>
                <span className={styles.detailValue}>{instruction}</span>
              </div>
            )}
            {startDate && (
              <div className={styles.medicationDetailItem}>
                <span className={styles.detailLabel}>
                  {t('CANCEL_VACCINATION_START_DATE_LABEL')}
                </span>
                <span className={styles.detailValue}>
                  {formatDateTime(startDate, t).formattedResult}
                </span>
              </div>
            )}
            {orderedBy && (
              <div className={styles.medicationDetailItem}>
                <span className={styles.detailLabel}>
                  {t('CANCEL_VACCINATION_ORDERED_BY_LABEL')}
                </span>
                <span className={styles.detailValue}>{orderedBy}</span>
              </div>
            )}
            {orderedOn && (
              <div className={styles.medicationDetailItem}>
                <span className={styles.detailLabel}>
                  {t('CANCEL_VACCINATION_ORDERED_ON_LABEL')}
                </span>
                <span className={styles.detailValue}>
                  {formatDateTime(orderedOn, t).formattedResult}
                </span>
              </div>
            )}
          </div>
        </div>

        <Grid condensed={false}>
          {isCancellationReasonVisible && (
            <Column sm={4} md={8} lg={16} className={styles.column}>
              <Dropdown
                id="cancel-vaccination-reason"
                data-testid="cancel-vaccination-reason-dropdown"
                titleText={t('CANCEL_VACCINATION_REASON_LABEL')}
                label={t('CANCEL_VACCINATION_REASON_LABEL')}
                items={cancelReasons}
                itemToString={(item: CancelReason) =>
                  item ? item.display : ''
                }
                selectedItem={
                  cancelReasons.find(
                    (r) => r.display === cancellationReason,
                  ) ?? null
                }
                onChange={({
                  selectedItem,
                }: {
                  selectedItem: CancelReason | null;
                }) => {
                  if (selectedItem?.display === cancellationReason) {
                    setCancellationReason(null);
                  } else {
                    setCancellationReason(selectedItem?.display ?? null);
                  }
                }}
                size="sm"
                invalid={!!errors.cancellationReason}
                invalidText={t(errors.cancellationReason ?? '')}
              />
            </Column>
          )}

          {isNoteFieldVisible && !isNoteVisible && (
            <Column sm={4} md={8} lg={16} className={styles.column}>
              <button
                type="button"
                className={styles.addNoteLink}
                data-testid="cancel-vaccination-add-note-link"
                onClick={() => setIsNoteVisible(true)}
              >
                {t('CANCEL_VACCINATION_ADD_NOTE')}
              </button>
            </Column>
          )}

          {isNoteFieldVisible && isNoteVisible && (
            <Column sm={4} md={8} lg={16} className={styles.column}>
              <div className={styles.noteLabelRow}>
                <label
                  htmlFor="cancel-vaccination-note"
                  className={styles.fieldLabel}
                >
                  {t('CANCEL_VACCINATION_NOTE_LABEL')}
                </label>
                <span className={styles.noteCounter}>{note.length}/100</span>
              </div>
              <TextArea
                id="cancel-vaccination-note"
                data-testid="cancel-vaccination-note"
                labelText=""
                placeholder={t('CANCEL_VACCINATION_NOTE_PLACEHOLDER')}
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

CancelVaccinationForm.displayName = 'CancelVaccinationForm';

export default CancelVaccinationForm;
