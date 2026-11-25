import {
  Dropdown,
  InlineNotification,
  Loading,
  Modal,
  TextArea,
} from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import React, { useState } from 'react';
import { DEFAULT_NOTE_MAX_LENGTH } from './constants';
import { ActionReason, ActionValues } from './models';
import styles from './styles/ActionModal.module.scss';

export interface ActionModalProps {
  idPrefix?: string;
  heading: string;
  submitLabel: string;
  danger?: boolean;
  warning?: { title: string; message: string };
  reasons: ActionReason[];
  isReasonRequired?: boolean;
  showNote?: boolean;
  noteMaxLength?: number;
  isSubmitting?: boolean;
  onSubmit: (values: ActionValues) => void;
  onClose: () => void;
}

const ActionModal: React.FC<ActionModalProps> = ({
  idPrefix = 'action',
  heading,
  submitLabel,
  danger = false,
  warning,
  reasons,
  isReasonRequired = true,
  showNote = false,
  noteMaxLength = DEFAULT_NOTE_MAX_LENGTH,
  isSubmitting = false,
  onSubmit,
  onClose,
}) => {
  const { t } = useTranslation();
  const [selectedReason, setSelectedReason] = useState<ActionReason | null>(
    null,
  );
  const [note, setNote] = useState('');
  const [showReasonError, setShowReasonError] = useState(false);
  const [showNoteError, setShowNoteError] = useState(false);

  const isNoteRequired = selectedReason?.isNoteRequired ?? false;

  const handleReasonChange = (reason: ActionReason | null) => {
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
    if (showNote && isNoteRequired && !trimmedNote) {
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
      danger={danger}
      size="sm"
      modalHeading={heading}
      primaryButtonText={submitLabel}
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
              <Dropdown<ActionReason>
                id={`${idPrefix}-reason`}
                testId={`${idPrefix}-reason-test-id`}
                titleText={t('ACTION_MODAL_REASON_LABEL')}
                label={t('ACTION_MODAL_REASON_PLACEHOLDER')}
                items={reasons}
                selectedItem={selectedReason ?? undefined}
                itemToString={(item) => item?.display ?? ''}
                onChange={({ selectedItem }) =>
                  handleReasonChange(selectedItem ?? null)
                }
                invalid={showReasonError}
                invalidText={t('ACTION_MODAL_REASON_REQUIRED')}
              />
            </div>
            {showNote && (
              <div className={styles.noteField}>
                <div className={styles.noteHeader}>
                  <label
                    htmlFor={`${idPrefix}-note`}
                    className={styles.noteLabel}
                  >
                    {t('ACTION_MODAL_NOTE_LABEL')}
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
                  labelText={t('ACTION_MODAL_NOTE_LABEL')}
                  hideLabel
                  value={note}
                  maxLength={noteMaxLength}
                  invalid={showNoteError}
                  invalidText={t('ACTION_MODAL_NOTE_REQUIRED')}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    handleNoteChange(e.target.value)
                  }
                />
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default ActionModal;
