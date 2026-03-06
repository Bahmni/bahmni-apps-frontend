import { SortableDataTable, Modal } from '@bahmni/design-system';
import {
  useTranslation,
  formatDate,
  DATE_TIME_FORMAT,
  getFormattedDocumentReferences,
  DocumentViewModel,
} from '@bahmni/services';
import { DocumentPdf, Image, Document } from '@carbon/icons-react';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { WidgetProps } from '../registry/model';
import { DOCUMENT_ICON_SIZE } from './constants';
import styles from './styles/DocumentsTable.module.scss';
import {
  getFileTypeCategory,
  buildDocumentUrl,
  createDocumentHeaders,
} from './utils';

const DEFAULT_DOCUMENT_FIELDS = [
  'documentIdentifier',
  'documentType',
  'uploadedOn',
  'uploadedBy',
];

const renderFileIcon = (contentType?: string) => {
  const fileType = getFileTypeCategory(contentType);
  switch (fileType) {
    case 'pdf':
      return (
        <DocumentPdf size={DOCUMENT_ICON_SIZE} className={styles.pdfIcon} />
      );
    case 'image':
      return <Image size={DOCUMENT_ICON_SIZE} className={styles.imageIcon} />;
    case 'document':
    default:
      return (
        <Document size={DOCUMENT_ICON_SIZE} className={styles.documentIcon} />
      );
  }
};

const DocumentsTable: React.FC<WidgetProps> = ({ config, encounterUuids }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentViewModel | null>(
    null,
  );
  const patientUUID = usePatientUUID();
  const { t } = useTranslation();
  const { addNotification } = useNotification();

  const handleIconClick = useCallback((doc: DocumentViewModel) => {
    setSelectedDoc(doc);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedDoc(null);
  }, []);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['documents', patientUUID!, encounterUuids],
    enabled: !!patientUUID,
    queryFn: () => getFormattedDocumentReferences(patientUUID!, encounterUuids),
  });

  useEffect(() => {
    if (isError) {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: error?.message ?? '',
        type: 'error',
      });
    }
  }, [isError, error, addNotification, t]);

  const fields = useMemo(
    () => (config?.fields as string[]) ?? DEFAULT_DOCUMENT_FIELDS,
    [config?.fields],
  );

  const headers = useMemo(() => createDocumentHeaders(fields, t), [fields, t]);

  const sortable = useMemo(
    () =>
      fields.map((field) => ({
        key: field,
        sortable: true,
      })),
    [fields],
  );

  const renderCell = useCallback(
    (doc: DocumentViewModel, cellId: string) => {
      switch (cellId) {
        case 'documentIdentifier':
          return (
            <div className={styles.nameCell}>
              <button
                className={styles.fileIconButton}
                onClick={() => handleIconClick(doc)}
                aria-label={`View ${doc.documentIdentifier}`}
                disabled={!doc.documentUrl}
              >
                {renderFileIcon(doc.contentType)}
              </button>
              <span>{doc.documentIdentifier}</span>
            </div>
          );
        case 'documentType':
          return doc.documentType ?? t('DOCUMENTS_NOT_AVAILABLE');
        case 'uploadedOn': {
          const formattedDate = formatDate(
            doc.uploadedOn,
            t,
            DATE_TIME_FORMAT,
          ).formattedResult;
          return formattedDate || t('DOCUMENTS_NOT_AVAILABLE');
        }
        case 'uploadedBy':
          return doc.uploadedBy ?? t('DOCUMENTS_NOT_AVAILABLE');
        default:
          return null;
      }
    },
    [handleIconClick, t],
  );

  const docUrl = selectedDoc ? buildDocumentUrl(selectedDoc.documentUrl) : '';
  const isPDF = selectedDoc?.contentType?.toLowerCase().includes('pdf');
  const isImage = selectedDoc?.contentType?.toLowerCase().includes('image');

  return (
    <>
      <div data-testid="documents-table">
        <SortableDataTable
          headers={headers}
          ariaLabel={t('DOCUMENTS_TABLE_HEADING')}
          rows={data ?? []}
          loading={isLoading}
          errorStateMessage={isError ? error?.message : null}
          sortable={sortable}
          emptyStateMessage={t('DOCUMENTS_NO_RECORDS')}
          renderCell={renderCell}
          className={styles.documentsTableBody}
          dataTestId="documents-table"
        />
      </div>

      {isModalOpen && selectedDoc && (
        <Modal
          id="documents-view-modal"
          open={isModalOpen}
          onRequestClose={handleCloseModal}
          modalHeading={selectedDoc.documentIdentifier}
          passiveModal
          size="lg"
          testId="document-view-modal"
        >
          <div className={styles.documentViewerContainer}>
            {isImage ? (
              <img
                src={docUrl}
                alt={selectedDoc.documentIdentifier}
                className={styles.documentImage}
              />
            ) : (
              <iframe
                src={isPDF ? `${docUrl}#toolbar=0` : docUrl}
                className={styles.documentIframe}
                title={selectedDoc.documentIdentifier}
              />
            )}
          </div>
        </Modal>
      )}
    </>
  );
};

export default DocumentsTable;
