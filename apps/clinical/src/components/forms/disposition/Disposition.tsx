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
import React, { useEffect, useMemo, useState } from 'react';
import { usePatientVisit } from '../../../hooks/usePatientVisit';
import type { InputControl as ClinicalInputControlConfig } from '../../../providers/clinicalConfig/models';
import {
  fetchAdmissionStatus,
  fetchDispositionTypes,
  fetchHasActiveOrderForConcept,
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
      setDateRequired,
      setHasActiveOrder,
    } = useDispositionStore();

    const isTypeRequired =
      inputControlConfig?.attributes?.find(
        (attribute) => attribute.name === 'type',
      )?.required ?? true;

    const isDateRequired =
      inputControlConfig?.attributes?.find(
        (attribute) => attribute.name === 'date',
      )?.required ?? false;

    useEffect(() => {
      setTypeRequired(isTypeRequired);
    }, [isTypeRequired, setTypeRequired]);

    useEffect(() => {
      setDateRequired(isDateRequired);
    }, [isDateRequired, setDateRequired]);

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

    const availableDispositionTypes = useMemo(
      () =>
        fetchedDispositionTypes && fetchedDispositionTypes.length > 0
          ? fetchedDispositionTypes
          : (configuredDispositionTypes ?? []),
      [fetchedDispositionTypes, configuredDispositionTypes],
    );

    const conceptUuidFor = (value: string) =>
      availableDispositionTypes.find((type) => type.value === value)
        ?.conceptUuid;

    const admitConceptUuid = conceptUuidFor('ADMIT');
    const dischargeConceptUuid = conceptUuidFor('DISCHARGE');

    const allDispositionConceptUuids = useMemo(
      () =>
        availableDispositionTypes
          .map((type) => type.conceptUuid)
          .filter((conceptUuid): conceptUuid is string => !!conceptUuid),
      [availableDispositionTypes],
    );

    const commonQueryParams = {
      patientUUID,
      visitStart: activeVisit?.period?.start,
    };

    const { data: hasActiveAdmitOrder } = useQuery({
      queryKey: [
        'dispositionHasActiveOrder',
        'ADMIT',
        commonQueryParams,
        admitConceptUuid,
      ],
      queryFn: () =>
        fetchHasActiveOrderForConcept(
          patientUUID!,
          admitConceptUuid!,
          allDispositionConceptUuids,
          activeVisit!.period!.start,
        ),
      enabled:
        !admissionStatus &&
        !!patientUUID &&
        !!activeVisit?.period?.start &&
        !!admitConceptUuid,
    });

    const { data: hasActiveDischargeOrder } = useQuery({
      queryKey: [
        'dispositionHasActiveOrder',
        'DISCHARGE',
        commonQueryParams,
        dischargeConceptUuid,
      ],
      queryFn: () =>
        fetchHasActiveOrderForConcept(
          patientUUID!,
          dischargeConceptUuid!,
          allDispositionConceptUuids,
          activeVisit!.period!.start,
        ),
      enabled:
        admissionStatus === 'Admitted' &&
        !!patientUUID &&
        !!activeVisit?.period?.start &&
        !!dischargeConceptUuid,
    });

    useEffect(() => {
      setHasActiveOrder('ADMIT', !!hasActiveAdmitOrder);
    }, [hasActiveAdmitOrder, setHasActiveOrder]);

    useEffect(() => {
      setHasActiveOrder('DISCHARGE', !!hasActiveDischargeOrder);
    }, [hasActiveDischargeOrder, setHasActiveOrder]);

    const dispositionTypes = filterDispositionTypesByAdmissionStatus(
      availableDispositionTypes,
      admissionStatus ?? null,
    );

    const [defaultDate] = useState(() => date ?? new Date());
    const minDate = useMemo(() => {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      return startOfToday;
    }, []);

    useEffect(() => {
      if (!date) {
        setDate(defaultDate);
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
                value={date ?? defaultDate}
                minDate={minDate}
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
                  invalid={!!errors.date}
                  invalidText={t(errors.date ?? '')}
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
