import { Image } from '@carbon/icons-react';
import classNames from 'classnames';
import React, { useState } from 'react';
import { Modal } from '../../atoms/modal';
import { DOCUMENT_AUTH_BASE_URL } from '../shared/constants';
import styles from './styles/ImageTile.module.scss';

export interface ImageTileProps {
  imageSrc: string;
  alt: string;
  id: string;
  hideThumbnail?: boolean;
  className?: string;
  modalTitle?: string;
  onModalOpen?: () => void;
  onModalClose?: () => void;
}

export const ImageTile: React.FC<ImageTileProps> = ({
  imageSrc,
  alt,
  id,
  hideThumbnail = false,
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
        className={classNames(styles.thumbnailButton, className, {
          [styles.hideThumbnail]: hideThumbnail,
        })}
        onClick={handleThumbnailClick}
      >
        {hideThumbnail ? (
          <Image
            id={`${id}-hidden-thumbnail`}
            data-testid={`${id}-hidden-thumbnail-test-id`}
            aria-label={`${id}-thumbnail-aria-label`}
            size={24}
            className={styles.imageIcon}
          />
        ) : (
          <img
            id={`${id}-thumbnail`}
            data-testid={`${id}-thumbnail-test-id`}
            aria-label={`${id}-thumbnail-aria-label`}
            src={DOCUMENT_AUTH_BASE_URL + imageSrc}
            alt={alt}
            className={styles.thumbnailImage}
            loading="lazy"
          />
        )}
      </button>

      {isModalOpen && (
        <Modal
          open={isModalOpen}
          onRequestClose={handleModalClose}
          modalHeading={modalTitle}
          passiveModal
          size="lg"
          id="modalIdForActionAreaLayout"
          portalId={'main-display-area'}
          testId={`${id}-modal-test-id`}
        >
          <div className={styles.modalImageContainer}>
            <img
              id={`${id}-modal-image`}
              data-testid={`${id}-modal-image-test-id`}
              aria-label={`${id}-modal-image-aria-label`}
              src={DOCUMENT_AUTH_BASE_URL + imageSrc}
              alt={alt}
              className={styles.modalImage}
            />
          </div>
        </Modal>
      )}
    </>
  );
};

export default ImageTile;
