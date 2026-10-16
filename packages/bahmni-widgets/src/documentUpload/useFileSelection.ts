import { useTranslation } from '@bahmni/services';
import { useCallback, useMemo } from 'react';
import { useNotification } from '../notification';
import { FILE_INPUT_ACCEPT } from './constants';
import {
  exceedsMaxFileSize,
  hasSupportedExtension,
  isAcceptedFileType,
  toDottedExtension,
} from './utils';

export interface FileSelectionOptions {
  /** Extensions such as ".pdf" or "png". Any image, video or PDF is accepted when not set. */
  supportedFileTypes?: string[];
  /** No client-side size limit when not set; the backend remains the authority. */
  maxFileSizeMb?: number;
}

const NOTIFICATION_TIMEOUT_MS = 5000;

/**
 * Validates files picked for upload against the accepted types and the size limit, telling the
 * user about every rejection. Holds no file state: callers decide what to do with the accepted files.
 */
export const useFileSelection = ({
  supportedFileTypes,
  maxFileSizeMb,
}: FileSelectionOptions = {}) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();

  const accept = useMemo(
    () =>
      supportedFileTypes?.length
        ? supportedFileTypes.map(toDottedExtension)
        : FILE_INPUT_ACCEPT.split(','),
    [supportedFileTypes],
  );

  const isSupported = useCallback(
    (file: File) =>
      supportedFileTypes?.length
        ? hasSupportedExtension(file.name, supportedFileTypes)
        : isAcceptedFileType(file.type),
    [supportedFileTypes],
  );

  const selectFiles = useCallback(
    (files: File[]): File[] => {
      const accepted: File[] = [];
      let hasUnsupported = false;
      let hasTooLarge = false;

      files.forEach((file) => {
        if (!isSupported(file)) {
          hasUnsupported = true;
        } else if (exceedsMaxFileSize(file, maxFileSizeMb)) {
          hasTooLarge = true;
        } else {
          accepted.push(file);
        }
      });

      if (hasUnsupported) {
        addNotification({
          title: t('DOCUMENT_UPLOAD_INVALID_TYPE_TITLE'),
          message: t('DOCUMENT_UPLOAD_INVALID_TYPE_MESSAGE'),
          type: 'error',
          timeout: NOTIFICATION_TIMEOUT_MS,
        });
      }
      if (hasTooLarge) {
        addNotification({
          title: t('DOCUMENT_UPLOAD_SIZE_EXCEEDED_TITLE'),
          message: t('DOCUMENT_UPLOAD_SIZE_EXCEEDED_MESSAGE', {
            size: maxFileSizeMb,
          }),
          type: 'error',
          timeout: NOTIFICATION_TIMEOUT_MS,
        });
      }

      return accepted;
    },
    [isSupported, maxFileSizeMb, addNotification, t],
  );

  return { accept, selectFiles };
};
