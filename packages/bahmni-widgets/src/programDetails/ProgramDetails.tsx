import {
  CodeSnippetSkeleton,
  Column,
  LabelValue,
  Grid,
  Tag,
  Tile,
  Button,
  MenuButton,
  MenuItem,
} from '@bahmni/design-system';
import {
  useTranslation,
  getProgramByUUID,
  updateProgramState,
  DATE_FORMAT,
  formatDate,
  camelToScreamingSnakeCase,
  hasPrivilege,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { useNotification } from '../notification';
import { useUserPrivilege } from '../userPrivileges/useUserPrivilege';
import { EDIT_PATIENT_PROGRAMS_PRIVILEGE, KNOWN_FIELDS } from './constants';
import { ProgramDetailsViewModel } from './model';
import styles from './styles/ProgramDetails.module.scss';
import {
  createProgramDetailsViewModel,
  extractProgramAttributeNames,
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
  const { addNotification } = useNotification();
  const [isUpdatingState, setIsUpdatingState] = useState(false);
  const { userPrivileges } = useUserPrivilege();
  const hasEditPatientProgramsPrivilege = hasPrivilege(
    userPrivileges,
    EDIT_PATIENT_PROGRAMS_PRIVILEGE,
  );

  const programAttributes = useMemo(
    () => extractProgramAttributeNames(config?.fields),
    [config?.fields],
  );

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: programsQueryKeys(programUUID!),
    queryFn: () => fetchProgramDetails(programUUID!, programAttributes),
    enabled: !!programUUID,
  });

  const handleButtonClick = (stateUuid: string) => {
    setIsUpdatingState(true);
    updateProgramState(programUUID, stateUuid)
      .then(() => {
        refetch();
        addNotification({
          type: 'success',
          title: t('PROGRAM_STATE_UPDATED_SUCCESSFULLY_TITLE'),
          message: t('PROGRAM_STATE_UPDATED_SUCCESSFULLY_MESSAGE'),
        });
      })
      .catch((error) => {
        const errorString = String(error);
        const start = errorString.indexOf('[') + 1;
        const end = errorString.indexOf(']');

        const errorMessage =
          start > 0 && end > start
            ? t(camelToScreamingSnakeCase(errorString.substring(start, end)))
            : t('PROGRAM_DETAILS_ERROR_UPDATING_STATE');
        addNotification({
          type: 'error',
          title: t('PROGRAM_DETAILS_STATE_CHANGE_ERROR_TITLE'),
          message: errorMessage,
        });
      })
      .finally(() => {
        setIsUpdatingState(false);
      });
  };

  const headers: Record<string, string> = useMemo(() => {
    if (!config?.fields || config.fields.length === 0) return {};
    return config.fields.reduce(
      (acc, field) => {
        acc[field] = t(
          `PROGRAMS_TABLE_HEADER_${camelToScreamingSnakeCase(field)}`,
        );
        return acc;
      },
      {} as Record<string, string>,
    );
  }, [config?.fields]);

  if (isLoading || isUpdatingState) {
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

  const renderButtons = (
    allowedStates: { uuid: string; display: string }[],
  ) => {
    if (allowedStates.length < 3) {
      return allowedStates.map((state) => (
        <Button
          id={`patient-programs-${state.uuid}-button`}
          data-testid={`patient-programs-${state.uuid}-button-test-id`}
          aria-label={`patient-programs-${state.uuid}-button-aria-label`}
          kind="ghost"
          key={state.uuid}
          disabled={isUpdatingState}
          onClick={() => handleButtonClick(state.uuid)}
        >
          {t(
            `PROGRAMS_STATE_BUTTON_${camelToScreamingSnakeCase(state.display)}`,
            state.display,
          )}
        </Button>
      ));
    }

    return (
      <MenuButton
        label={t('UPDATE_PROGRAM_STATE_BUTTON')}
        kind="ghost"
        disabled={isUpdatingState}
      >
        {allowedStates.map((state) => (
          <MenuItem
            id={`patient-programs-${state.uuid}-button`}
            data-testid={`patient-programs-${state.uuid}-button-test-id`}
            aria-label={`patient-programs-${state.uuid}-button-aria-label`}
            key={state.uuid}
            label={t(
              `PROGRAMS_STATE_BUTTON_${camelToScreamingSnakeCase(state.display)}`,
              state.display,
            )}
            onClick={() => handleButtonClick(state.uuid)}
          />
        ))}
      </MenuButton>
    );
  };

  const enableButtons =
    data.allowedStates &&
    data.allowedStates.length > 0 &&
    hasEditPatientProgramsPrivilege;

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
      <div
        id="patient-programs-header"
        data-testid="patient-programs-header-test-id"
        aria-label="patient-programs-header-aria-label"
        className={styles.header}
      >
        <Tile
          id="program-name"
          testId="program-name-test-id"
          title={data.programName}
          className={styles.title}
        >
          {data.programName}
          <Tag
            id="program-status"
            testId="program-status-test-id"
            type="outline"
          >
            {data.currentStateName}
          </Tag>
        </Tile>
        {enableButtons && (
          <div
            id="patient-programs-state-change-button-group"
            data-testid="patient-programs-state-change-button-group-test-id"
            aria-label="patient-programs-state-change-button-group-aria-label"
            role="group"
            className={styles.buttons}
          >
            {renderButtons(data.allowedStates)}
          </div>
        )}
      </div>
      <Grid className={styles.grid}>
        {Object.keys(headers).map((field) => (
          <Column sm={2} md={2} lg={3} key={field}>
            <LabelValue
              id={`program-details-${field}`}
              label={headers[field]}
              value={
                KNOWN_FIELDS.includes(field)
                  ? renderKnownField(field)
                  : (data?.attributes?.[field] ?? '-')
              }
            />
          </Column>
        ))}
      </Grid>
    </div>
  );
};

export default ProgramDetails;
