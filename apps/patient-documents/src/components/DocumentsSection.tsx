import {
  Accordion,
  AccordionItem,
  Button,
  SkeletonPlaceholder,
} from '@bahmni/design-system';
import {
  DocumentViewModel,
  formatDateTime,
  getDocumentTypes,
  getFormattedError,
} from '@bahmni/services';
import {
  ConfirmationModal,
  DocumentSaveSummary,
  DocumentUpload,
  DocumentUploadHandle,
  renderDocumentTile,
  useNotification,
} from '@bahmni/widgets';
import { InlineLoading, TextArea } from '@carbon/react';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BAHMNI_PATIENT_DOCUMENTS_NAMESPACE } from '../constants/app';
import { useVisitDocuments } from '../hooks/useVisitDocuments';
import styles from './styles/DocumentsSection.module.scss';

interface DocumentEncounterType {
  uuid: string;
  name: string;
}

interface DocumentsSectionProps {
  patientUuid: string;
  documentEncounterType: DocumentEncounterType;
  topLevelConcept?: string | null;
  defaultOption?: string | null;
  // Where the footer's back button goes; the patient search lives in another Bahmni app.
  searchHref?: string;
}

const renderTile = (document: DocumentViewModel) =>
  renderDocumentTile({
    id: document.id,
    src: document.documentUrl,
    title: document.documentType ?? document.documentIdentifier,
    contentType: document.contentType,
  });

export const DocumentsSection: React.FC<DocumentsSectionProps> = ({
  patientUuid,
  documentEncounterType,
  topLevelConcept,
  defaultOption,
  searchHref,
}) => {
  const { t } = useTranslation(BAHMNI_PATIENT_DOCUMENTS_NAMESPACE);
  const { addNotification } = useNotification();
  const { visitGroups, isLoading, error, refetch } = useVisitDocuments(
    patientUuid,
    [documentEncounterType.uuid],
  );

  // Each visit has its own upload widget; the footer Save drives them, so it needs a handle on
  // every one of them plus a note of which ones actually hold a file waiting to be saved.
  const uploadHandles = useRef(new Map<string, DocumentUploadHandle>());
  const [visitsWithPendingDocument, setVisitsWithPendingDocument] = useState<
    string[]
  >([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLeaveConfirmationOpen, setIsLeaveConfirmationOpen] = useState(false);

  const hasUnsavedDocuments = visitsWithPendingDocument.length > 0;

  // Every exit other than the footer's own back button — a breadcrumb, a reload, closing the tab —
  // is handled by the browser, which allows nothing but its native prompt: once unloading starts a
  // modal of ours can no longer be shown, let alone waited on.
  useEffect(() => {
    if (!hasUnsavedDocuments) {
      return;
    }
    const confirmUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Legacy browsers need a returnValue set to raise the prompt at all.
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', confirmUnload);
    return () => window.removeEventListener('beforeunload', confirmUnload);
  }, [hasUnsavedDocuments]);

  // The back button stays a real link (so it can be opened in a new tab); with unsaved documents
  // the navigation is held back until the user confirms.
  const handleBackToSearch = (event: React.MouseEvent) => {
    if (!hasUnsavedDocuments) {
      return;
    }
    event.preventDefault();
    setIsLeaveConfirmationOpen(true);
  };

  const leaveToSearch = () => {
    setIsLeaveConfirmationOpen(false);
    if (searchHref) {
      window.location.href = searchHref;
    }
  };

  const handlePendingChange = useCallback(
    (visitKey: string, hasPendingDocument: boolean) => {
      setVisitsWithPendingDocument((previous) => {
        if (previous.includes(visitKey) === hasPendingDocument) {
          return previous;
        }
        return hasPendingDocument
          ? [...previous, visitKey]
          : previous.filter((key) => key !== visitKey);
      });
    },
    [],
  );

  // Exactly one notification per Save, whatever it covered: every document of every visit, saved
  // or failed, is counted into a single message rather than each upload announcing itself.
  const notifySaveOutcome = (summaries: DocumentSaveSummary[]) => {
    const savedCount = summaries.reduce(
      (total, summary) => total + summary.savedCount,
      0,
    );
    const failures = summaries.flatMap((summary) => summary.failures);
    if (savedCount === 0 && failures.length === 0) {
      return;
    }

    if (failures.length === 0) {
      addNotification({
        title: t('DOCUMENT_UPLOAD_SAVE_SUCCESS_TITLE'),
        message:
          savedCount === 1
            ? t('DOCUMENT_UPLOAD_SAVE_SUCCESS_MESSAGE')
            : t('DOCUMENT_UPLOAD_SAVE_SUCCESS_MESSAGE_MULTIPLE', {
                count: savedCount,
              }),
        type: 'success',
      });
      return;
    }

    if (savedCount > 0) {
      addNotification({
        title: t('DOCUMENT_UPLOAD_SAVE_PARTIAL_TITLE'),
        message: t('DOCUMENT_UPLOAD_SAVE_PARTIAL_MESSAGE', {
          saved: savedCount,
          total: savedCount + failures.length,
          failed: failures.length,
        }),
        type: 'warning',
      });
      return;
    }

    addNotification({
      title: t('DOCUMENT_UPLOAD_SAVE_FAILED_TITLE'),
      // A single failure shows the server's reason verbatim; a batch is only counted, since one
      // message cannot carry a reason per file.
      message:
        failures.length === 1
          ? failures[0].message
          : t('DOCUMENT_UPLOAD_SAVE_FAILED_MESSAGE_MULTIPLE', {
              count: failures.length,
            }),
      type: 'error',
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // save() never rejects — it reports per-document outcomes — so one failing visit cannot stop
      // the others from being saved.
      const summaries = await Promise.all(
        visitsWithPendingDocument.map((visitKey) =>
          uploadHandles.current.get(visitKey)?.save(),
        ),
      );
      notifySaveOutcome(
        summaries.filter(
          (summary): summary is DocumentSaveSummary => !!summary,
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const { data: documentTypes, error: documentTypesError } = useQuery({
    queryKey: ['documentTypes', topLevelConcept],
    queryFn: () => getDocumentTypes(topLevelConcept!),
    enabled: !!topLevelConcept,
  });

  // Document types populate an optional dropdown, so a failure must not block upload — but the
  // user should still be told the list could not be loaded rather than seeing an empty dropdown.
  useEffect(() => {
    if (documentTypesError) {
      const { title, message } = getFormattedError(documentTypesError);
      addNotification({ title, message, type: 'error' });
    }
  }, [documentTypesError, addNotification]);

  if (isLoading) {
    return (
      <SkeletonPlaceholder
        className={styles.skeleton}
        testId="document-section-skeleton"
      />
    );
  }

  if (error) {
    return (
      <section className={styles.documents} aria-label={t('DOCUMENTS_TITLE')}>
        <h2 className={styles.heading}>{t('DOCUMENTS_TITLE')}</h2>
        <p className={styles.loadError}>{getFormattedError(error).message}</p>
      </section>
    );
  }

  // Documents are attached to visits; with no visits there is nothing to show or upload into.
  if (visitGroups.length === 0) {
    return null;
  }

  return (
    <section className={styles.documents} aria-label={t('DOCUMENTS_TITLE')}>
      <h2 className={styles.heading}>{t('DOCUMENTS_TITLE')}</h2>
      <Accordion align="start">
        {visitGroups.map((group, index) => {
          const period = group.visit.period;
          const startDate = period?.start
            ? formatDateTime(period.start, t).formattedResult
            : '';
          const endDate = period?.end
            ? formatDateTime(period.end, t).formattedResult
            : '';
          let visitLabel = t('DOCUMENTS_VISIT');
          if (startDate && endDate) {
            // A visit that begins and ends on the same day reads better as "Visit on <date>" than
            // as a range repeating one date twice. Compared on the formatted values rather than the
            // raw timestamps, so the label can never disagree with the dates it would have shown.
            visitLabel =
              startDate === endDate
                ? t('DOCUMENTS_VISIT_ON', { date: startDate })
                : t('DOCUMENTS_VISIT_FROM_TO', {
                    start: startDate,
                    end: endDate,
                  });
          } else if (startDate) {
            visitLabel = t('DOCUMENTS_VISIT_ON', { date: startDate });
          }
          const saveTarget = group.documentEncounterUuid
            ? { encounterUuid: group.documentEncounterUuid }
            : {
                createEncounterInVisit: {
                  visitUuid: group.visit.id ?? '',
                  encounterTypeUuid: documentEncounterType.uuid,
                  encounterTypeDisplay: documentEncounterType.name,
                },
              };

          const visitKey = group.visit.id ?? `visit-${index}`;

          return (
            <AccordionItem key={visitKey} title={visitLabel} open={index === 0}>
              {group.documents.length > 0 && (
                <div className={styles.table}>
                  <div className={styles.headerRow}>
                    <span className={styles.fileCol}>
                      {t('DOCUMENTS_COL_FILE')}
                    </span>
                    <span className={styles.typeCol}>
                      {t('DOCUMENTS_COL_TYPE')}
                    </span>
                    <span className={styles.actionsCol}>
                      {t('DOCUMENTS_COL_ACTIONS')}
                    </span>
                  </div>
                  {group.documents.map((document) => (
                    <div key={document.id} className={styles.docItem}>
                      <div className={styles.docRow}>
                        <div className={styles.fileCell}>
                          {renderTile(document)}
                        </div>
                        <div className={styles.typeCell}>
                          {document.documentType}
                        </div>
                        <div className={styles.actionsCell} />
                      </div>
                      {document.description && (
                        <TextArea
                          id={`note-${document.id}`}
                          className={styles.note}
                          labelText=""
                          aria-label={t('DOCUMENT_UPLOAD_ADD_NOTE')}
                          rows={2}
                          readOnly
                          value={document.description}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              <DocumentUpload
                patientUuid={patientUuid}
                encounterTypeName={documentEncounterType.name}
                saveTarget={saveTarget}
                documentTypes={documentTypes}
                defaultOption={defaultOption}
                onSaved={refetch}
                onPendingChange={(hasPendingDocument) =>
                  handlePendingChange(visitKey, hasPendingDocument)
                }
                ref={(handle) => {
                  if (handle) {
                    uploadHandles.current.set(visitKey, handle);
                  } else {
                    uploadHandles.current.delete(visitKey);
                  }
                }}
              />
            </AccordionItem>
          );
        })}
      </Accordion>
      <div className={styles.footer}>
        <Button
          kind="tertiary"
          href={searchHref}
          onClick={handleBackToSearch}
          testId="back-to-search"
        >
          {t('PATIENT_DOCUMENTS_BACK_TO_SEARCH')}
        </Button>
        {isSaving ? (
          <InlineLoading
            data-testid="save-documents-loading"
            description={t('DOCUMENT_UPLOAD_SAVING')}
          />
        ) : (
          <Button
            onClick={handleSave}
            disabled={!hasUnsavedDocuments}
            testId="save-documents"
          >
            {t('DOCUMENT_UPLOAD_SAVE')}
          </Button>
        )}
      </div>
      <ConfirmationModal
        open={isLeaveConfirmationOpen}
        danger
        testId="unsaved-documents-modal"
        heading={t('PATIENT_DOCUMENTS_UNSAVED_MODAL_TITLE')}
        body={t('PATIENT_DOCUMENTS_UNSAVED_MODAL_BODY')}
        confirmLabel={t('PATIENT_DOCUMENTS_UNSAVED_MODAL_LEAVE')}
        cancelLabel={t('PATIENT_DOCUMENTS_UNSAVED_MODAL_STAY')}
        onConfirm={leaveToSearch}
        onCancel={() => setIsLeaveConfirmationOpen(false)}
      />
    </section>
  );
};
