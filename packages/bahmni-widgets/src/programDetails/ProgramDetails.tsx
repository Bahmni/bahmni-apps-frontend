import {
  CodeSnippetSkeleton,
  Column,
  LabelValue,
  Grid,
  Tag,
  Tile,
} from '@bahmni/design-system';
import {
  useTranslation,
  getProgramByUUID,
  DATE_FORMAT,
  formatDate,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { KNOWN_FIELDS } from './constants';
import { ProgramDetailsViewModel } from './model';
import styles from './styles/ProgramDetails.module.scss';
import {
  createProgramDetailsViewModel,
  extractProgramAttributeNames,
  createProgramHeader,
} from './utils';

export const programsQueryKeys = (programUUID: string) =>
  ['programs', programUUID] as const;

const fetchProgramDetails = async (
  programUUID: string,
  programAttributes: string[],
): Promise<ProgramDetailsViewModel> => {
  const response = await getProgramByUUID(programUUID!);
  return createProgramDetailsViewModel(response, programAttributes);
};

interface ProgramDetailsProps {
  programUUID: string;
  config: {
    fields: string[];
  };
}

/**
 * Component to display programs details
 */
const ProgramDetails: React.FC<ProgramDetailsProps> = ({
  programUUID,
  config,
}) => {
  const { t } = useTranslation();

  const programAttributes = useMemo(
    () => extractProgramAttributeNames(config?.fields),
    [config?.fields],
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: programsQueryKeys(programUUID!),
    queryFn: () => fetchProgramDetails(programUUID!, programAttributes),
    enabled: !!programUUID,
  });

  const headers: Record<string, string> = useMemo(() => {
    if (!config?.fields || config.fields.length === 0) return {};
    return config.fields.reduce(
      (acc, field) => {
        acc[field] = t(createProgramHeader(field));
        return acc;
      },
      {} as Record<string, string>,
    );
  }, [config?.fields]);

  if (isLoading) {
    return (
      <div
        id="patient-programs-table-loading"
        data-testid="patient-programs-table-loading-test-id"
        aria-label="patient-programs-table-loading-aria-label"
      >
        <CodeSnippetSkeleton type="multi" className={styles.loading} />
      </div>
    );
  }

  if (!programUUID || isError || !data) {
    return (
      <div
        id="patient-programs-table-error"
        data-testid="patient-programs-table-error-test-id"
        aria-label="patient-programs-table-error-aria-label"
        className={styles.error}
      >
        {t('ERROR_FETCHING_PROGRAM_DETAILS')}
      </div>
    );
  }

  const renderKnownField = (field: string) => {
    switch (field) {
      case 'programName':
        return data.programName;
      case 'startDate':
        return formatDate(data.dateEnrolled, t, DATE_FORMAT).formattedResult;
      case 'endDate':
        return data.dateCompleted
          ? formatDate(data.dateCompleted, t, DATE_FORMAT).formattedResult
          : '-';
      case 'outcome':
        return data.outcomeName ?? '-';
      case 'state':
        return data.currentStateName ?? '-';
    }
  };

  return (
    <div
      id="patient-programs-tile"
      data-testid="patient-programs-tile-test-id"
      aria-label="patient-programs-tile-aria-label"
      className={styles.programDetails}
    >
      <Tile
        id="program-name"
        testId="program-name-test-id"
        title={data.programName}
        className={styles.title}
      >
        {data.programName}
        <Tag id="program-status" testId="program-status-test-id" type="outline">
          {data.currentStateName}
        </Tag>
      </Tile>
      <Grid className={styles.grid}>
        {Object.keys(headers).map((field) => (
          <Column sm={2} md={2} lg={3} key={field} className={styles.column}>
            <LabelValue
              id={`program-details-${field}`}
              label={headers[field]}
              value={
                KNOWN_FIELDS.includes(field)
                  ? renderKnownField(field)
                  : field in data.attributes
                    ? data.attributes[field]
                    : '-'
              }
            />
          </Column>
        ))}
      </Grid>
    </div>
  );
};

export default ProgramDetails;
