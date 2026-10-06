import {
  Column,
  DatePicker,
  DatePickerInput,
  Dropdown,
  Grid,
  TextAreaWClose,
  Tile,
} from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { usePatientUUID } from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { usePatientVisit } from '../../../hooks/usePatientVisit';
import type { InputControl as ClinicalInputControlConfig } from '../../../providers/clinicalConfig/models';
import {
  fetchAdmissionStatus,
  fetchDispositionTypes,
  filterDispositionTypesByAdmissionStatus,
} from '../../../services/dispositionService';
import {
  useDispositionStore,
  type DispositionType,
} from '../../../stores/dispositionStore';
import styles from './styles/Disposition.module.scss';

interface DispositionProps {
  inputControlConfig?: ClinicalInputControlConfig;
}

const DEFAULT_NOTES_MAX_LENGTH = 100;

const Disposition: React.FC<DispositionProps> = React.memo(
  ({ inputControlConfig }) => {
    const { t } = useTranslation();
    const {
      selectedType,
      date,
      notes,
      errors,
      setSelectedType,
      setDate,
      setNotes,
      setTypeRequired,
    } = useDispositionStore();

    const isTypeRequired =
      inputControlConfig?.attributes?.find(
        (attribute) => attribute.name === 'type',
      )?.required ?? true;

    useEffect(() => {
      setTypeRequired(isTypeRequired);
    }, [isTypeRequired, setTypeRequired]);

    const configuredDispositionTypes = inputControlConfig?.metadata
      ?.dispositionTypes as DispositionType[] | undefined;

    const { data: fetchedDispositionTypes } = useQuery({
      queryKey: ['dispositionTypes'],
      queryFn: fetchDispositionTypes,
    });

    const patientUUID = usePatientUUID();
    const { activeVisit } = usePatientVisit(patientUUID);

    const { data: admissionStatus } = useQuery({
      queryKey: ['dispositionAdmissionStatus', activeVisit?.id],
      queryFn: () => fetchAdmissionStatus(activeVisit!.id!),
      enabled: !!activeVisit?.id,
    });

    const availableDispositionTypes =
      fetchedDispositionTypes && fetchedDispositionTypes.length > 0
        ? fetchedDispositionTypes
        : (configuredDispositionTypes ?? []);

    const dispositionTypes = filterDispositionTypesByAdmissionStatus(
      availableDispositionTypes,
      admissionStatus ?? null,
    );

    useEffect(() => {
      if (!date) {
        setDate(new Date());
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const notesMaxLength =
      (inputControlConfig?.metadata?.notesMaxLength as number | undefined) ??
      DEFAULT_NOTES_MAX_LENGTH;

    const showDatePicker =
      (inputControlConfig?.metadata?.showDatePicker as boolean | undefined) ??
      true;

    return (
      <Tile className={styles.dispositionTile} data-testid="disposition-tile">
        <div className={styles.formTitle} data-testid="disposition-form-title">
          {t('DISPOSITION_FORM_TITLE')}
        </div>

        <Grid condensed={false}>
          <Column sm={2} md={4} lg={8} className={styles.column}>
            <Dropdown
              id="disposition-type"
              data-testid="disposition-type-dropdown"
              titleText={t('DISPOSITION_TYPE_LABEL')}
              label={t('DISPOSITION_TYPE_PLACEHOLDER')}
              items={dispositionTypes}
              itemToString={(item: DispositionType | null) =>
                item ? item.label : ''
              }
              selectedItem={selectedType}
              onChange={({
                selectedItem,
              }: {
                selectedItem: DispositionType | null;
              }) => setSelectedType(selectedItem ?? null)}
              size="sm"
              invalid={!!errors.type}
              invalidText={t(errors.type ?? '')}
            />
          </Column>

          {showDatePicker && (
            <Column sm={2} md={4} lg={8} className={styles.column}>
              <DatePicker
                datePickerType="single"
                className={styles.datePicker}
                data-testid="disposition-date-picker"
                value={date ?? undefined}
                onChange={(dates: Date[]) => {
                  if (dates.length > 0) {
                    setDate(dates[0]);
                  }
                }}
              >
                <DatePickerInput
                  id="disposition-date"
                  data-testid="disposition-date-input"
                  labelText={t('DISPOSITION_DATE_LABEL')}
                  placeholder="dd/mm/yyyy"
                  size="sm"
                />
              </DatePicker>
            </Column>
          )}

          <Column sm={4} md={8} lg={16} className={styles.noteColumn}>
            <TextAreaWClose
              id="disposition-notes"
              data-testid="disposition-notes"
              labelText={t('DISPOSITION_NOTES_LABEL')}
              placeholder={t('DISPOSITION_NOTES_PLACEHOLDER')}
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                if (e.target.value.length <= notesMaxLength) {
                  setNotes(e.target.value);
                }
              }}
              onClose={() => setNotes('')}
              enableCounter
              maxCount={notesMaxLength}
            />
          </Column>
        </Grid>
      </Tile>
    );
  },
);

Disposition.displayName = 'Disposition';

export default Disposition;
