import { SortableDataTable, StatusTag } from '@bahmni/design-system';
import {
  getPatientPrograms,
  useTranslation,
  formatDate,
  DATE_FORMAT,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { ProgramViewModel } from './model';
import styles from './ProgramsDetails.module.scss';
import { createProgramViewModels } from './utils';

// Query Keys for React Query
export const programsQueryKeys = (patientUUID: string) =>
  ['programs', patientUUID] as const;

const fetchPrograms = async (
  patientUUID: string,
): Promise<ProgramViewModel[]> => {
  const response = await getPatientPrograms(patientUUID!);
  return createProgramViewModels([
    ...response.activePrograms,
    ...response.endedPrograms,
  ]);
};

/**
 * Component to display patient programs using SortableDataTable
 */
const ProgramsDetails: React.FC = () => {
  const [programs, setPrograms] = useState<ProgramViewModel[]>([]);
  const patientUUID = usePatientUUID();
  const { t } = useTranslation();
  const { addNotification } = useNotification();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: programsQueryKeys(patientUUID!),
    enabled: !!patientUUID,
    queryFn: () => fetchPrograms(patientUUID!),
  });

  useEffect(() => {
    if (isError)
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: error.message,
        type: 'error',
      });
    if (data) setPrograms(data);
  }, [data, isLoading, isError, error, t, addNotification]);

  const headers = useMemo(
    () => [
      { key: 'programName', header: t('PROGRAMS_EPISODE_OF_CARE') },
      { key: 'referenceNumber', header: t('PROGRAMS_REFERENCE_NUMBER') },
      { key: 'destination', header: t('PROGRAMS_DESTINATION') },
      { key: 'startDate', header: t('PROGRAMS_START_DATE') },
      { key: 'endDate', header: t('PROGRAMS_END_DATE') },
      { key: 'outcome', header: t('PROGRAMS_OUTCOME') },
      { key: 'status', header: t('PROGRAMS_STATUS') },
    ],
    [t],
  );

  const renderCell = (program: ProgramViewModel, cellId: string) => {
    switch (cellId) {
      case 'programName':
        return <span>{program.programName}</span>;
      case 'referenceNumber':
        return <span>{program.referenceNumber}</span>;
      case 'destination':
        return <span>{program.destination ?? '…'}</span>;
      case 'startDate':
        return (
          <span>
            {formatDate(program.dateEnrolled, t, DATE_FORMAT).formattedResult}
          </span>
        );
      case 'endDate':
        return (
          <span>
            {program.dateEnded
              ? formatDate(program.dateEnded, t, DATE_FORMAT).formattedResult
              : '…'}
          </span>
        );
      case 'outcome':
        return (
          <div className={styles.outcomeContainer}>
            {program.outcome ? (
              <>
                <span className={styles.outcomeText}>{program.outcome}</span>
                {program.outcomeDetails && (
                  <p className={styles.outcomeDetails}>
                    {program.outcomeDetails}
                  </p>
                )}
              </>
            ) : (
              <span>…</span>
            )}
          </div>
        );
      case 'status':
        return (
          <StatusTag
            label={t(program.statusKey)}
            dotClassName={styles[program.statusClassName]}
            testId={`program-status-${program.uuid}`}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SortableDataTable<ProgramViewModel>
      headers={headers}
      ariaLabel={t('PROGRAMS_TABLE_ARIA_LABEL')}
      rows={programs}
      loading={isLoading}
      errorStateMessage={isError ? error?.message : null}
      emptyStateMessage={t('PROGRAMS_NO_DATA')}
      renderCell={renderCell}
      className={styles.programsTableBody}
    />
  );
};

export default ProgramsDetails;
