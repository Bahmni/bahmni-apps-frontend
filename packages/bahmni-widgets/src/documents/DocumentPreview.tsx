import { Icon, ICON_SIZE, Modal } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import React, { useState } from 'react';
import styles from './styles/DocumentPreview.module.scss';
import { buildDocumentUrl } from './utils';

export interface DocumentPreviewAttachment {
  url: string;
  contentType?: string;
}

export interface DocumentPreviewProps {
  id: string;
  title: string;
  attachments: DocumentPreviewAttachment[];
}

type AttachmentKind = 'image' | 'video' | 'file';

const IMAGE_EXTENSIONS_RE = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i;

const kindOf = ({ url, contentType }: DocumentPreviewAttachment) => {
  const type = (contentType ?? '').toLowerCase();
  if (type.includes('image') || IMAGE_EXTENSIONS_RE.test(url)) {
    return 'image' as AttachmentKind;
  }
  return (type.includes('video') ? 'video' : 'file') as AttachmentKind;
};

const AttachmentContent: React.FC<{
  attachment: DocumentPreviewAttachment;
  title: string;
}> = ({ attachment, title }) => {
  const src = buildDocumentUrl(attachment.url);
  const kind = kindOf(attachment);

  if (kind === 'image') {
    return <img src={src} alt={title} className={styles.image} />;
  }
  if (kind === 'video') {
    return <video src={src} title={title} controls className={styles.video} />;
  }
  const isPdf = (attachment.contentType ?? '').toLowerCase().includes('pdf');
  return (
    <iframe
      src={isPdf ? `${src}#toolbar=0` : src}
      title={title}
      className={styles.iframe}
    />
  );
};

/**
 * One thumbnail per document. Opening it previews every attachment of the
 * document, one below the other, instead of only the first file.
 */
export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  id,
  title,
  attachments,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [first] = attachments;
  const total = attachments.length;
  const isImageThumbnail =
    !!first && kindOf(first) === 'image' && buildDocumentUrl(first.url) !== '#';

  return (
    <>
      <button
        id={id}
        type="button"
        data-testid={`${id}-test-id`}
        aria-label={t('DOCUMENTS_PREVIEW_OPEN', { title, count: total })}
        className={styles.thumbnailButton}
        onClick={() => setIsOpen(true)}
      >
        {isImageThumbnail ? (
          <img
            src={buildDocumentUrl(first.url)}
            alt=""
            loading="lazy"
            className={styles.thumbnailImage}
          />
        ) : (
          <Icon id={`${id}-icon`} name="fa-file-alt" size={ICON_SIZE.LG} />
        )}
      </button>

      {isOpen && (
        <Modal
          open
          passiveModal
          size="lg"
          id="modalIdForActionAreaLayout"
          portalId="main-display-area"
          modalHeading={title}
          onRequestClose={() => setIsOpen(false)}
          testId={`${id}-modal-test-id`}
        >
          <div className={styles.attachments}>
            {attachments.map((attachment, index) => (
              <div
                key={`${id}:${attachment.url}`}
                className={styles.attachment}
                data-testid={`${id}-attachment-${index}-test-id`}
              >
                {total > 1 && (
                  <p className={styles.counter}>
                    {t('DOCUMENTS_ATTACHMENT_COUNTER', {
                      current: index + 1,
                      total,
                    })}
                  </p>
                )}
                {buildDocumentUrl(attachment.url) === '#' ? (
                  <p className={styles.error}>
                    {t('DOCUMENTS_ERROR_LOADING_ATTACHMENT')}
                  </p>
                ) : (
                  <AttachmentContent attachment={attachment} title={title} />
                )}
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
};

export default DocumentPreview;
