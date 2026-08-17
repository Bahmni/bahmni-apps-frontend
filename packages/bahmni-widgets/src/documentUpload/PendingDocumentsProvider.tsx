import {
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
  DocumentSaveTarget,
  DocumentToSave,
  DocumentType,
  dispatchAuditEvent,
  getDocumentUploadMaxSizeMb,
  saveDocuments,
  uploadDocument,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useActivePractitioner } from '../activePractitioner';
import { useNotification } from '../notification';
import {
  PendingDocument,
  PendingDocumentsProviderProps,
  PendingDocumentsContextValue,
} from './models';
import { PendingDocumentsContext } from './PendingDocumentsContext';
import { isAcceptedFileType } from './utils';

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const revokePreview = (row: PendingDocument) => {
  if (row.url.startsWith('blob:')) {
    URL.revokeObjectURL(row.url);
  }
};

// Rows in selection order, split per visit. Each visit needs its own save call: the documents of a
// visit go to that visit's encounter, and a visit without one gets it created as part of the save.
const groupBySource = (rows: PendingDocument[]): PendingDocument[][] => {
  const groups = new Map<string, PendingDocument[]>();
  rows.forEach((row) => {
    const group = groups.get(row.sourceId) ?? [];
    group.push(row);
    groups.set(row.sourceId, group);
  });
  return Array.from(groups.values());
};

/**
 * Holds the files queued for upload across every visit on the page, so that one Save commits them
 * all. Each DocumentUpload widget reads back only the rows for its own visit.
 */
export const PendingDocumentsProvider: React.FC<
  PendingDocumentsProviderProps
> = ({
  patientUuid,
  encounterTypeName,
  documentTypes = [],
  defaultOption,
  onSaved,
  children,
}) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const { practitioner } = useActivePractitioner();
  const nextRowId = useRef(0);

  const [pending, setPending] = useState<PendingDocument[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Max size comes solely from the bahmni.documentUpload.maxFileSizeInMB setting; when it is not
  // set there is no client-side size limit (the backend remains the authority).
  const { data: maxFileSizeMb } = useQuery({
    queryKey: ['documentUploadMaxSizeMb'],
    queryFn: getDocumentUploadMaxSizeMb,
  });

  const effectiveType = (row: PendingDocument): DocumentType | null =>
    row.selectedType ??
    documentTypes.find(
      (documentType) =>
        documentType.label?.toLowerCase().trim() ===
        defaultOption?.toLowerCase().trim(),
    ) ??
    documentTypes[0] ??
    null;

  const pendingFor = (sourceId: string) =>
    pending.filter((row) => row.sourceId === sourceId);

  const updateRow = (id: string, changes: Partial<PendingDocument>) =>
    setPending((rows) =>
      rows.map((row) => (row.id === id ? { ...row, ...changes } : row)),
    );

  const discardRow = (id: string) => {
    const row = pending.find((candidate) => candidate.id === id);
    if (row) {
      revokePreview(row);
    }
    setPending((rows) => rows.filter((candidate) => candidate.id !== id));
  };

  const addFiles = (
    sourceId: string,
    saveTarget: DocumentSaveTarget,
    files: File[],
  ) => {
    const accepted: PendingDocument[] = [];
    const wrongType: string[] = [];
    const tooLarge: string[] = [];

    files.forEach((file) => {
      if (!isAcceptedFileType(file.type)) {
        wrongType.push(file.name);
        return;
      }
      if (
        maxFileSizeMb !== undefined &&
        file.size > maxFileSizeMb * 1000 * 1000
      ) {
        tooLarge.push(file.name);
        return;
      }
      accepted.push({
        id: `pending-${nextRowId.current++}`,
        sourceId,
        saveTarget,
        file,
        url: URL.createObjectURL(file),
        fileName: file.name,
        contentType: file.type,
        selectedType: null,
        note: '',
        showNote: false,
      });
    });

    // Rejected files are named, so a mixed selection makes clear which ones were skipped.
    if (wrongType.length > 0) {
      addNotification({
        title: t('DOCUMENT_UPLOAD_INVALID_TYPE_TITLE'),
        message: t('DOCUMENT_UPLOAD_INVALID_TYPE_MESSAGE', {
          files: wrongType.join(', '),
        }),
        type: 'error',
      });
    }
    if (tooLarge.length > 0) {
      addNotification({
        title: t('DOCUMENT_UPLOAD_SIZE_EXCEEDED_TITLE'),
        message: t('DOCUMENT_UPLOAD_SIZE_EXCEEDED_MESSAGE', {
          size: maxFileSizeMb,
          files: tooLarge.join(', '),
        }),
        type: 'error',
      });
    }
    if (accepted.length > 0) {
      setPending((rows) => [...rows, ...accepted]);
    }
  };

  const toDocument = (row: PendingDocument, url: string): DocumentToSave => {
    const type = effectiveType(row);
    return {
      url,
      contentType: row.contentType,
      title: row.fileName,
      typeCode: type?.id,
      typeDisplay: type?.label,
      description: row.note.trim() || undefined,
    };
  };

  const saveAll = async () => {
    if (pending.length === 0 || isSaving) {
      return;
    }
    setIsSaving(true);
    try {
      const savedIds: string[] = [];
      const failed: Array<{ fileName: string; error: unknown }> = [];

      for (const group of groupBySource(pending)) {
        // Bytes first, one file at a time. A file that fails here keeps its row so it can be
        // retried, and the files that did upload still go on to be saved.
        const uploaded: Array<{ row: PendingDocument; url: string }> = [];
        for (const row of group) {
          try {
            const { url } = await uploadDocument(
              row.file,
              encounterTypeName,
              patientUuid,
            );
            uploaded.push({ row, url });
          } catch (error) {
            failed.push({ fileName: row.fileName, error });
          }
        }
        if (uploaded.length === 0) {
          continue;
        }

        // One call per visit: when the visit has no document encounter yet this creates it once and
        // attaches all of that visit's documents to it, instead of one encounter per file.
        const result = await saveDocuments({
          patientUuid,
          authorPractitionerUuid: practitioner?.uuid,
          documents: uploaded.map(({ row, url }) => toDocument(row, url)),
          ...group[0].saveTarget,
        });

        result.failures.forEach(({ index, error }) =>
          failed.push({ fileName: uploaded[index].row.fileName, error }),
        );
        result.savedIndices.forEach((index) => {
          const { row } = uploaded[index];
          savedIds.push(row.id);
          revokePreview(row);
          dispatchAuditEvent({
            eventType: AUDIT_LOG_EVENT_DETAILS.UPLOAD_PATIENT_DOCUMENT
              .eventType as AuditEventType,
            patientUuid,
            messageParams: { encounterType: encounterTypeName },
            module: encounterTypeName,
          });
        });
      }

      if (savedIds.length > 0) {
        setPending((rows) => rows.filter((row) => !savedIds.includes(row.id)));
      }

      // Exactly one notification per save (AC 6): the three outcomes below are mutually exclusive
      // since every row ends up either saved or failed.
      if (failed.length === 0) {
        addNotification({
          title: t('DOCUMENT_UPLOAD_SAVE_SUCCESS_TITLE'),
          message:
            savedIds.length > 1
              ? t('DOCUMENT_UPLOAD_SAVE_SUCCESS_MESSAGE_MULTIPLE', {
                  count: savedIds.length,
                })
              : t('DOCUMENT_UPLOAD_SAVE_SUCCESS_MESSAGE'),
          type: 'success',
        });
      } else if (savedIds.length > 0) {
        addNotification({
          title: t('DOCUMENT_UPLOAD_SAVE_PARTIAL_TITLE'),
          message: t('DOCUMENT_UPLOAD_SAVE_PARTIAL_MESSAGE', {
            saved: savedIds.length,
            total: savedIds.length + failed.length,
            failed: failed.length,
          }),
          type: 'warning',
        });
      } else {
        addNotification({
          title: t('DOCUMENT_UPLOAD_SAVE_FAILED_TITLE'),
          // A lone failure shows the server's own message; several name the files to retry.
          message:
            failed.length === 1
              ? errorMessage(failed[0].error)
              : t('DOCUMENT_UPLOAD_SAVE_FAILED_MESSAGE_MULTIPLE', {
                  count: failed.length,
                  files: failed.map((failure) => failure.fileName).join(', '),
                }),
          type: 'error',
        });
      }

      // The page needs to refresh whenever anything saved, including a partial save.
      if (savedIds.length > 0) {
        onSaved?.();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const value: PendingDocumentsContextValue = {
    documentTypes,
    maxFileSizeMb,
    pendingCount: pending.length,
    isSaving,
    pendingFor,
    addFiles,
    updateRow,
    discardRow,
    effectiveType,
    saveAll,
  };

  return (
    <PendingDocumentsContext.Provider value={value}>
      {children}
    </PendingDocumentsContext.Provider>
  );
};

export default PendingDocumentsProvider;
