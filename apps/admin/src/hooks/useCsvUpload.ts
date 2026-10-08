import { ImportType, uploadImportFile } from '@bahmni/services';
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

interface UseCsvUploadOptions {
  notificationTitle: string;
  notificationMessage: (fileName: string) => string;
}

/**
 * Uploads files one at a time, as the legacy queue did. The notification only says the
 * upload request went through; the import outcome is shown in the history table. A failed file does not
 * stop the rest, and the history reloads once after the last file finishes.
 */
export const useCsvUpload = ({
  notificationTitle,
  notificationMessage,
}: UseCsvUploadOptions) => {
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
              const percent = Math.round((loaded / total) * 100);
              setUploadState((prev) => (prev ? { ...prev, percent } : prev));
            },
          );
          addNotification({
            title: notificationTitle,
            message: notificationMessage(file.name),
            type: 'success',
            timeout: 5000,
          });
        } catch {
          // Legacy shows nothing for a failed request; the history table reports the outcome.
        }
      }
      setUploadState(null);
      await queryClient.invalidateQueries({
        queryKey: IMPORTED_ITEMS_QUERY_KEY,
      });
    },
    [addNotification, queryClient, notificationTitle, notificationMessage],
  );

  return { upload, uploadState, isUploading: uploadState !== null };
};
