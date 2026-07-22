import { Modal, SkeletonPlaceholder } from '@bahmni/design-system';
import {
  formatDateTime,
  getEncounterByUuid,
  getObservationsBundleByEncounterUuid,
  getPatientObservationsBundle,
  useTranslation,
} from '@bahmni/services';
import { useQueries, useQuery } from '@tanstack/react-query';
import type { Bundle, Encounter, Observation } from 'fhir/r4';
import React, { useMemo } from 'react';
import { extractFormFieldPath } from '../../../observations/utils';
import { ObservationsRenderer } from '../../../observationsRenderer';
import type { TaskView, TaskViewModel } from '../../models';
import { extractFormNameFromTask } from '../../utils';
import styles from './ViewFormData.module.scss';
import {
  extractUuidFromReference,
  groupObservationsByEncounter,
  type EncounterGroup,
} from './viewFormUtils';

interface ViewFormDataProps {
  open: boolean;
  task: TaskViewModel | null;
  view: TaskView | null;
  patientUuid: string;
  onClose: () => void;
}

const ViewFormData: React.FC<ViewFormDataProps> = ({
  open,
  task,
  view,
  patientUuid,
  onClose,
}) => {
  const { t } = useTranslation();

  const formName = useMemo(() => {
    if (!task || !view) return null;
    return extractFormNameFromTask(task, view.handlerConfig.formInputCode);
  }, [task, view]);

  const serviceRequestRef = task?.fhirResource.basedOn?.[0]?.reference;
  const encounterRef = task?.fhirResource.encounter?.reference;

  const {
    data: bundleByServiceRequest,
    isLoading: isLoadingByServiceRequest,
    error: errorByServiceRequest,
  } = useQuery<Bundle<Observation>, Error>({
    queryKey: ['observationsByServiceRequest', serviceRequestRef],
    queryFn: async () => {
      const serviceRequestId = extractUuidFromReference(serviceRequestRef!);
      return await getPatientObservationsBundle(
        patientUuid,
        undefined,
        serviceRequestId,
      );
    },
    enabled: open && !!task && !!formName && !!serviceRequestRef,
  });

  const {
    data: bundleByEncounter,
    isLoading: isLoadingByEncounter,
    error: errorByEncounter,
  } = useQuery<Bundle<Observation>, Error>({
    queryKey: ['observationsByEncounter', encounterRef],
    queryFn: async () => {
      const encounterUuid = extractUuidFromReference(encounterRef!);
      return await getObservationsBundleByEncounterUuid(encounterUuid);
    },
    enabled:
      open && !!task && !!formName && !serviceRequestRef && !!encounterRef,
  });

  const bundle = bundleByServiceRequest ?? bundleByEncounter;
  const isLoadingObservations =
    isLoadingByServiceRequest || isLoadingByEncounter;
  const observationsError = errorByServiceRequest ?? errorByEncounter;

  const filteredObservations = useMemo(() => {
    if (!bundle || !formName) return [];

    const allObservations =
      bundle.entry
        ?.filter((entry) => entry.resource?.resourceType === 'Observation')
        .map((entry) => entry.resource as Observation) ?? [];

    return allObservations.filter((obs) => {
      const path = extractFormFieldPath(obs);
      return path?.toLowerCase().includes(formName.toLowerCase());
    });
  }, [bundle, formName]);

  const encounterUuids = useMemo(() => {
    const uuids = new Set<string>();
    filteredObservations.forEach((obs) => {
      if (obs.encounter?.reference) {
        const uuid = extractUuidFromReference(obs.encounter.reference);
        if (uuid) uuids.add(uuid);
      }
    });
    return Array.from(uuids);
  }, [filteredObservations]);

  const encounterQueries = useQueries({
    queries: encounterUuids.map((uuid) => ({
      queryKey: ['encounter', uuid],
      queryFn: () => getEncounterByUuid(uuid),
      enabled: open && encounterUuids.length > 0,
    })),
  });

  const isLoadingEncounters = encounterQueries.some((q) => q.isLoading);
  const encountersError = encounterQueries.find((q) => q.error)?.error;
  const encounters = useMemo(() => {
    return encounterQueries
      .map((q) => q.data)
      .filter((enc): enc is Encounter => !!enc);
  }, [encounterQueries]);

  const encounterGroups = useMemo(() => {
    if (
      filteredObservations.length === 0 ||
      isLoadingEncounters ||
      encounters.length === 0
    ) {
      return [];
    }

    const encountersBundle: Bundle<Encounter> = {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: encounters.map((enc) => ({ resource: enc })),
    };

    return groupObservationsByEncounter(filteredObservations, encountersBundle);
  }, [filteredObservations, encounters, isLoadingEncounters]);

  const isLoading = isLoadingObservations || isLoadingEncounters;
  const error = observationsError ?? encountersError;

  const renderEncounterGroup = (group: EncounterGroup) => {
    return (
      <div key={group.encounterUuid} className={styles.encounterGroup}>
        <div className={styles.encounterHeader}>
          {t('RECORDED_ON')}:{' '}
          {formatDateTime(group.encounterDateTime, t, true).formattedResult} |{' '}
          {t('RECORDED_BY')}: {group.providerName}
        </div>
        <ObservationsRenderer
          observations={group.observations}
          testIdPrefix={`encounter-${group.encounterUuid}-observations`}
        />
      </div>
    );
  };

  return (
    <Modal
      open={open}
      onRequestClose={onClose}
      modalHeading={formName ?? t('VIEW_DATA')}
      size="lg"
      passiveModal
      testId="view-form-modal"
    >
      <Modal.Body>
        {isLoading && <SkeletonPlaceholder className={styles.loader} />}
        {error && <div>{t('ERROR_LOADING_OBSERVATIONS')}</div>}
        {!isLoading && !error && encounterGroups.length === 0 && (
          <div>{t('NO_OBSERVATIONS_FOR_TASK')}</div>
        )}
        {!isLoading && !error && encounterGroups.length > 0 && (
          <>{encounterGroups.map(renderEncounterGroup)}</>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default ViewFormData;
