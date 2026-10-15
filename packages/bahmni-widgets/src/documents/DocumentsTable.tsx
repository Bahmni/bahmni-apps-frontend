import {
  Button,
  Icon,
  ICON_SIZE,
  IconButton,
  InlineLoading,
  Link,
  Modal,
  SortableDataTable,
  Tile,
  TooltipIcon,
} from '@bahmni/design-system';
import {
  useTranslation,
  formatDateTime,
  getDocumentReferencePage,
  useSubscribeConsultationSaved,
  DocumentViewModel,
} from '@bahmni/services';
import { Printer } from '@carbon/icons-react';
import { useQuery } from '@tanstack/react-query';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  printPdfViaIframe,
  printViaIframe,
} from '../documentPrintButton/printViaIframe';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { WidgetActionConfig, WidgetProps } from '../registry/model';
import { useHasPrivilege } from '../userPrivileges/useHasPrivilege';
import styles from './styles/DocumentsTable.module.scss';
import {
  buildDocumentUrl,
  buildAttachmentPrintHtml,
  createDocumentHeaders,
  isPdfAttachment,
  PrintableAttachment,
  toPrintUrl,
} from './utils';

const CONSULTATION_START_EVENT = 'startConsultation';
const ADD_DOCUMENT_ACTION_TYPE = 'add';
const DOCUMENTS_INPUT_CONTROL_KEY = 'documents';

interface AddDocumentActionConfig extends WidgetActionConfig {
  encounterType?: string;
  editOnly?: string;
  editTitle?: string;
}

// Stands in for the printer icon on the button whose print is being prepared.
const PrintSpinner: React.FC = () => <InlineLoading />;

const SCROLL_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'PageUp',
  'PageDown',
  'Home',
  'End',
  ' ',
]);

// A frame that never reports loading must not keep printing disabled for good.
const ATTACHMENT_LOAD_TIMEOUT_MS = 15000;

const DEFAULT_DOCUMENT_FIELDS = [
  'documentIdentifier',
  'documentType',
  'attachments',
  'uploadedOn',
  'uploadedBy',
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
  // Attachments the viewer has finished loading; each shows a spinner until it has.
  const [loadedAttachments, setLoadedAttachments] = useState<Set<number>>(
    new Set(),
  );
  // The print run belongs to the open viewer: closing the viewer abandons what is left of it.
  const printAbortRef = useRef<AbortController | null>(null);
  // Which print button started the run, so only that one shows it is working.
  const [printingTarget, setPrintingTarget] = useState<number | 'all' | null>(
    null,
  );
  const isPrinting = printingTarget !== null;
  useEffect(() => () => printAbortRef.current?.abort(), []);
  const patientUUID = usePatientUUID();
  const { t } = useTranslation();
  const { addNotification } = useNotification();

  const addAction = useMemo(
    () =>
      (config?.actions as AddDocumentActionConfig[] | undefined)?.find(
        (action) => action.type === ADD_DOCUMENT_ACTION_TYPE,
      ),
    [config?.actions],
  );
  const hasAddPrivilege = useHasPrivilege(addAction?.requiredPrivilege);
  const showAddAction = !!addAction && hasAddPrivilege;

  const configPageSize = Number(config?.pageSize) || 5;

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPageSize, setSelectedPageSize] = useState(configPageSize);
  const [serverTotal, setServerTotal] = useState<number | undefined>(undefined);

  const handleViewAttachments = useCallback((doc: DocumentViewModel) => {
    setSelectedDoc(doc);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    printAbortRef.current?.abort();
    setLoadedAttachments(new Set());
    setIsModalOpen(false);
    setSelectedDoc(null);
    setFailedAttachments(new Set());
  }, []);

  const handleAttachmentLoaded = useCallback((index: number) => {
    setLoadedAttachments((prev) => new Set(prev).add(index));
  }, []);

  const handleAttachmentLoadError = useCallback((index: number) => {
    setFailedAttachments((prev) => new Set(prev).add(index));
  }, []);

  const handleAddDocument = useCallback(() => {
    if (!addAction) return;
    globalThis.dispatchEvent(
      new CustomEvent(CONSULTATION_START_EVENT, {
        detail: {
          encounterType: addAction.encounterType,
          editOnly: addAction.editOnly ?? DOCUMENTS_INPUT_CONTROL_KEY,
          ...(addAction.editTitle ? { editTitle: addAction.editTitle } : {}),
        },
      }),
    );
  }, [addAction]);

  const { data, isLoading, isError, error, refetch } = useQuery({
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

  useSubscribeConsultationSaved(
    (payload) => {
      if (
        payload.patientUUID === patientUUID &&
        payload.updatedResources.documents
      ) {
        refetch();
      }
    },
    [patientUUID, refetch],
  );

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

    void validateAttachments();

    return () => controller.abort();
  }, [isModalOpen, selectedDoc]);

  // A pdf grabs focus when it finishes loading, and the browser scrolls it into view: opened on a
  // document of several attachments the viewer jumps to the last one, under the user's hand. Hold
  // the viewer where it opened until the user scrolls it themselves.
  useEffect(() => {
    if (!isModalOpen || !selectedDoc) return;
    const scroller = document.querySelector<HTMLElement>(
      '[data-testid="document-view-modal"] .cds--modal-content',
    );
    if (!scroller) return;
    let userHasScrolled = false;
    const markScrolled = () => {
      userHasScrolled = true;
    };
    // Only what moves a viewer counts: a click on a button, or Enter on one, must not release the
    // hold, since a loading attachment can still scroll it right after.
    const markScrolledByScrollbar = (event: MouseEvent) => {
      if (event.target === scroller) markScrolled();
    };
    const markScrolledByKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        SCROLL_KEYS.has(event.key) &&
        !target?.closest('button, input, textarea, select, a')
      ) {
        markScrolled();
      }
    };
    const holdPosition = () => {
      if (!userHasScrolled && scroller.scrollTop !== 0) {
        scroller.scrollTop = 0;
      }
    };
    scroller.addEventListener('wheel', markScrolled, { passive: true });
    scroller.addEventListener('touchmove', markScrolled, { passive: true });
    scroller.addEventListener('mousedown', markScrolledByScrollbar);
    scroller.addEventListener('keydown', markScrolledByKey);
    scroller.addEventListener('scroll', holdPosition);
    return () => {
      scroller.removeEventListener('wheel', markScrolled);
      scroller.removeEventListener('touchmove', markScrolled);
      scroller.removeEventListener('mousedown', markScrolledByScrollbar);
      scroller.removeEventListener('keydown', markScrolledByKey);
      scroller.removeEventListener('scroll', holdPosition);
    };
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
        sortable: field !== 'attachments',
      })),
    [fields],
  );

  const normalizedAttachments = useMemo(
    () => (selectedDoc ? getNormalizedAttachments(selectedDoc) : []),
    [selectedDoc],
  );

  // Printing waits until the attachments have loaded (or failed): a pdf finishing its load takes
  // focus and scrolls the viewer, which swallowed a click and interrupted a print started meanwhile.
  const allAttachmentsLoaded = normalizedAttachments.every(
    (attachment, index) =>
      loadedAttachments.has(index) ||
      failedAttachments.has(index) ||
      buildDocumentUrl(attachment.url) === '#',
  );

  useEffect(() => {
    if (!isModalOpen || normalizedAttachments.length === 0) return;
    const timeoutId = setTimeout(
      () => setLoadedAttachments(new Set(normalizedAttachments.keys())),
      ATTACHMENT_LOAD_TIMEOUT_MS,
    );
    return () => clearTimeout(timeoutId);
  }, [isModalOpen, normalizedAttachments]);

  // One print run at a time: while it runs the print buttons are disabled, so a second click cannot
  // queue a second print that opens its preview again once the first is cancelled.
  const printAttachments = useCallback(
    async (
      attachments: PrintableAttachment[],
      trigger: HTMLElement | null,
      target: number | 'all',
    ) => {
      if (!selectedDoc || printAbortRef.current) return;
      const controller = new AbortController();
      const { signal } = controller;
      printAbortRef.current = controller;
      setPrintingTarget(target);
      // Every print frame goes inside the modal's own container, the only place its focus trap
      // allows focus: browsers focus the frame they print, and focus landing outside the modal
      // makes the trap pull it back, scrolling the modal to the bottom and interrupting the print.
      const container = trigger?.closest<HTMLElement>('.cds--modal-container');
      try {
        // Each file gets its own print preview, one after the other: the next opens once the
        // previous dialog has been closed.
        for (const attachment of attachments) {
          if (signal.aborted) break;
          if (isPdfAttachment(attachment)) {
            await printPdfViaIframe(toPrintUrl(attachment.url), {
              container,
              focus: false,
              signal,
            });
          } else {
            await printViaIframe(
              buildAttachmentPrintHtml(
                attachment,
                selectedDoc.documentIdentifier,
              ),
              { container, focus: false, signal },
            );
          }
        }
      } catch {
        if (!signal.aborted) {
          addNotification({
            title: t('ERROR_DEFAULT_TITLE'),
            message: t('DOCUMENTS_ERROR_LOADING_ATTACHMENT'),
            type: 'error',
          });
        }
      } finally {
        printAbortRef.current = null;
        setPrintingTarget(null);
      }
    },
    [selectedDoc, addNotification, t],
  );

  const printableAttachments = useMemo(
    () =>
      normalizedAttachments.filter(
        (attachment, index) =>
          buildDocumentUrl(attachment.url) !== '#' &&
          !failedAttachments.has(index),
      ),
    [normalizedAttachments, failedAttachments],
  );

  const renderCell = useCallback(
    (doc: DocumentViewModel, cellId: string) => {
      switch (cellId) {
        case 'documentIdentifier':
          return <span>{doc.documentIdentifier}</span>;
        case 'documentType':
          return (
            <div className={styles.documentTypeCell}>
              <span>{doc.documentType ?? t('DOCUMENTS_NOT_AVAILABLE')}</span>
              {doc.description && (
                <TooltipIcon
                  iconName="fa-file-lines"
                  content={doc.description}
                  ariaLabel={doc.description}
                  testId={`document-notes-${doc.id}`}
                />
              )}
            </div>
          );
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
        case 'attachments': {
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
      {showAddAction && (
        <Tile className={styles.header} testId="documents-header">
          <p>{t('DOCUMENTS_TABLE_HEADING')}</p>
          <IconButton
            autoAlign
            size="lg"
            kind="ghost"
            label={t(addAction.label)}
            testId="documents-add-button"
            onClick={handleAddDocument}
          >
            <Icon id="documents-add-icon" name="fa-plus" size={ICON_SIZE.LG} />
          </IconButton>
        </Tile>
      )}
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
            {printableAttachments.length > 1 && (
              <Button
                kind="tertiary"
                size="sm"
                className={styles.printAllButton}
                renderIcon={printingTarget === 'all' ? PrintSpinner : Printer}
                disabled={isPrinting || !allAttachmentsLoaded}
                testId="print-all-attachments"
                onClick={(event) =>
                  printAttachments(
                    printableAttachments,
                    event.currentTarget,
                    'all',
                  )
                }
              >
                {t('DOCUMENTS_PRINT_ALL')}
              </Button>
            )}
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
                  <div className={styles.attachmentHeader}>
                    {normalizedAttachments.length > 1 ? (
                      <p className={styles.attachmentCounter}>
                        {index + 1}/{normalizedAttachments.length}
                      </p>
                    ) : (
                      <span />
                    )}
                    <IconButton
                      kind="ghost"
                      size="sm"
                      label={t('DOCUMENTS_PRINT_ATTACHMENT', {
                        index: index + 1,
                      })}
                      disabled={isPrinting || !allAttachmentsLoaded}
                      testId={`print-attachment-${index}`}
                      onClick={(event) =>
                        printAttachments(
                          [attachment],
                          event.currentTarget,
                          index,
                        )
                      }
                    >
                      {printingTarget === index ? (
                        <PrintSpinner />
                      ) : (
                        <Printer />
                      )}
                    </IconButton>
                  </div>
                  <div className={styles.attachmentContent}>
                    {!loadedAttachments.has(index) && (
                      <div
                        className={styles.attachmentLoading}
                        data-testid={`attachment-loading-${index}`}
                      >
                        <InlineLoading
                          description={t('DOCUMENTS_LOADING_ATTACHMENT')}
                        />
                      </div>
                    )}
                    {isImg ? (
                      <img
                        src={url}
                        alt={selectedDoc.documentIdentifier}
                        className={`${styles.documentImage} ${
                          loadedAttachments.has(index)
                            ? ''
                            : styles.hiddenWhileLoading
                        }`}
                        onLoad={() => handleAttachmentLoaded(index)}
                        onError={() => handleAttachmentLoadError(index)}
                      />
                    ) : (
                      <iframe
                        src={isPdf ? `${url}#toolbar=0` : url}
                        className={`${styles.documentIframe} ${
                          loadedAttachments.has(index)
                            ? ''
                            : styles.hiddenWhileLoading
                        }`}
                        title={selectedDoc.documentIdentifier}
                        onLoad={() => handleAttachmentLoaded(index)}
                        onError={() => handleAttachmentLoadError(index)}
                      />
                    )}
                  </div>
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
