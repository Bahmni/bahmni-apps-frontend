import { SortableDataTable, Tag } from '@bahmni/design-system';
import {
  useTranslation,
  formatDateTime,
  getPatientProgramsPage,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { WidgetProps } from '../registry/model';
import { PatientProgramViewModel } from './model';
import styles from './styles/PatientProgramsTable.module.scss';
import {
  createProgramHeaders,
  createPatientProgramViewModal,
  extractProgramAttributeNames,
} from './utils';

/**
 * Component to display patient programs using SortableDataTable
 */
const PatientProgramsTable: React.FC<WidgetProps> = ({ config }) => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
  // Number() safely handles non-numeric config values (NaN → falsy → fallback 15)
  const configPageSize = Number(config?.pageSize) || 5;

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPageSize, setSelectedPageSize] = useState(configPageSize);

  const programAttributes = useMemo(
    () => extractProgramAttributeNames((config?.fields as string[]) ?? []),
    [config?.fields],
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      'programs',
      patientUUID!,
      programAttributes,
      currentPage,
      selectedPageSize,
    ],
    enabled: !!patientUUID,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const page = await getPatientProgramsPage(
        patientUUID!,
        selectedPageSize,
        currentPage,
      );
      return {
        programs: createPatientProgramViewModal(
          { results: page.programs },
          programAttributes,
        ),
        total: page.total,
      };
    },
  });

  // Reset pagination when patient changes
  useEffect(() => {
    setCurrentPage(1);
  }, [patientUUID]);

  const handlePageChange = useCallback(
    (newPage: number, newPageSize: number) => {
      if (newPageSize !== selectedPageSize) {
        // Page size changed: reset to page 1, re-fetch with new limit
        setSelectedPageSize(newPageSize);
        setCurrentPage(1);
      } else {
        // Offset-based pagination: any page can be fetched directly via
        // startIndex = (page - 1) * limit — no cursor cache needed
        setCurrentPage(newPage);
      }
    },
    [selectedPageSize],
  );

  const headers = useMemo(
    () => createProgramHeaders((config?.fields as string[]) ?? [], t),
    [config?.fields, t],
  );

  // Server-side sort is not supported by bahmniprogramenrollment endpoint.
  // Apply client-side sort by dateEnrolled descending (most recent first).
  const sortedPrograms = useMemo(() => {
    const programs = data?.programs ?? [];
    return [...programs].sort((a, b) => {
      if (!a.dateEnrolled && !b.dateEnrolled) return 0;
      if (!a.dateEnrolled) return 1;
      if (!b.dateEnrolled) return -1;
      return (
        new Date(b.dateEnrolled).getTime() - new Date(a.dateEnrolled).getTime()
      );
    });
  }, [data?.programs]);

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
            {formatDateTime(program.dateEnrolled, t).formattedResult}
          </span>
        );
      case 'endDate':
        return program.dateCompleted ? (
          <span
            id={`${program.uuid}-end-date`}
            data-testid={`${program.uuid}-end-date-test-id`}
          >
            {formatDateTime(program.dateCompleted, t).formattedResult}
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
        rows={sortedPrograms}
        loading={isLoading}
        errorStateMessage={isError ? t('ERROR_DEFAULT_TITLE') : null}
        emptyStateMessage={t('PROGRAMS_TABLE_MESSAGE_NO_DATA')}
        renderCell={renderCell}
        className={styles.table}
        dataTestId="patient-programs-table"
        pageSize={selectedPageSize}
        totalItems={data?.total}
        page={currentPage}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default PatientProgramsTable;
