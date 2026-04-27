import { SortableDataTable, Modal, Link } from '@bahmni/design-system';
import {
  useTranslation,
  formatDateTime,
  getDocumentReferencePage,
  DocumentViewModel,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { WidgetProps } from '../registry/model';
import styles from './styles/DocumentsTable.module.scss';
import { buildDocumentUrl, createDocumentHeaders } from './utils';

const DEFAULT_DOCUMENT_FIELDS = [
  'documentIdentifier',
  'documentType',
  'uploadedOn',
  'uploadedBy',
  'action',
];

const IMAGE_EXTENSIONS_RE = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i;

const getNormalizedAttachments = (doc: DocumentViewModel) => {
  if (doc.attachments.length > 0) {
    return doc.attachments;
  }
  if (doc.documentUrl) {
    return [{ url: doc.documentUrl, contentType: doc.contentType }];
  }
  return [];
};

const DocumentsTable: React.FC<WidgetProps> = ({ config, encounterUuids }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentViewModel | null>(
    null,
  );
  const [failedAttachments, setFailedAttachments] = useState<Set<number>>(
    new Set(),
  );
  const patientUUID = usePatientUUID();
  const { t } = useTranslation();
  const { addNotification } = useNotification();

  const configPageSize = Number(config?.pageSize) || 5;

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPageSize, setSelectedPageSize] = useState(configPageSize);
  const [serverTotal, setServerTotal] = useState<number | undefined>(undefined);

  const handleViewAttachments = useCallback((doc: DocumentViewModel) => {
    setSelectedDoc(doc);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedDoc(null);
    setFailedAttachments(new Set());
  }, []);

  const handleAttachmentLoadError = useCallback((index: number) => {
    setFailedAttachments((prev) => new Set(prev).add(index));
  }, []);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      'documents',
      patientUUID!,
      encounterUuids,
      currentPage,
      selectedPageSize,
    ],
    enabled: !!patientUUID,
    queryFn: () =>
      getDocumentReferencePage(
        patientUUID!,
        encounterUuids,
        selectedPageSize,
        currentPage,
      ),
  });

  useEffect(() => {
    if (data) {
      setServerTotal(data.total);
    }
  }, [data]);

  useEffect(() => {
    setCurrentPage(1);
    setServerTotal(undefined);
  }, [patientUUID]);

  useEffect(() => {
    if (isError) {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: error?.message ?? '',
        type: 'error',
      });
    }
  }, [isError, error, addNotification, t]);

  useEffect(() => {
    const controller = new AbortController();

    const validateAttachments = async () => {
      if (!isModalOpen || !selectedDoc) return;

      const failed = new Set<number>();
      const attachments = getNormalizedAttachments(selectedDoc);

      for (let i = 0; i < attachments.length; i++) {
        const url = buildDocumentUrl(attachments[i].url);
        try {
          const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
          });
          if (!response.ok) {
            failed.add(i);
          }
        } catch (error) {
          if (error instanceof Error && error.name !== 'AbortError') {
            failed.add(i);
          }
        }
      }

      if (!controller.signal.aborted) {
        setFailedAttachments(failed);
      }
    };

    validateAttachments();

    return () => controller.abort();
  }, [isModalOpen, selectedDoc]);

  const handlePageChange = useCallback(
    (newPage: number, newPageSize: number) => {
      if (newPageSize !== selectedPageSize) {
        setSelectedPageSize(newPageSize);
        setCurrentPage(1);
        setServerTotal(undefined);
      } else {
        setCurrentPage(newPage);
      }
    },
    [selectedPageSize],
  );

  const fields = useMemo(
    () => (config?.fields as string[]) ?? DEFAULT_DOCUMENT_FIELDS,
    [config?.fields],
  );

  const sortedData = useMemo(() => {
    const docs = data?.documents ?? [];
    return [...docs].sort((a, b) => {
      if (!a.uploadedOn && !b.uploadedOn) return 0;
      if (!a.uploadedOn) return 1;
      if (!b.uploadedOn) return -1;
      return (
        new Date(b.uploadedOn).getTime() - new Date(a.uploadedOn).getTime()
      );
    });
  }, [data]);

  const headers = useMemo(() => createDocumentHeaders(fields, t), [fields, t]);

  const sortable = useMemo(
    () =>
      fields.map((field) => ({
        key: field,
        sortable: field !== 'action',
      })),
    [fields],
  );

  const normalizedAttachments = useMemo(
    () => (selectedDoc ? getNormalizedAttachments(selectedDoc) : []),
    [selectedDoc],
  );

  const renderCell = useCallback(
    (doc: DocumentViewModel, cellId: string) => {
      switch (cellId) {
        case 'documentIdentifier':
          return <span>{doc.documentIdentifier}</span>;
        case 'documentType':
          return doc.documentType ?? t('DOCUMENTS_NOT_AVAILABLE');
        case 'uploadedOn': {
          const formattedDate = formatDateTime(
            doc.uploadedOn,
            t,
            true,
          ).formattedResult;
          return formattedDate || t('DOCUMENTS_NOT_AVAILABLE');
        }
        case 'uploadedBy':
          return doc.uploadedBy ?? t('DOCUMENTS_NOT_AVAILABLE');
        case 'action': {
          const hasAttachments =
            doc.attachments.length > 0 || !!doc.documentUrl;
          if (!hasAttachments) return '--';
          return (
            <Link
              onClick={() => handleViewAttachments(doc)}
              className={styles.viewAttachmentsLink}
              data-testid={`view-attachments-${doc.id}`}
            >
              {t('DOCUMENTS_VIEW_ATTACHMENTS')}
            </Link>
          );
        }
        default:
          return null;
      }
    },
    [handleViewAttachments, t],
  );

  return (
    <>
      <div data-testid="documents-table">
        <SortableDataTable
          headers={headers}
          ariaLabel={t('DOCUMENTS_TABLE_HEADING')}
          rows={sortedData}
          loading={isLoading}
          errorStateMessage={isError ? error?.message : null}
          sortable={sortable}
          emptyStateMessage={t('DOCUMENTS_NO_RECORDS')}
          renderCell={renderCell}
          className={styles.documentsTableBody}
          dataTestId="documents-table"
          pageSize={selectedPageSize}
          totalItems={serverTotal}
          page={currentPage}
          onPageChange={handlePageChange}
        />
      </div>

      {isModalOpen && selectedDoc && (
        <Modal
          id="modalIdForActionAreaLayout"
          portalId={'main-display-area'}
          open={isModalOpen}
          onRequestClose={handleCloseModal}
          modalHeading={selectedDoc.documentIdentifier}
          passiveModal
          size="lg"
          testId="document-view-modal"
        >
          <div className={styles.documentViewerContainer}>
            {normalizedAttachments.map((attachment, index) => {
              const url = buildDocumentUrl(attachment.url);
              const isPdf = attachment.contentType
                ?.toLowerCase()
                .includes('pdf');
              const isImg =
                (attachment.contentType?.toLowerCase().includes('image') ??
                  false) ||
                IMAGE_EXTENSIONS_RE.test(attachment.url ?? '');
              const hasFailed = failedAttachments.has(index);

              if (url === '#' || hasFailed) {
                return (
                  <div
                    key={`${selectedDoc.id}-${attachment.url}`}
                    className={styles.attachmentError}
                    data-testid={`attachment-error-${index}`}
                  >
                    {normalizedAttachments.length > 1 && (
                      <p className={styles.attachmentCounter}>
                        {index + 1}/{normalizedAttachments.length}
                      </p>
                    )}
                    <p>{t('DOCUMENTS_ERROR_LOADING_ATTACHMENT')}</p>
                  </div>
                );
              }
              return (
                <div
                  key={`${selectedDoc.id}-${attachment.url}`}
                  className={styles.attachmentItem}
                  data-testid={`attachment-item-${index}`}
                >
                  {normalizedAttachments.length > 1 && (
                    <p className={styles.attachmentCounter}>
                      {index + 1}/{normalizedAttachments.length}
                    </p>
                  )}
                  {isImg ? (
                    <img
                      src={url}
                      alt={selectedDoc.documentIdentifier}
                      className={styles.documentImage}
                      onError={() => handleAttachmentLoadError(index)}
                    />
                  ) : (
                    <iframe
                      src={isPdf ? `${url}#toolbar=0` : url}
                      className={styles.documentIframe}
                      title={selectedDoc.documentIdentifier}
                      onError={() => handleAttachmentLoadError(index)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Modal>
      )}
    </>
  );
};

export default DocumentsTable;
