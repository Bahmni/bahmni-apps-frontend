import {
  ArrowRight,
  Link,
  SortableDataTable,
  StatusTag,
} from '@bahmni/design-system';
import {
  getPatientEncounters,
  getVisits,
  useTranslation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { Encounter } from 'fhir/r4';
import React, { useEffect, useMemo, useState } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { WidgetProps } from '../registry/model';
import { resolveNavigationURL } from '../utils/urlUtils';
import {
  DEFAULT_IPD_VISIT_TYPES,
  DEFAULT_MAXIMUM_NO_OF_VISITS,
  DEFAULT_VISIT_FIELDS,
  MANDATORY_VISIT_FIELDS,
  VISIT_FIELD_TRANSLATION_MAP,
} from './constants';
import { VisitViewModel } from './model';
import styles from './styles/VisitsTable.module.scss';
import {
  buildVisitLocationMap,
  formatVisitDateRange,
  isIpdVisit,
  toVisitViewModels,
  translateVisitType,
} from './utils';

/**
 * Displays a patient's visit history: date, type, and active/completed status, with
 * an optional Location column and config-driven navigation links to the
 * visit dashboard and, for IPD visits, the IPD dashboard.
 */
const VisitsTable: React.FC<WidgetProps> = ({ config }) => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();

  // Only a positive integer is a usable cap: a negative value would reach
  // slice(0, -n) and silently drop visits, so anything else uses the default.
  const configuredMaximumNoOfVisits = Number(config?.maximumNoOfVisits);
  const maximumNoOfVisits =
    Number.isInteger(configuredMaximumNoOfVisits) &&
    configuredMaximumNoOfVisits > 0
      ? configuredMaximumNoOfVisits
      : DEFAULT_MAXIMUM_NO_OF_VISITS;
  const fieldsFromConfig = config?.fields as string[] | undefined;
  const configuredFields = useMemo(() => {
    const fields = fieldsFromConfig ?? DEFAULT_VISIT_FIELDS;
    const missingMandatory = MANDATORY_VISIT_FIELDS.filter(
      (field) => !fields.includes(field),
    );
    return [...missingMandatory, ...fields];
  }, [fieldsFromConfig]);
  const navigationURL = config?.navigationURL as string | undefined;
  const ipdDashboardUrl = config?.ipdDashboardUrl as string | undefined;
  const ipdVisitTypes =
    (config?.ipdVisitTypes as string[] | undefined) ?? DEFAULT_IPD_VISIT_TYPES;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['visits', patientUUID!],
    enabled: !!patientUUID,
    queryFn: () => getVisits(patientUUID!),
  });

  // A visit's own location is the facility (Visit Location); the login location
  // lives on its child encounters, so fetch those only when the column is
  // actually configured — getPatientEncounters pages through every encounter.
  const needsLocation = configuredFields.includes('location');

  const { data: patientEncounters } = useQuery({
    queryKey: ['patientEncounters', patientUUID!],
    enabled: !!patientUUID && needsLocation,
    queryFn: () => getPatientEncounters(patientUUID!),
  });

  const locationByVisitId = useMemo(
    () =>
      needsLocation
        ? buildVisitLocationMap(patientEncounters ?? [])
        : undefined,
    [patientEncounters, needsLocation],
  );

  const visits = useMemo(
    () => toVisitViewModels(data ?? [], maximumNoOfVisits, locationByVisitId),
    [data, maximumNoOfVisits, locationByVisitId],
  );

  const encounterMap = useMemo(() => {
    const map = new Map<string, Encounter>();
    (data ?? []).forEach((encounter) => {
      if (encounter.id) map.set(encounter.id, encounter);
    });
    return map;
  }, [data]);

  const [resolvedVisitUrls, setResolvedVisitUrls] = useState<
    Map<string, string>
  >(new Map());
  const [resolvedIpdUrls, setResolvedIpdUrls] = useState<Map<string, string>>(
    new Map(),
  );

  useEffect(() => {
    if (!navigationURL) {
      setResolvedVisitUrls(new Map());
      return;
    }

    let cancelled = false;
    const resolve = async () => {
      const entries = await Promise.all(
        visits.map(async (visit) => {
          const rawEncounter = encounterMap.get(visit.id);
          const url = await resolveNavigationURL(navigationURL, {
            ...rawEncounter,
            patientUuid: patientUUID,
          });
          return url ? ([visit.id, url] as const) : null;
        }),
      );
      if (cancelled) return;
      setResolvedVisitUrls(
        new Map(entries.filter((e): e is [string, string] => e !== null)),
      );
    };
    resolve();
    return () => {
      cancelled = true;
    };
  }, [visits, encounterMap, navigationURL, patientUUID]);

  useEffect(() => {
    if (!ipdDashboardUrl) {
      setResolvedIpdUrls(new Map());
      return;
    }

    let cancelled = false;
    const resolve = async () => {
      const ipdVisits = visits.filter((visit) =>
        isIpdVisit(visit.visitType, ipdVisitTypes),
      );
      const entries = await Promise.all(
        ipdVisits.map(async (visit) => {
          const rawEncounter = encounterMap.get(visit.id);
          const url = await resolveNavigationURL(ipdDashboardUrl, {
            ...rawEncounter,
            patientUuid: patientUUID,
          });
          return url ? ([visit.id, url] as const) : null;
        }),
      );
      if (cancelled) return;
      setResolvedIpdUrls(
        new Map(entries.filter((e): e is [string, string] => e !== null)),
      );
    };
    resolve();
    return () => {
      cancelled = true;
    };
  }, [visits, encounterMap, ipdDashboardUrl, ipdVisitTypes, patientUUID]);

  const headers = useMemo(
    () =>
      configuredFields.map((fieldKey) => ({
        key: fieldKey,
        header: t(VISIT_FIELD_TRANSLATION_MAP[fieldKey] || fieldKey),
      })),
    [configuredFields, t],
  );

  const sortable = useMemo(
    () => headers.map((header) => ({ key: header.key, sortable: false })),
    [headers],
  );

  const renderCell = (visit: VisitViewModel, cellId: string) => {
    switch (cellId) {
      case 'visitDate': {
        const url = resolvedVisitUrls.get(visit.id);
        const text = formatVisitDateRange(visit, t);
        return url ? (
          <Link
            id={`${visit.id}-visit-date`}
            data-testid={`${visit.id}-visit-date-test-id`}
            href={url}
          >
            {text}
          </Link>
        ) : (
          <span
            id={`${visit.id}-visit-date`}
            data-testid={`${visit.id}-visit-date-test-id`}
          >
            {text}
          </span>
        );
      }
      case 'visitType': {
        const ipdUrl = resolvedIpdUrls.get(visit.id);
        return (
          <div data-testid={`${visit.id}-visit-type-test-id`}>
            <span>{translateVisitType(visit.visitType, t)}</span>
            {ipdUrl && (
              <div>
                <Link
                  href={ipdUrl}
                  className={styles.ipdDashboardLink}
                  data-testid={`${visit.id}-ipd-dashboard-link-test-id`}
                >
                  {t('VIEW_IPD_DASHBOARD')}
                  <ArrowRight />
                </Link>
              </div>
            )}
          </div>
        );
      }
      case 'status':
        return (
          <StatusTag
            label={t(
              visit.isActive ? 'VISIT_STATUS_ACTIVE' : 'VISIT_STATUS_COMPLETED',
            )}
            dotClassName={
              visit.isActive ? styles.activeStatus : styles.completedStatus
            }
            testId={`${visit.id}-status-test-id`}
          />
        );
      case 'location':
        return (
          <span data-testid={`${visit.id}-location-test-id`}>
            {visit.location ?? '-'}
          </span>
        );
      default:
        return undefined;
    }
  };

  return (
    <div
      id="visits-table"
      data-testid="visits-table-test-id"
      className={styles.visitsTableWrapper}
    >
      <SortableDataTable
        headers={headers}
        ariaLabel={t('VISITS_TABLE_ARIA_LABEL')}
        rows={visits}
        loading={isLoading}
        errorStateMessage={isError ? t('ERROR_DEFAULT_TITLE') : null}
        emptyStateMessage={t('NO_VISITS_FOR_PATIENT')}
        sortable={sortable}
        renderCell={renderCell}
        className={styles.table}
        dataTestId="visits-table"
      />
    </div>
  );
};

export default VisitsTable;
