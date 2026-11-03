import { ImportType, uploadImportFile, useTranslation } from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { PROGRESS_INDICATOR_MIN_FILE_SIZE_BYTES } from '../constants/app';
import { IMPORTED_ITEMS_QUERY_KEY } from './useImportedItems';

// Legacy sent this from the bahmni.admin.csv extension params; the default config leaves it empty.
const PATIENT_MATCHING_ALGORITHM = '';

export interface UploadState {
  fileName: string;
  fileIndex: number;
  fileCount: number;
  percent: number;
  showProgress: boolean;
}

/**
 * Uploads files one at a time, as the legacy queue did. The success notification only says the
 * upload request went through; the import outcome is shown in the history table. A failed file
 * does not stop the rest, and the history reloads once after the last file finishes.
 *
 * This flow deliberately does not use `useMutation`: it uploads a batch of files sequentially,
 * tracks per-file progress via `uploadState`, and must continue after an individual file fails
 * (partial failure), which doesn't map cleanly onto a single mutation's success/error lifecycle.
 */
export const useCsvUpload = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();
  const [uploadState, setUploadState] = useState<UploadState | null>(null);

  const upload = useCallback(
    async (files: File[], importType: ImportType) => {
      for (const [index, file] of files.entries()) {
        setUploadState({
          fileName: file.name,
          fileIndex: index + 1,
          fileCount: files.length,
          percent: 0,
          showProgress: file.size > PROGRESS_INDICATOR_MIN_FILE_SIZE_BYTES,
        });
        try {
          await uploadImportFile(
            importType.url,
            file,
            PATIENT_MATCHING_ALGORITHM,
            ({ loaded, total }) => {
              if (!total) return;
              const percent = Math.min(100, Math.round((loaded / total) * 100));
              setUploadState((prev) => (prev ? { ...prev, percent } : prev));
            },
          );
          addNotification({
            title: t('ADMIN_CSV_UPLOAD_NOTIFICATION_TITLE'),
            message: t('ADMIN_CSV_UPLOAD_NOTIFICATION_MESSAGE', {
              fileName: file.name,
            }),
            type: 'success',
            timeout: 5000,
          });
        } catch (error) {
          // A request-level failure (network error, or a 500 before the server records the
          // import) leaves no history row, so surface it via a notification. Detailed per-record
          // errors still live in the history table for imports that do reach the server.
          // eslint-disable-next-line no-console
          console.error('CSV upload failed', file.name, error);
          addNotification({
            title: t('ADMIN_CSV_UPLOAD_ERROR_TITLE'),
            message: t('ADMIN_CSV_UPLOAD_ERROR_MESSAGE', {
              fileName: file.name,
            }),
            type: 'error',
            timeout: 5000,
          });
        }
      }
      setUploadState(null);
      await queryClient.invalidateQueries({
        queryKey: IMPORTED_ITEMS_QUERY_KEY,
      });
    },
    [addNotification, queryClient, t],
  );

  return { upload, uploadState, isUploading: uploadState !== null };
};
