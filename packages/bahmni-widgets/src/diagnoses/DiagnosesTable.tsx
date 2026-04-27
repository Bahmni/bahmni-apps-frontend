import { SortableDataTable, Tag, Tile } from '@bahmni/design-system';
import {
  formatDateTime,
  Diagnosis,
  useTranslation,
  getDiagnosesPage,
  useSubscribeConsultationSaved,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { WidgetProps } from '../registry/model';
import styles from './styles/DiagnosesTable.module.scss';

/**
 * Component to display patient diagnoses using SortableDataTable
 */
const DiagnosesTable: React.FC<WidgetProps> = ({ config }) => {
  // Number() safely handles non-numeric config values (NaN → falsy → fallback 10)
  const configPageSize = Number(config?.pageSize) || 5;
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
  const { addNotification } = useNotification();

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPageSize, setSelectedPageSize] = useState(configPageSize);

  // Use TanStack Query for data fetching and caching
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['diagnoses', patientUUID!, currentPage, selectedPageSize],
    enabled: !!patientUUID,
    placeholderData: (prev) => prev,
    queryFn: () =>
      getDiagnosesPage(patientUUID!, selectedPageSize, currentPage),
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

  // Reset pagination when patient changes
  useEffect(() => {
    setCurrentPage(1);
  }, [patientUUID]);

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

  const handlePageChange = useCallback(
    (newPage: number, newPageSize: number) => {
      if (newPageSize !== selectedPageSize) {
        // Page size changed: reset to page 1, re-fetch with new _count
        setSelectedPageSize(newPageSize);
        setCurrentPage(1);
      } else {
        // Offset-based pagination: any page can be fetched directly via
        // _getpagesoffset = (page - 1) * _count — no cursor cache needed
        setCurrentPage(newPage);
      }
    },
    [selectedPageSize],
  );

  // Define table headers
  const headers = useMemo(
    () => [
      { key: 'display', header: t('DIAGNOSIS_LIST_DIAGNOSIS') },
      { key: 'recordedDate', header: t('DIAGNOSIS_RECORDED_DATE') },
      { key: 'recorder', header: t('DIAGNOSIS_LIST_RECORDED_BY') },
    ],
    [t],
  );

  // Server sorts by _sort=-_lastUpdated (latest first); no per-page client sort needed.
  // Per-page sortByDate would only sort within a page, producing inconsistent cross-page order.
  const processedDiagnoses = data?.diagnoses ?? [];

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
          return formatDateTime(diagnosis.recordedDate, t).formattedResult;
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
          pageSize={selectedPageSize}
          totalItems={data?.total}
          page={currentPage}
          onPageChange={handlePageChange}
        />
      </div>
    </>
  );
};

export default DiagnosesTable;
