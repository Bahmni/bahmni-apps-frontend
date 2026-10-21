import { uploadDocument } from '@bahmni/services';
import { isDocumentEntryEmpty, revokeDocumentPreview } from '@bahmni/widgets';
import type { DocumentEntry, PendingDocument } from '@bahmni/widgets';
import { create } from 'zustand';
import { useEncounterDetailsStore } from '../../../stores/encounterDetailsStore';
import type { DocumentsState } from './models';
import { isDocumentUploaded, validateEntry } from './utils';

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
      files: entry.files.map((file) =>
        file.id === fileId ? { ...file, ...patch } : file,
      ),
    }));

  return {
    entries: [],
    attributes: undefined,

    setAttributes: (attributes) => set({ attributes }),

    setEntries: (entries) => set({ entries }),

    uploadPendingFiles: async () => {
      const { patientUUID, selectedEncounterType } =
        useEncounterDetailsStore.getState();
      const pending = get()
        .entries.filter((entry) => !isDocumentEntryEmpty(entry))
        .flatMap((entry) =>
          entry.files
            .filter((file) => !file.uploadedUrl)
            .map((file) => ({ entryId: entry.id, file })),
        );
      pending.forEach(({ entryId, file }) =>
        updateFile(entryId, file.id, { status: 'uploading', error: undefined }),
      );
      await Promise.all(
        pending.map(async ({ entryId, file }) => {
          try {
            const { url } = await uploadDocument(
              file.file,
              selectedEncounterType?.name ?? '',
              patientUUID ?? '',
            );
            updateFile(entryId, file.id, {
              status: 'uploaded',
              uploadedUrl: url,
            });
          } catch (error) {
            updateFile(entryId, file.id, {
              status: 'error',
              error: messageOf(error),
            });
          }
        }),
      );
    },

    hasFailedUploads: () =>
      get().entries.some(
        (entry) => !isDocumentEntryEmpty(entry) && !isDocumentUploaded(entry),
      ),

    validateAll: () => {
      const { attributes } = get();
      let isValid = true;
      set((state) => ({
        entries: state.entries.map((entry) => {
          if (isDocumentEntryEmpty(entry)) {
            return entry;
          }
          const errors = validateEntry(entry, attributes);
          isValid &&= Object.keys(errors).length === 0;
          return { ...entry, errors };
        }),
      }));
      return isValid;
    },

    hasData: () => get().entries.some((entry) => !isDocumentEntryEmpty(entry)),

    reset: () => {
      get().entries.forEach((entry) =>
        entry.files.forEach(revokeDocumentPreview),
      );
      set({ entries: [], attributes: undefined });
    },
  };
});

export default useDocumentsStore;
