import { SortableDataTable, Tile } from '@bahmni/design-system';
import {
  searchConceptByName,
  useTranslation,
  getPatientObservationsWithEncounterBundle,
} from '@bahmni/services';
import { useQuery, useQueries } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { WidgetProps } from '../registry/model';
import { ObsByEncounter } from './components/ObsByEncounter';
import styles from './styles/Observations.module.scss';
import {
  extractObservationsFromBundle,
  groupObservationsByEncounter,
  sortObservationsByEncounterDate,
} from './utils';

export interface ObservationConfig {
  conceptNames?: string[];
  conceptUuid?: string[];
  titleTranslationKey?: string;
}

export const conceptUuidQueryKeys = (conceptName: string) =>
  ['conceptUuid', conceptName] as const;

export const observationsQueryKeys = (
  patientUUID: string,
  conceptUuids: string[],
) => ['observations', patientUUID, ...conceptUuids] as const;

const Observations: React.FC<WidgetProps> = ({ config }) => {
  const observationConfig = config as ObservationConfig;
  const { conceptNames = [], conceptUuid = [] } = observationConfig;
  const notifiedIndices = useRef(new Set());
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
      if (query.isError && !notifiedIndices.current.has(index)) {
        const conceptName = conceptNames[index];
        addNotification({
          title: t('ERROR_DEFAULT_TITLE'),
          message: t('ERROR_FETCHING_CONCEPT', { conceptName }),
          type: 'error',
        });
        notifiedIndices.current.add(index);
      } else if (!query.isError) {
        notifiedIndices.current.delete(index);
      }
    });
  }, [conceptQueries, conceptNames]);

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
    const grouped = groupObservationsByEncounter(extractedObs);
    return sortObservationsByEncounterDate(grouped);
  }, [observations]);

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
      className={styles.observations}
    >
      <Tile
        id="observations-title"
        testId="observations-title-test-id"
        title={t(observationConfig.titleTranslationKey!)}
        className={styles.title}
      >
        <p>{t(observationConfig.titleTranslationKey!)}</p>
      </Tile>
      {hasData ? (
        <ObsByEncounter groupedData={groupedData} />
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
