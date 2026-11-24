import {
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
  dispatchAuditEvent,
  searchFHIRConcepts,
  updateProgramState,
  useTranslation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import CancellationModal, {
  CancellationReason,
  CancellationValues,
} from '../cancellationModal/CancellationModal';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { ProgramAction } from './model';

interface CancelEpisodeOfCareModalProps {
  programUuid: string;
  stateUuid: string;
  action: ProgramAction;
  onClose: () => void;
  onSuccess: () => void;
}

const cancelReasonsQueryKey = (reasonConceptSetUuid: string) =>
  ['eocCancelReasons', reasonConceptSetUuid] as const;

const fetchCancelReasons = async (
  reasonConceptSetUuid: string,
): Promise<CancellationReason[]> => {
  const valueSet = await searchFHIRConcepts(reasonConceptSetUuid);
  return (valueSet.expansion?.contains ?? []).map((concept) => ({
    uuid: concept.code ?? '',
    display: concept.display ?? concept.code ?? '',
  }));
};

const CancelEpisodeOfCareModal: React.FC<CancelEpisodeOfCareModalProps> = ({
  programUuid,
  stateUuid,
  action,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const patientUuid = usePatientUUID();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: reasons = [], isError: isReasonsError } = useQuery({
    queryKey: cancelReasonsQueryKey(action.metadata.reasonConceptSetUuid),
    queryFn: () => fetchCancelReasons(action.metadata.reasonConceptSetUuid),
    staleTime: Infinity,
  });

  useEffect(() => {
    if (isReasonsError) {
      addNotification({
        type: 'error',
        title: t('PROGRAM_CANCEL_EOC_ERROR_TITLE'),
        message: t('PROGRAM_CANCEL_EOC_REASONS_LOAD_ERROR'),
        timeout: 5000,
      });
    }
  }, [isReasonsError, addNotification, t]);

  const handleSubmit = async ({ reason }: CancellationValues) => {
    if (!reason) return;
    setIsSubmitting(true);
    try {
      await updateProgramState(programUuid, stateUuid, reason.uuid);
      if (patientUuid) {
        dispatchAuditEvent({
          eventType: AUDIT_LOG_EVENT_DETAILS.CANCEL_EOC
            .eventType as AuditEventType,
          patientUuid,
          messageParams: {
            programUuid,
            reason: reason.display,
          },
        });
      }
      addNotification({
        type: 'success',
        title: t('PROGRAM_CANCEL_EOC_SUCCESS_TITLE'),
        message: t('PROGRAM_CANCEL_EOC_SUCCESS_MESSAGE'),
        timeout: 5000,
      });
      onSuccess();
    } catch (error) {
      addNotification({
        type: 'error',
        title: t('PROGRAM_CANCEL_EOC_ERROR_TITLE'),
        message:
          error instanceof Error && error.message
            ? error.message
            : t('PROGRAM_CANCEL_EOC_ERROR_MESSAGE'),
        timeout: 7000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CancellationModal
      idPrefix="cancel-eoc"
      heading={t('PROGRAM_CANCEL_EOC_MODAL_HEADING')}
      warning={{
        title: t('PROGRAM_CANCEL_EOC_WARNING_TITLE'),
        message: t('PROGRAM_CANCEL_EOC_WARNING_MESSAGE'),
      }}
      reasons={reasons}
      showNote={false}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      onClose={onClose}
    />
  );
};

export default CancelEpisodeOfCareModal;
