import {
  Dropdown,
  InlineNotification,
  Loading,
  Modal,
  TextArea,
} from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import React, { useState } from 'react';
import styles from './styles/CancellationModal.module.scss';

const DEFAULT_NOTE_MAX_LENGTH = 100;

export interface CancellationReason {
  uuid: string;
  display: string;
  isNoteRequired?: boolean;
}

export interface CancellationValues {
  reason: CancellationReason | null;
  note: string;
}

export interface CancellationModalProps {
  idPrefix?: string;
  heading: string;
  warning?: { title: string; message: string };
  reasons: CancellationReason[];
  isReasonRequired?: boolean;
  noteMaxLength?: number;
  isSubmitting?: boolean;
  onSubmit: (values: CancellationValues) => void;
  onClose: () => void;
}

const CancellationModal: React.FC<CancellationModalProps> = ({
  idPrefix = 'cancellation',
  heading,
  warning,
  reasons,
  isReasonRequired = true,
  noteMaxLength = DEFAULT_NOTE_MAX_LENGTH,
  isSubmitting = false,
  onSubmit,
  onClose,
}) => {
  const { t } = useTranslation();
  const [selectedReason, setSelectedReason] =
    useState<CancellationReason | null>(null);
  const [note, setNote] = useState('');
  const [showReasonError, setShowReasonError] = useState(false);
  const [showNoteError, setShowNoteError] = useState(false);

  const isNoteRequired = selectedReason?.isNoteRequired ?? false;

  const handleReasonChange = (reason: CancellationReason | null) => {
    setSelectedReason(reason);
    setShowReasonError(false);
    setShowNoteError(false);
  };

  const handleNoteChange = (value: string) => {
    setNote(value.slice(0, noteMaxLength));
    setShowNoteError(false);
  };

  const handleSubmit = () => {
    if (isReasonRequired && !selectedReason) {
      setShowReasonError(true);
      return;
    }
    const trimmedNote = note.trim();
    if (isNoteRequired && !trimmedNote) {
      setShowNoteError(true);
      return;
    }
    onSubmit({ reason: selectedReason, note: trimmedNote });
  };

  return (
    <Modal
      id={`${idPrefix}-modal`}
      testId={`${idPrefix}-modal-test-id`}
      open
      danger
      size="sm"
      modalHeading={heading}
      primaryButtonText={t('CANCELLATION_MODAL_SUBMIT')}
      primaryButtonDisabled={isSubmitting}
      onRequestClose={onClose}
      onRequestSubmit={handleSubmit}
    >
      <div
        id={`${idPrefix}-modal-content`}
        data-testid={`${idPrefix}-modal-content-test-id`}
        className={styles.modalContent}
      >
        {isSubmitting ? (
          <div className={styles.loadingContainer}>
            <Loading
              id={`${idPrefix}-loading`}
              testId={`${idPrefix}-loading-test-id`}
            />
          </div>
        ) : (
          <>
            {warning && (
              <InlineNotification
                id={`${idPrefix}-warning`}
                testId={`${idPrefix}-warning-test-id`}
                kind="error"
                lowContrast
                hideCloseButton
                title={warning.title}
                subtitle={warning.message}
                className={styles.warningBanner}
              />
            )}
            <div className={styles.reasonField}>
              <Dropdown<CancellationReason>
                id={`${idPrefix}-reason`}
                testId={`${idPrefix}-reason-test-id`}
                titleText={t('CANCELLATION_MODAL_REASON_LABEL')}
                label={t('CANCELLATION_MODAL_REASON_PLACEHOLDER')}
                items={reasons}
                selectedItem={selectedReason ?? undefined}
                itemToString={(item) => item?.display ?? ''}
                onChange={({ selectedItem }) =>
                  handleReasonChange(selectedItem ?? null)
                }
                invalid={showReasonError}
                invalidText={t('CANCELLATION_MODAL_REASON_REQUIRED')}
              />
            </div>
            <div className={styles.noteField}>
              <div className={styles.noteHeader}>
                <label
                  htmlFor={`${idPrefix}-note`}
                  className={styles.noteLabel}
                >
                  {t('CANCELLATION_MODAL_NOTE_LABEL')}
                </label>
                <span
                  data-testid={`${idPrefix}-note-counter-test-id`}
                  className={styles.noteCounter}
                >
                  {note.length}/{noteMaxLength}
                </span>
              </div>
              <TextArea
                id={`${idPrefix}-note`}
                testId={`${idPrefix}-note-test-id`}
                labelText={t('CANCELLATION_MODAL_NOTE_LABEL')}
                hideLabel
                value={note}
                maxLength={noteMaxLength}
                invalid={showNoteError}
                invalidText={t('CANCELLATION_MODAL_NOTE_REQUIRED')}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleNoteChange(e.target.value)
                }
              />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default CancellationModal;
