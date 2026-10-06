import {
  Button,
  DataTable,
  DataTableColumn,
  Dropdown,
  Link,
  ProgressBar,
  Tile,
} from '@bahmni/design-system';
import {
  formatDateTime,
  getImportErrorFileUrl,
  hasImportError,
  ImportedItem,
  ImportType,
  IMPORT_TYPES,
  STATUS_COMPLETED_WITH_ERRORS,
  useTranslation,
} from '@bahmni/services';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { useCsvUpload } from '../hooks/useCsvUpload';
import { useImportedItems } from '../hooks/useImportedItems';
import styles from './styles/CsvUpload.module.scss';

const DATE_TIME_FORMAT = 'dd MMM yyyy h:mm aaa';

export const CsvUpload: React.FC = () => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedType, setSelectedType] = useState<ImportType | null>(null);
  const { data: importedItems = [], isLoading, isError } = useImportedItems();

  const successMessage = useCallback(
    (fileName: string) => t('ADMIN_CSV_UPLOAD_SUCCESS_MESSAGE', { fileName }),
    [t],
  );
  const { upload, uploadState, isUploading } = useCsvUpload({
    successTitle: t('ADMIN_CSV_UPLOAD_SUCCESS_TITLE'),
    successMessage,
  });

  const columns: DataTableColumn<ImportedItem>[] = useMemo(
    () => [
      { key: 'originalFileName', header: t('ADMIN_CSV_COLUMN_NAME') },
      { key: 'startTime', header: t('ADMIN_CSV_COLUMN_DATE') },
      { key: 'status', header: t('ADMIN_CSV_COLUMN_STATUS') },
      { key: 'errorMessage', header: t('ADMIN_CSV_COLUMN_ERROR_MESSAGE') },
      { key: 'download', header: t('ADMIN_CSV_COLUMN_DOWNLOAD') },
    ],
    [t],
  );

  const renderCell = useCallback(
    (item: ImportedItem, columnKey: string) => {
      switch (columnKey) {
        case 'startTime':
          return formatDateTime(item.startTime, t, false, DATE_TIME_FORMAT)
            .formattedResult;
        case 'errorMessage':
          if (item.errorMessage) return item.errorMessage;
          return item.status === STATUS_COMPLETED_WITH_ERRORS
            ? t('ADMIN_CSV_ERROR_SUMMARY_MESSAGE')
            : '';
        case 'download':
          return hasImportError(item) ? (
            <Link href={getImportErrorFileUrl(item)}>
              {t('ADMIN_CSV_ERROR_FILE_LINK')}
            </Link>
          ) : null;
        default:
          return (item as unknown as Record<string, React.ReactNode>)[
            columnKey
          ];
      }
    },
    [t],
  );

  const handleFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // Allow picking the same file again on the next click.
    event.target.value = '';
    if (selectedType && files.length > 0) {
      void upload(files, selectedType);
    }
  };

  return (
    <AdminLayout breadcrumbLabel={t('MODULE_LABEL_CSV_UPLOAD_KEY')}>
      <div
        id="admin-csv-upload-page"
        data-testid="admin-csv-upload-page-test-id"
        aria-label={t('MODULE_LABEL_CSV_UPLOAD_KEY')}
        className={styles.page}
      >
        <Tile className={styles.selectFiles}>
          <h2>{t('ADMIN_CSV_SELECT_FILES_HEADER')}</h2>
          <div className={styles.selectRow}>
            <Dropdown
              id="admin-csv-file-type"
              testId="admin-csv-file-type-dropdown"
              className={styles.typeDropdown}
              titleText={t('ADMIN_CSV_FILE_TYPE_LABEL')}
              hideLabel
              label={t('ADMIN_CSV_FILE_TYPE_LABEL')}
              items={[...IMPORT_TYPES]}
              itemToString={(item: ImportType | null) =>
                item ? t(item.labelKey) : ''
              }
              selectedItem={selectedType}
              onChange={({ selectedItem }: { selectedItem: ImportType }) =>
                setSelectedType(selectedItem)
              }
              disabled={isUploading}
            />
            <Button
              kind="primary"
              testId="admin-csv-upload-button"
              disabled={!selectedType || isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {t('ADMIN_CSV_UPLOAD_FILES_BUTTON')}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              data-testid="admin-csv-file-input"
              onChange={handleFilesSelected}
            />
          </div>
          {uploadState && (
            <ProgressBar
              testId="admin-csv-upload-progress"
              className={styles.progress}
              label={t('ADMIN_CSV_UPLOAD_PROGRESS_LABEL', {
                fileName: uploadState.fileName,
                current: uploadState.fileIndex,
                total: uploadState.fileCount,
              })}
              value={uploadState.percent}
              max={100}
              helperText={`${uploadState.percent}%`}
            />
          )}
        </Tile>

        <div className={styles.history}>
          <DataTable
            columns={columns}
            rows={importedItems}
            ariaLabel={t('ADMIN_CSV_UPLOADED_FILES_HEADER')}
            title={t('ADMIN_CSV_UPLOADED_FILES_HEADER')}
            dataTestId="admin-csv-uploaded-files-table"
            loading={isLoading}
            renderCell={renderCell}
            emptyStateMessage={t('ADMIN_CSV_NO_FILES_UPLOADED')}
            errorStateMessage={isError ? t('ADMIN_ERROR_FETCH_CONFIG') : null}
          />
        </div>
      </div>
    </AdminLayout>
  );
};
