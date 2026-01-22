import classNames from 'classnames';
import React, { useState } from 'react';
import { Modal } from '../../atoms/modal';
import styles from './styles/VideoTile.module.scss';

export interface VideoTileProps {
  videoSrc: string;
  id: string;
  className?: string;
  modalTitle?: string;
  onModalOpen?: () => void;
  onModalClose?: () => void;
}

const baseURL = '/openmrs/auth?requested_document=/document_images/';

export const VideoTile: React.FC<VideoTileProps> = ({
  videoSrc,
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
        <video
          id={`${id}-thumbnail`}
          data-testid={`${id}-thumbnail-test-id`}
          aria-label={`${id}-thumbnail-aria-label`}
          className={styles.thumbnailVideo}
          preload="metadata"
          muted
        >
          <source src={`${baseURL}${videoSrc}#t=0.1`} type="video/mp4" />
        </video>
        <div className={styles.playIconOverlay}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={styles.playIcon}
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
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
        <div className={styles.modalVideoContainer}>
          <video
            id={`${id}-modal-video`}
            data-testid={`${id}-modal-video-test-id`}
            aria-label={`${id}-modal-video-aria-label`}
            src={baseURL + videoSrc}
            className={styles.modalVideo}
            controls
            autoPlay
          />
        </div>
      </Modal>
    </>
  );
};

export default VideoTile;
