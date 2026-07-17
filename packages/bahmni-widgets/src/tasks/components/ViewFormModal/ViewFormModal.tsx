import { Modal } from '@bahmni/design-system';
import {
  getEncounterByUuid,
  getPatientObservationsBundle,
  useTranslation,
} from '@bahmni/services';
import { useQueries, useQuery } from '@tanstack/react-query';
import type { Bundle, Encounter, Observation } from 'fhir/r4';
import React, { useMemo } from 'react';
import { ObservationsRenderer } from '../../../observationsRenderer';
import type { TaskView, TaskViewModel } from '../../models';
import { extractFormNameFromTask } from '../../utils';
import styles from './ViewFormModal.module.scss';
import {
  extractFormFieldPath,
  extractUuidFromReference,
  groupObservationsByEncounter,
  type EncounterGroup,
} from './viewFormUtils';

interface ViewFormModalProps {
  open: boolean;
  task: TaskViewModel | null;
  view: TaskView | null;
  patientUuid: string;
  onClose: () => void;
}

const ViewFormModal: React.FC<ViewFormModalProps> = ({
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

  const encounterRef = task?.fhirResource.encounter?.reference;
  const serviceRequestRef = task?.fhirResource.basedOn?.[0]?.reference;

  const {
    data: bundle,
    isLoading: isLoadingObservations,
    error: observationsError,
  } = useQuery<Bundle<Observation>, Error>({
    queryKey: [
      'taskObservations',
      task?.code,
      formName,
      encounterRef || serviceRequestRef,
    ],
    queryFn: async () => {
      if (serviceRequestRef) {
        const serviceRequestId = extractUuidFromReference(serviceRequestRef);
        return await getPatientObservationsBundle(
          patientUuid,
          undefined,
          serviceRequestId,
        );
      }
      return { resourceType: 'Bundle', type: 'searchset' } as Bundle<
        Observation
      >;
    },
    enabled: open && !!task && !!formName,
  });

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

  const formatDateTime = (timestamp: number): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderEncounterGroup = (group: EncounterGroup, index: number) => {
    const isOriginal = index === encounterGroups.length - 1;
    const dateLabel = isOriginal ? 'TASK_COMPLETED_ON' : 'RECORDED_ON';
    const providerLabel = isOriginal ? 'TASK_COMPLETED_BY' : 'RECORDED_BY';

    return (
      <div key={group.encounterUuid} className={styles.encounterGroup}>
        <div className={styles.encounterHeader}>
          {t(dateLabel)}: {formatDateTime(group.encounterDateTime)} |{' '}
          {t(providerLabel)}: {group.providerName}
        </div>
        <ObservationsRenderer
          observations={group.observations}
          testIdPrefix={`encounter-${index}`}
          hideThumbnail={false}
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
        {isLoading && <div>{t('LOADING')}</div>}
        {error && <div>{t('ERROR_LOADING_DATA')}</div>}
        {!isLoading && !error && encounterGroups.length === 0 && (
          <div>{t('NO_OBSERVATIONS_FOR_TASK')}</div>
        )}
        {!isLoading && !error && encounterGroups.length > 0 && (
          <div className={styles.modalContent}>
            {encounterGroups.map((encounterGroup, index) =>
              renderEncounterGroup(encounterGroup, index),
            )}
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default ViewFormModal;
