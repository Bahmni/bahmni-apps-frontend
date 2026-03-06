import { DocumentView } from '@carbon/icons-react';
import classNames from 'classnames';
import React, { useState } from 'react';
import { Modal } from '../../atoms/modal';
import styles from './styles/FileTile.module.scss';

export interface FileTileProps {
  src: string;
  id: string;
  className?: string;
  modalTitle?: string;
  onModalOpen?: () => void;
  onModalClose?: () => void;
}

const baseURL = '/openmrs/auth?requested_document=/document_images/';

export const FileTile: React.FC<FileTileProps> = ({
  src,
  id,
  className,
  modalTitle,
  onModalOpen,
  onModalClose,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleThumbnailClick = () => {
    setIsModalOpen(true);
    onModalOpen?.();
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    onModalClose?.();
  };

  return (
    <>
      <button
        id={id}
        data-testid={`${id}-test-id`}
        aria-label={`${id}-aria-label`}
        type="button"
        className={classNames(styles.fileTileButton, className)}
        onClick={handleThumbnailClick}
      >
        <DocumentView
          id={`${id}-document-thumbnail`}
          data-testid={`${id}-document-thumbnail-test-id`}
          aria-label={`${id}-document-thumbnail-aria-label`}
          size={24}
        />
      </button>

      {isModalOpen && (
        <Modal
          open={isModalOpen}
          onRequestClose={handleModalClose}
          modalHeading={modalTitle}
          passiveModal
          size="lg"
          id="modalIdForActionAreaLayout"
          testId={`${id}-modal-test-id`}
        >
          <div className={styles.modalIframeContainer}>
            <iframe
              id={`${id}-modal-iframe`}
              data-testid={`${id}-modal-iframe-test-id`}
              aria-label={`${id}-modal-iframe-aria-label`}
              src={baseURL + src}
              className={styles.modalIframe}
              title={modalTitle ?? 'Document Viewer'}
            />
          </div>
        </Modal>
      )}
    </>
  );
};

export default FileTile;
