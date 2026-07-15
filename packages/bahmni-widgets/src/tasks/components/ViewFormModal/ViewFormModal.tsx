import { Modal, ModalBody, ModalHeader } from '@bahmni/design-system';
import {
  getPatientObservationsBundle,
  useTranslation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
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

  const { data: bundle, isLoading, error } = useQuery<
    Bundle<Observation | Encounter>,
    Error
  >({
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
        Observation | Encounter
      >;
    },
    enabled: open && !!task && !!formName,
  });

  const encounterGroups = useMemo(() => {
    if (!bundle || !formName) return [];

    const allObservations = bundle.entry
      ?.filter((entry) => entry.resource?.resourceType === 'Observation')
      .map((entry) => entry.resource as Observation) ?? [];

    const filteredObservations = allObservations.filter((obs) => {
      const path = extractFormFieldPath(obs);
      return path && path.toLowerCase().includes(formName.toLowerCase());
    });

    return groupObservationsByEncounter(filteredObservations, bundle);
  }, [bundle, formName]);

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
      testId="view-form-modal"
    >
      <ModalHeader />
      <ModalBody>
        {isLoading && <div>{t('LOADING')}</div>}
        {error && <div>{t('ERROR_LOADING_DATA')}</div>}
        {!isLoading && !error && encounterGroups.length === 0 && (
          <div>{t('NO_OBSERVATIONS_FOR_TASK')}</div>
        )}
        {!isLoading && !error && encounterGroups.length > 0 && (
          <div className={styles.modalContent}>
            {encounterGroups.map(renderEncounterGroup)}
          </div>
        )}
      </ModalBody>
    </Modal>
  );
};

export default ViewFormModal;
