import classNames from 'classnames';
import React, { useState } from 'react';
import { Modal } from '../../atoms/modal';
import styles from './styles/ImageTile.module.scss';

export interface ImageTileProps {
  imageSrc: string;
  alt: string;
  id: string;
  className?: string;
  modalTitle?: string;
  onModalOpen?: () => void;
  onModalClose?: () => void;
}

const baseURL = '/openmrs/auth?requested_document=/document_images/';

export const ImageTile: React.FC<ImageTileProps> = ({
  imageSrc,
  alt,
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
        className={classNames(styles.thumbnailButton, className)}
        onClick={handleThumbnailClick}
      >
        <img
          id={`${id}-thumbnail`}
          data-testid={`${id}-thumbnail-test-id`}
          aria-label={`${id}-thumbnail-aria-label`}
          src={baseURL + imageSrc}
          alt={alt}
          className={styles.thumbnailImage}
          loading="lazy"
        />
      </button>

      <Modal
        open={isModalOpen}
        onRequestClose={handleModalClose}
        modalHeading={modalTitle}
        passiveModal
        size="lg"
        id={`${id}-modal`}
        testId={`${id}-modal-test-id`}
      >
        <div className={styles.modalImageContainer}>
          <img
            id={`${id}-modal-image`}
            data-testid={`${id}-modal-image-test-id`}
            aria-label={`${id}-modal-image-aria-label`}
            src={baseURL + imageSrc}
            alt={alt}
            className={styles.modalImage}
          />
        </div>
      </Modal>
    </>
  );
};

export default ImageTile;
