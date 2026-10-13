import { uploadDocument } from '@bahmni/services';
import { revokeDocumentPreview } from '@bahmni/widgets';
import type { PendingDocument } from '@bahmni/widgets';
import { create } from 'zustand';
import { useEncounterDetailsStore } from '../../../stores/encounterDetailsStore';
import { DOCUMENTS_SELECT_TYPE_ERROR } from './constants';
import type { DocumentEntry, DocumentsState } from './models';
import {
  createEmptyEntry,
  isEntryEmpty,
  validateEntry,
  withoutError,
} from './utils';

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const useDocumentsStore = create<DocumentsState>((set, get) => {
  const updateEntry = (
    id: string,
    update: (entry: DocumentEntry) => Partial<DocumentEntry>,
  ) =>
    set((state) => ({
      entries: state.entries.map((entry) =>
        entry.id === id ? { ...entry, ...update(entry) } : entry,
      ),
    }));

  const updateFile = (
    entryId: string,
    fileId: string,
    patch: Partial<PendingDocument>,
  ) =>
    updateEntry(entryId, (entry) => ({
      // A file removed while its upload was in flight stays removed.
      files: entry.files.map((file) =>
        file.id === fileId ? { ...file, ...patch } : file,
      ),
    }));

  const uploadFile = async (entryId: string, selected: PendingDocument) => {
    const { patientUUID, selectedEncounterType } =
      useEncounterDetailsStore.getState();
    try {
      const { url } = await uploadDocument(
        selected.file,
        selectedEncounterType?.name ?? '',
        patientUUID ?? '',
      );
      updateFile(entryId, selected.id, {
        status: 'uploaded',
        uploadedUrl: url,
        error: undefined,
      });
    } catch (error) {
      updateFile(entryId, selected.id, {
        status: 'error',
        error: messageOf(error),
      });
    }
  };

  return {
    entries: [],
    attributes: undefined,

    setAttributes: (attributes) => set({ attributes }),

    addEntry: () => {
      const entry = createEmptyEntry();
      set((state) => ({ entries: [...state.entries, entry] }));
      return entry.id;
    },

    removeEntry: (id) => {
      get()
        .entries.find((entry) => entry.id === id)
        ?.files.forEach(revokeDocumentPreview);
      set((state) => ({
        entries: state.entries.filter((entry) => entry.id !== id),
      }));
    },

    updateDocumentType: (id, documentType) =>
      updateEntry(id, ({ errors }) => ({
        documentType,
        errors: withoutError(errors, 'documentType'),
      })),

    updateDocumentId: (id, documentId) =>
      updateEntry(id, ({ errors }) => ({
        documentId,
        errors: withoutError(errors, 'documentId'),
      })),

    updateNote: (id, note) => updateEntry(id, () => ({ note })),

    setFiles: (id, files) => {
      const known = new Set(
        get()
          .entries.find((entry) => entry.id === id)
          ?.files.map((file) => file.id),
      );
      const next = files.map(
        (file): PendingDocument =>
          known.has(file.id) ? file : { ...file, status: 'uploading' },
      );
      updateEntry(id, ({ errors }) => ({
        files: next,
        errors: withoutError(errors, 'files'),
      }));
      next
        .filter((file) => !known.has(file.id))
        .forEach((file) => void uploadFile(id, file));
    },

    showDocumentTypeRequired: (id) =>
      updateEntry(id, (entry) => ({
        errors: { ...entry.errors, documentType: DOCUMENTS_SELECT_TYPE_ERROR },
      })),

    validateAll: () => {
      const { attributes } = get();
      let isValid = true;
      set((state) => ({
        entries: state.entries.map((entry) => {
          if (isEntryEmpty(entry)) {
            return entry;
          }
          const errors = validateEntry(entry, attributes);
          isValid &&= Object.keys(errors).length === 0;
          return { ...entry, errors };
        }),
      }));
      return isValid;
    },

    hasData: () => get().entries.some((entry) => !isEntryEmpty(entry)),

    reset: () => {
      get().entries.forEach((entry) =>
        entry.files.forEach(revokeDocumentPreview),
      );
      set({ entries: [], attributes: undefined });
    },
  };
});

export default useDocumentsStore;
