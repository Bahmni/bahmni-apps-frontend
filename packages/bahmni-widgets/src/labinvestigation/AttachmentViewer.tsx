import React from 'react';
import { Attachment } from './models';
import styles from './styles/LabInvestigation.module.scss';

// Base URL for lab attachments
const ATTACHMENTS_BASE_URL =
  '/openmrs/auth?requested_document=/uploaded_results/';

interface AttachmentViewerProps {
  attachment: Attachment;
  index: number;
  totalCount: number;
}

const AttachmentViewer: React.FC<AttachmentViewerProps> = ({
  attachment,
  index,
  totalCount,
}) => {
  const isPDF = attachment.contentType?.toLowerCase().includes('pdf');
  const isImage = attachment.contentType?.toLowerCase().includes('image');
  const iframeSrc = isPDF
    ? `${ATTACHMENTS_BASE_URL}${attachment.url}#toolbar=0`
    : `${ATTACHMENTS_BASE_URL}${attachment.url}`;

  return (
    <div className={styles.attachmentViewer}>
      {totalCount > 1 && (
        <div className={styles.attachmentNumber}>
          {index}/{totalCount}
        </div>
      )}
      {isImage ? (
        <img
          src={ATTACHMENTS_BASE_URL + attachment.url}
          alt={attachment.id || `Attachment ${index}`}
          className={styles.attachmentImage}
        />
      ) : (
        <iframe
          src={iframeSrc}
          className={styles.attachmentIframe}
          title={attachment.id || `Attachment ${index}`}
        />
      )}
    </div>
  );
};

export default AttachmentViewer;
