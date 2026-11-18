import {
  cancelEpisodeOfCare,
  searchFHIRConcepts,
  useTranslation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import CancellationModal, {
  CancellationReason,
  CancellationValues,
} from '../cancellationModal/CancellationModal';
import { useNotification } from '../notification';
import { ProgramAction } from './model';

interface CancelEpisodeOfCareModalProps {
  episodeUuid: string;
  action: ProgramAction;
  onClose: () => void;
  onSuccess: () => void;
}

export const cancelReasonsQueryKey = (reasonConceptSetUuid: string) =>
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

const addRequiredNoteToReasons = (
  reasons: CancellationReason[],
  noteRequiredReasonUuids: string[] = [],
): CancellationReason[] =>
  reasons.map((reason) => ({
    ...reason,
    isNoteRequired: noteRequiredReasonUuids.includes(reason.uuid),
  }));

const CancelEpisodeOfCareModal: React.FC<CancelEpisodeOfCareModalProps> = ({
  episodeUuid,
  action,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: fetchedReasons = [], isError: isReasonsError } = useQuery({
    queryKey: cancelReasonsQueryKey(action.reasonConceptSetUuid),
    queryFn: () => fetchCancelReasons(action.reasonConceptSetUuid),
    staleTime: Infinity,
  });

  const reasons = useMemo(
    () =>
      addRequiredNoteToReasons(fetchedReasons, action.noteRequiredReasonUuids),
    [fetchedReasons, action.noteRequiredReasonUuids],
  );

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

  const handleSubmit = async ({ reason, note }: CancellationValues) => {
    if (!reason) return;
    setIsSubmitting(true);
    try {
      await cancelEpisodeOfCare(episodeUuid, {
        reason: reason.uuid,
        note: note || undefined,
      });
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
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      onClose={onClose}
    />
  );
};

export default CancelEpisodeOfCareModal;
