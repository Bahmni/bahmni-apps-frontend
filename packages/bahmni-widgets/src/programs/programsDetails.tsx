import { SortableDataTable, StatusTag } from '@bahmni/design-system';
import { useTranslation, formatDate, DATE_FORMAT } from '@bahmni/services';
import React, { useMemo } from 'react';
import { formattedProgram } from './model';
import styles from './ProgramsDetails.module.scss';
import usePrograms from './usePrograms';
import { parseAttributeField, generateTranslationKey } from './utils';

interface ProgramsDetailsProps {
  config?: {
    fields?: string[];
  };
}

// Mapping of column keys to their translation keys
const COLUMN_HEADERS: Record<string, string> = {
  programName: 'PROGRAMS_EPISODE_OF_CARE',
  referenceNumber: 'PROGRAMS_REFERENCE_NUMBER',
  destination: 'PROGRAMS_DESTINATION',
  startDate: 'PROGRAMS_START_DATE',
  endDate: 'PROGRAMS_END_DATE',
  outcome: 'PROGRAMS_OUTCOME',
  status: 'PROGRAMS_STATUS',
};

/**
 * Component to display patient programs using SortableDataTable
 */
const ProgramsDetails: React.FC<ProgramsDetailsProps> = ({ config }) => {
  const { t } = useTranslation();
  const { programs, isLoading, hasError } = usePrograms(config?.fields);

  // Get visible columns from config
  const column_Headers = useMemo(() => {
    return config?.fields ?? [];
  }, [config?.fields]);

  const headers = useMemo(() => {
    return column_Headers.map((field) => {
      const parsed = parseAttributeField(field);

      if (parsed.isAttribute && parsed.path && parsed.property) {
        // Generate dynamic translation key for path-based fields
        const translationKey = generateTranslationKey(
          parsed.path,
          parsed.property,
        );
        return {
          key: field,
          header: t(translationKey),
        };
      }

      return {
        key: field,
        header: t(COLUMN_HEADERS[field] || field),
      };
    });
  }, [column_Headers, t]);

  const renderCell = (program: formattedProgram, cellId: string) => {
    const parsed = parseAttributeField(cellId);
    if (parsed.isAttribute) {
      return <span>{program.attributes[cellId] || '…'}</span>;
    }

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
    <SortableDataTable<formattedProgram>
      headers={headers}
      ariaLabel={t('PROGRAMS_TABLE_ARIA_LABEL')}
      rows={programs}
      loading={isLoading}
      errorStateMessage={hasError ? t('ERROR_DEFAULT_TITLE') : null}
      emptyStateMessage={t('PROGRAMS_NO_DATA')}
      renderCell={renderCell}
      className={styles.programsTableBody}
    />
  );
};

export default ProgramsDetails;
