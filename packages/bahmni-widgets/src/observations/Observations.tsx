import { SortableDataTable, Tile } from '@bahmni/design-system';
import {
  searchConceptByName,
  useTranslation,
  getPatientObservationsWithEncounterBundle,
  getPatientLatestObservations,
  useSubscribeConsultationSaved,
  ConsultationSavedEventPayload,
  shouldEnableEncounterFilter,
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
  filterObservationsByLatestEncounter,
} from './utils';

export interface ObservationConfig {
  conceptNames?: string[];
  conceptUuid?: string[];
  titleTranslationKey?: string;
  hideThumbnail?: boolean;
  scope?: 'all' | 'latest' | 'latest-encounter';
}

export const conceptUuidQueryKeys = (conceptName: string) =>
  ['conceptUuid', conceptName] as const;

export const observationsQueryKeys = (
  patientUUID: string,
  conceptUuids: string[],
  encounterUuids?: string[],
  scope?: string,
) =>
  [
    'observations',
    patientUUID,
    ...conceptUuids,
    encounterUuids,
    scope,
  ] as const;

const Observations: React.FC<WidgetProps> = ({
  config,
  episodeOfCareUuids,
  encounterUuids,
}) => {
  const observationConfig = config as ObservationConfig;
  const {
    conceptNames = [],
    conceptUuid = [],
    hideThumbnail = false,
    scope = 'all',
  } = observationConfig;

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
    const hasAnyError = conceptQueries.some((query) => query.isError);
    const hasNotified = notifiedIndices.current.size > 0;

    if (hasAnyError && !hasNotified) {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: t('ERROR_FETCHING_OBSERVATIONS'),
        type: 'error',
      });
      notifiedIndices.current.add(0);
    } else if (!hasAnyError && hasNotified) {
      notifiedIndices.current.clear();
    }
  }, [conceptQueries, addNotification, t]);

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

  const useLastN = scope === 'latest' || scope === 'latest-encounter';

  const emptyEncounterFilter = shouldEnableEncounterFilter(
    episodeOfCareUuids,
    encounterUuids,
  );

  const {
    data: observations,
    isLoading: isLoadingObservations,
    isError: isObservationsError,
    refetch,
  } = useQuery({
    queryKey: observationsQueryKeys(
      patientUUID!,
      allConceptUuids,
      encounterUuids,
      scope,
    ),
    queryFn: () => {
      return useLastN
        ? getPatientLatestObservations(
            patientUUID!,
            allConceptUuids,
            encounterUuids,
            true,
          )
        : getPatientObservationsWithEncounterBundle(
            patientUUID!,
            allConceptUuids,
            encounterUuids,
          );
    },
    enabled:
      !!patientUUID &&
      allConceptUuids.length > 0 &&
      areConceptQueriesComplete &&
      !emptyEncounterFilter,
  });

  // Smart refetch: only refetch if one of the updated concepts matches our configured concepts
  useSubscribeConsultationSaved(
    (payload: ConsultationSavedEventPayload) => {
      if (
        payload.patientUUID === patientUUID &&
        payload.updatedConcepts.size > 0
      ) {
        const hasMatchingConcept = [...payload.updatedConcepts.keys()].some(
          (uuid) => allConceptUuids.includes(uuid),
        );

        if (hasMatchingConcept) {
          refetch();
        }
      }
    },
    [patientUUID, refetch],
  );

  useEffect(() => {
    if (isObservationsError) {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: t('ERROR_FETCHING_OBSERVATIONS'),
        type: 'error',
      });
    }
  }, [isObservationsError, addNotification, t]);

  const groupedData = useMemo(() => {
    if (!observations) return [];

    let extractedObs = extractObservationsFromBundle(observations);

    if (scope === 'latest-encounter') {
      extractedObs = filterObservationsByLatestEncounter(extractedObs);
    }

    const grouped = groupObservationsByEncounter(extractedObs);
    return sortObservationsByEncounterDate(grouped);
  }, [observations, scope]);

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

  const titleKey = observationConfig.titleTranslationKey;
  const translatedTitle = titleKey ? t(titleKey) : '';

  return (
    <div
      id="observations"
      data-testid={
        titleKey ? `observations-${translatedTitle}` : 'observations'
      }
      aria-label="observations-aria-label"
      className={styles.observations}
    >
      <Tile
        id="observations-title"
        testId={
          titleKey
            ? `observations-title-${translatedTitle}`
            : 'observations-title'
        }
        title={translatedTitle}
        className={styles.title}
      >
        <p>{translatedTitle}</p>
      </Tile>
      {hasData ? (
        <ObsByEncounter
          groupedData={groupedData}
          title={translatedTitle}
          hideThumbnail={hideThumbnail}
        />
      ) : (
        <SortableDataTable
          headers={headers}
          rows={[]}
          ariaLabel={t('OBSERVATIONS')}
          loading={isLoading}
          errorStateMessage={errorMessage}
          emptyStateMessage={emptyMessage}
          dataTestId="observations-table"
        />
      )}
    </div>
  );
};

export default Observations;
