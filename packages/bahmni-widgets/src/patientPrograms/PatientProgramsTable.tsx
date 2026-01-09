import { SortableDataTable, Tag } from '@bahmni/design-system';
import {
  useTranslation,
  formatDate,
  DATE_FORMAT,
  getPatientPrograms,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { PatientProgramViewModel } from './model';
import styles from './styles/PatientProgramsTable.module.scss';
import {
  createProgramHeaders,
  createPatientProgramViewModal,
  extractProgramAttributeNames,
} from './utils';

export const programsQueryKeys = (
  patientUUID: string,
  programAttributes: string[],
) => ['programs', patientUUID, programAttributes] as const;

const fetchPatientPrograms = async (
  patientUUID: string,
  programAttributes: string[],
): Promise<PatientProgramViewModel[]> => {
  const response = await getPatientPrograms(patientUUID!);
  return createPatientProgramViewModal(response, programAttributes);
};

interface PatientProgramsTableProps {
  config: {
    fields: string[];
  };
}

/**
 * Component to display patient programs using SortableDataTable
 */
const PatientProgramsTable: React.FC<PatientProgramsTableProps> = ({
  config,
}) => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();

  const programAttributes = useMemo(
    () => extractProgramAttributeNames(config?.fields),
    [config?.fields],
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: programsQueryKeys(patientUUID!, programAttributes),
    enabled: !!patientUUID,
    queryFn: () => fetchPatientPrograms(patientUUID!, programAttributes),
  });

  const headers = useMemo(
    () => createProgramHeaders(config.fields, t),
    [config?.fields],
  );

  const renderCell = (program: PatientProgramViewModel, cellId: string) => {
    switch (cellId) {
      case 'programName':
        return (
          <span
            id={`${program.uuid}-program-name`}
            data-testid={`${program.uuid}-program-name-test-id`}
          >
            {program.programName}
          </span>
        );
      case 'startDate':
        return (
          <span
            id={`${program.uuid}-start-date`}
            data-testid={`${program.uuid}-start-date-test-id`}
          >
            {formatDate(program.dateEnrolled, t, DATE_FORMAT).formattedResult}
          </span>
        );
      case 'endDate':
        return program.dateCompleted ? (
          <span
            id={`${program.uuid}-end-date`}
            data-testid={`${program.uuid}-end-date-test-id`}
          >
            {formatDate(program.dateCompleted, t, DATE_FORMAT).formattedResult}
          </span>
        ) : (
          '-'
        );
      case 'outcome':
        return (
          <div
            id={`${program.uuid}-outcome`}
            data-testid={`${program.uuid}-outcome-test-id`}
            className={styles.outcome}
          >
            {program.outcomeName ? (
              <>
                <h3 className={styles.outcomeText}>{program.outcomeName}</h3>
                {program.outcomeDetails && (
                  <p className={styles.outcomeDetails}>
                    {program.outcomeDetails}
                  </p>
                )}
              </>
            ) : (
              <span>-</span>
            )}
          </div>
        );
      case 'state':
        return program.currentStateName ? (
          <Tag
            id={`${program.uuid}-state`}
            testId={`${program.uuid}-state-test-id`}
            type="outline"
          >
            {program.currentStateName}
          </Tag>
        ) : (
          '-'
        );
      default:
        return (
          <span
            id={`${program.uuid}-${cellId}`}
            data-testid={`${program.uuid}-${cellId}-test-id`}
          >
            {program.attributes[cellId] ?? '-'}
          </span>
        );
    }
  };

  return (
    <div
      id="patient-programs-table"
      data-testid="patient-programs-table-test-id"
      aria-label="patient-programs-table-aria-label"
    >
      <SortableDataTable
        headers={headers}
        ariaLabel={t('PROGRAMS_TABLE_ARIA_LABEL')}
        rows={data ?? []}
        loading={isLoading}
        errorStateMessage={isError ? t('ERROR_DEFAULT_TITLE') : null}
        emptyStateMessage={t('PROGRAMS_TABLE_MESSAGE_NO_DATA')}
        renderCell={renderCell}
        className={styles.table}
      />
    </div>
  );
};

export default PatientProgramsTable;
