import { SortableDataTable } from '@bahmni/design-system';
import {
  searchConceptByName,
  useTranslation,
  getPatientObservationsWithEncounterBundle,
} from '@bahmni/services';
import { useQuery, useQueries } from '@tanstack/react-query';
import classNames from 'classnames';
import { useEffect, useMemo } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { WidgetProps } from '../registry/model';
import { ObsByEncounter } from './components/ObsByEncounter';
import { ObsByEncounterAndForm } from './components/ObsByEncounterAndForm';
import styles from './styles/Observations.module.scss';
import {
  extractObservationsFromBundle,
  groupObservationsByEncounter,
  groupObservationsByEncounterAndForm,
  sortObservationsByEncounterDate,
} from './utils';

export interface ObservationConfig {
  conceptNames?: string[];
  conceptUuid?: string[];
  hideFormName?: boolean;
}

export const conceptUuidQueryKeys = (conceptName: string) =>
  ['conceptUuid', conceptName] as const;

export const observationsQueryKeys = (
  patientUUID: string,
  conceptUuids: string[],
) => ['observations', patientUUID, ...conceptUuids] as const;

const Observations: React.FC<WidgetProps> = ({ config }) => {
  const observationConfig = (config ?? {}) as ObservationConfig;
  const { conceptNames = [], conceptUuid = [] } = observationConfig;
  const patientUUID = usePatientUUID();
  const { addNotification } = useNotification();
  const { t } = useTranslation();

  const conceptQueries = useQueries({
    queries: conceptNames.map((conceptName) => ({
      queryKey: conceptUuidQueryKeys(conceptName),
      queryFn: () => searchConceptByName(conceptName),
      enabled: !!conceptName,
    })),
  });

  useEffect(() => {
    conceptQueries.forEach((query, index) => {
      if (query.isError) {
        const conceptName = conceptNames[index];
        addNotification({
          title: t('ERROR_DEFAULT_TITLE'),
          message: t('ERROR_FETCHING_CONCEPT', { conceptName }),
          type: 'error',
        });
      }
    });
  }, [conceptQueries.map((q) => q.isError).join(',')]);

  const fetchedUuids = useMemo(() => {
    return conceptQueries
      .map((query) => query.data?.uuid)
      .filter((uuid): uuid is string => !!uuid);
  }, [conceptQueries]);

  const allConceptUuids = useMemo(() => {
    return [...new Set([...fetchedUuids, ...conceptUuid])];
  }, [fetchedUuids, conceptUuid]);

  const areConceptQueriesComplete = useMemo(() => {
    if (conceptNames.length === 0) return true;
    return conceptQueries.every((query) => !query.isLoading);
  }, [conceptQueries, conceptNames.length]);

  const {
    data: observations,
    isLoading: isLoadingObservations,
    isError: isObservationsError,
  } = useQuery({
    queryKey: observationsQueryKeys(patientUUID!, allConceptUuids),
    queryFn: () =>
      getPatientObservationsWithEncounterBundle(patientUUID!, allConceptUuids),
    enabled:
      !!patientUUID && allConceptUuids.length > 0 && areConceptQueriesComplete,
  });

  useEffect(() => {
    if (isObservationsError) {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: t('ERROR_FETCHING_OBSERVATIONS'),
        type: 'error',
      });
    }
  }, [isObservationsError]);

  const groupedData = useMemo(() => {
    if (!observations) return [];

    const extractedObs = extractObservationsFromBundle(observations);
    const grouped = observationConfig.hideFormName
      ? groupObservationsByEncounter(extractedObs)
      : groupObservationsByEncounterAndForm(extractedObs);
    return sortObservationsByEncounterDate(grouped);
  }, [observations, observationConfig.hideFormName]);

  const headers = [
    { key: 'name', header: 'name' },
    { key: 'value', header: 'value' },
    { key: 'form', header: 'form' },
  ];

  const isLoading = isLoadingObservations || !areConceptQueriesComplete;
  const hasError = isObservationsError && areConceptQueriesComplete;
  const isEmpty =
    (!observations ||
      observations.entry?.length === 0 ||
      allConceptUuids.length === 0) &&
    areConceptQueriesComplete;

  const errorMessage = hasError ? t('ERROR_FETCHING_OBSERVATIONS') : null;
  const emptyMessage = isEmpty ? t('NO_OBSERVATIONS_FOUND') : undefined;

  const hasData = groupedData.length > 0 && !isLoading && !hasError;

  return (
    <div
      id="observations"
      data-testid="observations-test-id"
      aria-label="observations-aria-label"
      className={classNames({
        [styles.observations]: observationConfig.hideFormName !== true,
      })}
    >
      {hasData ? (
        observationConfig.hideFormName ? (
          <ObsByEncounter groupedData={groupedData} />
        ) : (
          <ObsByEncounterAndForm groupedData={groupedData} />
        )
      ) : (
        <SortableDataTable
          headers={headers}
          rows={[]}
          ariaLabel={t('OBSERVATIONS')}
          loading={isLoading}
          errorStateMessage={errorMessage}
          emptyStateMessage={emptyMessage}
        />
      )}
    </div>
  );
};

export default Observations;
