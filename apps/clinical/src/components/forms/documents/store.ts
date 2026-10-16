import { uploadDocument } from '@bahmni/services';
import { isDocumentEntryEmpty, revokeDocumentPreview } from '@bahmni/widgets';
import type { DocumentEntry, PendingDocument } from '@bahmni/widgets';
import { create } from 'zustand';
import { useEncounterDetailsStore } from '../../../stores/encounterDetailsStore';
import type { DocumentsState } from './models';
import { validateEntry } from './utils';

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

    setEntries: (next) => {
      const known = new Map(
        get().entries.map((entry) => [
          entry.id,
          new Set(entry.files.map((file) => file.id)),
        ]),
      );
      const added: Array<[string, PendingDocument]> = [];
      const entries = next.map((entry) => {
        const knownFiles = known.get(entry.id);
        const files = entry.files.map((file): PendingDocument => {
          if (knownFiles?.has(file.id)) {
            return file;
          }
          const uploading: PendingDocument = { ...file, status: 'uploading' };
          added.push([entry.id, uploading]);
          return uploading;
        });
        return { ...entry, files };
      });
      set({ entries });
      added.forEach(([entryId, file]) => void uploadFile(entryId, file));
    },

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
