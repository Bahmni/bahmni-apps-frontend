import { Modal } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import React from 'react';

interface DeleteServiceModalProps {
  serviceName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteServiceModal: React.FC<DeleteServiceModalProps> = ({
  serviceName,
  isDeleting,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      id="delete-service-modal"
      testId="delete-service-modal-test-id"
      aria-label="delete-service-modal-aria-label"
      open
      danger
      onRequestClose={onCancel}
      onRequestSubmit={onConfirm}
      primaryButtonText={t('ADMIN_ALL_SERVICES_DELETE_BUTTON_LABEL')}
      secondaryButtonText={t('ADMIN_ALL_SERVICES_DELETE_CANCEL')}
      primaryButtonDisabled={isDeleting}
      modalHeading={t('ADMIN_ALL_SERVICES_DELETE_MODAL_TITLE')}
    >
      {t('ADMIN_ALL_SERVICES_DELETE_CONFIRM_BODY', { serviceName })}
    </Modal>
  );
};

export default DeleteServiceModal;
