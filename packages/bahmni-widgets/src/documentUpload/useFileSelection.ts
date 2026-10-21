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
  supportedFileTypes?: string[];
  maxFileSizeMb?: number;
}

const NOTIFICATION_TIMEOUT_MS = 5000;

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
