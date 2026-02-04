import { SortableDataTable, Tag, Tile } from '@bahmni/design-system';
import {
  formatDate,
  sortByDate,
  Diagnosis,
  DATE_FORMAT,
  useTranslation,
  getPatientDiagnoses,
  useSubscribeConsultationSaved,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useCallback, useEffect } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import styles from './styles/DiagnosesTable.module.scss';

/**
 * Component to display patient diagnoses using SortableDataTable
 */
const DiagnosesTable: React.FC = () => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
  const { addNotification } = useNotification();

  // Use TanStack Query for data fetching and caching
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['diagnoses', patientUUID!],
    enabled: !!patientUUID,
    queryFn: () => getPatientDiagnoses(patientUUID!),
  });

  // Listen to consultation saved events and refetch if diagnoses were updated
  useSubscribeConsultationSaved(
    (payload) => {
      // Only refetch if:
      // 1. Event is for the same patient
      // 2. Conditions/diagnoses were modified during consultation
      if (
        payload.patientUUID === patientUUID &&
        payload.updatedResources.conditions
      ) {
        refetch();
      }
    },
    [patientUUID, refetch],
  );

  // Handle errors with notifications
  useEffect(() => {
    if (isError) {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: error.message,
        type: 'error',
      });
    }
  }, [isError, error, addNotification, t]);

  // Define table headers
  const headers = useMemo(
    () => [
      { key: 'display', header: t('DIAGNOSIS_LIST_DIAGNOSIS') },
      { key: 'recordedDate', header: t('DIAGNOSIS_RECORDED_DATE') },
      { key: 'recorder', header: t('DIAGNOSIS_LIST_RECORDED_BY') },
    ],
    [t],
  );

  const processedDiagnoses = useMemo(() => {
    return sortByDate(data ?? [], 'recordedDate');
  }, [data]);

  const renderCell = useCallback(
    (diagnosis: Diagnosis, cellId: string) => {
      switch (cellId) {
        case 'display':
          return (
            <div>
              <div className={styles.diagnosisName}>{diagnosis.display}</div>
              <Tag
                data-testid={'certainity-tag'}
                className={
                  diagnosis.certainty.code === 'confirmed'
                    ? styles.confirmedCell
                    : styles.provisionalCell
                }
              >
                {diagnosis.certainty.code === 'confirmed'
                  ? t('CERTAINITY_CONFIRMED')
                  : t('CERTAINITY_PROVISIONAL')}
              </Tag>
            </div>
          );
        case 'recordedDate':
          return formatDate(diagnosis.recordedDate, t, DATE_FORMAT)
            .formattedResult;
        case 'recorder':
          return diagnosis.recorder || t('DIAGNOSIS_TABLE_NOT_AVAILABLE');
        default:
          return null;
      }
    },
    [t],
  );

  return (
    <>
      <Tile
        title={t('DIAGNOSES_DISPLAY_CONTROL_HEADING')}
        data-testid="diagnoses-title"
        className={styles.diagnosesTableTitle}
      >
        <p>{t('DIAGNOSES_DISPLAY_CONTROL_HEADING')}</p>
      </Tile>
      <div data-testid="diagnoses-table">
        <SortableDataTable
          headers={headers}
          ariaLabel={t('DIAGNOSES_DISPLAY_CONTROL_HEADING')}
          rows={processedDiagnoses}
          loading={isLoading}
          errorStateMessage={isError ? error.message : null}
          emptyStateMessage={t('NO_DIAGNOSES')}
          renderCell={renderCell}
          className={styles.diagnosesTableBody}
          dataTestId="diagnoses-table"
        />
      </div>
    </>
  );
};

export default DiagnosesTable;
