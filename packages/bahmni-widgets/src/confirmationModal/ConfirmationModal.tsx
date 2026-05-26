import { Modal } from '@bahmni/design-system';
import React from 'react';

export interface ConfirmationModalProps {
  open: boolean;
  heading: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  isSubmitting?: boolean;
  danger?: boolean;
  testId?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  open,
  heading,
  body,
  confirmLabel,
  cancelLabel,
  isSubmitting = false,
  danger = false,
  testId = 'confirmation-modal',
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      open={open}
      danger={danger}
      testId={testId}
      modalHeading={heading}
      primaryButtonText={confirmLabel}
      secondaryButtonText={cancelLabel}
      primaryButtonDisabled={isSubmitting}
      onRequestClose={onCancel}
      onRequestSubmit={onConfirm}
    >
      {body}
    </Modal>
  );
};

export default ConfirmationModal;
